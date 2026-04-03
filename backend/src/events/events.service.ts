import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { DeleteResult } from "mongodb";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Event, EventDocument } from "./schemas/event.schema";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { RedisService } from "../redis/redis.service";
import { KafkaService } from "../kafka/kafka.service";
import { ContextAgentService } from "../agents/context-agent/context-agent.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UsersService } from "../users/users.service";
import { isFuzzyMatch } from "../lib/util";

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private redisService: RedisService,
    @Inject(forwardRef(() => KafkaService))
    private readonly kafkaService: KafkaService,
    @Inject(forwardRef(() => ContextAgentService))
    private readonly contextAgent: ContextAgentService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async proactiveReminderCron() {
    console.log("--- [REMINDER ENGINE]: Starting Proactive Check ---");
    const now = new Date();
    const tenMinsFromNow = new Date(now.getTime() + 15 * 60000);

    try {
      const upcomingEvents = await this.eventModel.find({
        start_time: { $gte: now, $lte: tenMinsFromNow },
        reminder_sent: false,
        status: { $ne: "cancelled" },
      });

      console.log(
        `[REMINDER ENGINE]: Found ${upcomingEvents.length} events starting soon.`,
      );

      for (const event of upcomingEvents) {
        const user = await this.usersService.findById(event.user_id.toString());
        if (user && user.email) {
          console.log(
            `[DISPATCH]: Sending 10-min reminder for "${event.title}" to ${user.email}`,
          );

          await this.notificationsService.sendProactiveReminder(
            event,
            user.email,
          );

          await this.eventModel.updateOne(
            { _id: event._id },
            { $set: { reminder_sent: true } },
          );
        } else {
          console.warn(
            `[REMINDER SKIP]: No valid user/email found for event ${event._id}`,
          );
        }
      }
    } catch (err: any) {
      console.error("[REMINDER CRON BUG]:", err.message);
    }
    console.log("--- [REMINDER ENGINE]: Check Complete ---");
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldEvents() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const result = await this.eventModel.deleteMany({
        end_time: { $lt: cutoff },
      });
      console.log(
        `[CLEANUP]: Purged ${result.deletedCount} events older than 24 hours.`,
      );
    } catch (err) {
      if (err instanceof Error) {
        console.error("[CLEANUP ERROR]:", err.message);
      } else {
        console.error("[CLEANUP ERROR]:", err);
      }
    }
  }

  private getUTCBoundary(
    dateStr: string,
    timeStr: string,
    timezone: string = "Asia/Kolkata",
  ): Date {
    const localString = `${dateStr}T${timeStr}:00`;
    return new Date(
      new Date(localString).toLocaleString("en-US", { timeZone: "UTC" }) +
        " UTC",
    );
  }

  private generateTimezoneDate(
    dateStr: string,
    timeStr: string,
    timezone: string,
  ) {
    return new Date(
      new Date(`${dateStr}T${timeStr}:00`).toLocaleString("en-US", {
        timeZone: timezone,
      }),
    );
  }

  async fuzzyFindEvent(userId: string, title: string) {
    const events = await this.findByUser(userId);
    return events.find((e) => isFuzzyMatch(e.title, title));
  }

  async countEventsForUser(userId: string): Promise<number> {
    return this.eventModel
      .countDocuments({ user_id: new Types.ObjectId(userId) })
      .exec();
  }

  async countEventsByEmail(email: string): Promise<number> {
    if (!email) return 0;
    return this.eventModel.countDocuments({ source_email: email }).exec();
  }

  async countEventsThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.eventModel
      .countDocuments({
        start_time: { $gte: startOfMonth },
      })
      .exec();
  }

  async getGlobalAnalytics(year: number, month: number) {
    const tzOffset = "+05:30";
    const startDateStr = `${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:30`;
    const startDate = new Date(startDateStr);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+05:30`;
    const endDate = new Date(new Date(endDateStr).getTime() - 1);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const baseMatch = { status: { $ne: "cancelled" } };

    const [totalMonth, totalWeek, heatmap, peaks, distribution, conflictCount] =
      await Promise.all([
        this.eventModel.countDocuments({
          ...baseMatch,
          start_time: { $gte: startDate, $lte: endDate },
        }),
        this.eventModel.countDocuments({
          ...baseMatch,
          start_time: { $gte: startOfWeek, $lte: endOfWeek },
        }),
        this.eventModel.aggregate([
          {
            $match: {
              ...baseMatch,
              start_time: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$start_time",
                  timezone: tzOffset,
                },
              },
              count: { $sum: 1 },
              dayOfWeek: {
                $first: {
                  $dayOfWeek: { date: "$start_time", timezone: tzOffset },
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        this.eventModel.aggregate([
          {
            $match: {
              ...baseMatch,
              start_time: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: { $hour: { date: "$start_time", timezone: tzOffset } },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        this.eventModel.aggregate([
          {
            $match: {
              ...baseMatch,
              start_time: { $gte: startDate, $lte: endDate },
            },
          },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),
        this.eventModel.countDocuments({
          ...baseMatch,
          start_time: { $gte: startDate, $lte: endDate },
          has_conflict: true,
        }),
      ]);

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    let busiestDayName = "--";
    if (heatmap.length > 0) {
      const dayCounts = new Array(8).fill(0);
      heatmap.forEach((h) => {
        if (h.dayOfWeek) dayCounts[h.dayOfWeek] += h.count;
      });
      const maxIdx = dayCounts.indexOf(Math.max(...dayCounts.slice(1)));
      busiestDayName = days[maxIdx - 1] || "--";
    }

    return {
      totalMonth,
      totalWeek,
      busiestDayName,
      conflictRate:
        totalMonth > 0
          ? ((conflictCount / totalMonth) * 100).toFixed(1) + "%"
          : "0%",
      calendarDays: heatmap.map((h) => ({ date: h._id, count: h.count })),
      peakHours: peaks.map((p) => ({
        hour: `${String(p._id).padStart(2, "0")}:00`,
        count: p.count,
      })),
      typeDistribution: distribution.map((d) => ({
        type: d._id,
        count: d.count,
      })),
    };
  }

  async create(userId: string, dto: any, timezone: string = "Asia/Kolkata") {
    let start = new Date(dto.start_time);
    let dur =
      dto.duration ||
      (dto.end_time
        ? (new Date(dto.end_time).getTime() - start.getTime()) / 60000
        : 60);
    let end = dto.end_time
      ? new Date(dto.end_time)
      : new Date(start.getTime() + dur * 60000);

    if (start >= end)
      throw new BadRequestException("End time must be after start time");

    const newScore = dto.severity_score || 50;
    let resolutionData: any = null;

    let currentStart = start;
    let currentEnd = end;
    const conflict = await this.checkConflict(userId, currentStart, currentEnd);

    if (conflict) {
      const existingScore = conflict.severity_score || 50;
      const isNewReschedulable = dto.is_reschedulable !== false;

      if (conflict.source === "calendar_sync") {
        if (!isNewReschedulable)
          throw new BadRequestException(
            "Incoming event conflicts with a sacred calendar event and cannot be rescheduled.",
          );
        const slots = await this.findFreeSlots(
          userId,
          currentStart.toISOString(),
          dur,
          timezone,
        );
        if (slots.length > 0) {
          currentStart = slots[0].start;
          currentEnd = slots[0].end;
          resolutionData = {
            action: "auto_rescheduled",
            reason: `Calendar events are protected. Rescheduled incoming event to next free slot.`,
          };
        } else {
          throw new BadRequestException(
            "Conflict with calendar event and no free slots available.",
          );
        }
      } else if (newScore > existingScore) {
        if (
          conflict.is_reschedulable === false ||
          conflict.is_flexible === false
        ) {
          await this.cancel(conflict._id.toString(), userId);
          resolutionData = {
            action: "canceled_lower_priority",
            canceledEvent: conflict.title,
            reason: `Incoming event (Score ${newScore}) overrode and canceled a non-reschedulable lower priority event (Score ${existingScore}).`,
          };
        } else {
          const oldDur =
            (conflict.end_time.getTime() - conflict.start_time.getTime()) /
            60000;
          const newSlotsForOld = await this.findFreeSlots(
            userId,
            conflict.start_time.toISOString(),
            oldDur,
            timezone,
            conflict._id.toString(),
          );
          if (newSlotsForOld.length > 0) {
            await this.update(conflict._id.toString(), userId, {
              start_time: newSlotsForOld[0].start,
              end_time: newSlotsForOld[0].end,
            } as any);
            resolutionData = {
              action: "evicted_lower_priority",
              oldEvent: conflict.title,
              newTime: newSlotsForOld[0].start,
              reason: `Incoming event (Score ${newScore}) successfully evicted and rescheduled lower priority event (Score ${existingScore}).`,
            };
          } else {
            throw new BadRequestException(
              "Cannot schedule: Incoming event is higher priority, but the existing event has no free slots to move to.",
            );
          }
        }
      } else {
        if (!isNewReschedulable)
          throw new BadRequestException(
            `Incoming event has lower/equal priority (Score ${newScore} vs ${existingScore}) and is non-reschedulable. Canceled.`,
          );
        const slots = await this.findFreeSlots(
          userId,
          currentStart.toISOString(),
          dur,
          timezone,
        );
        if (slots.length > 0) {
          currentStart = slots[0].start;
          currentEnd = slots[0].end;
          resolutionData = {
            action: "auto_rescheduled",
            reason: `Existing event (Score ${existingScore}) took priority. Rescheduled incoming event (Score ${newScore}) to next free slot.`,
          };
        } else {
          throw new BadRequestException(
            "Incoming event has lower/equal priority and no alternative free slots are available.",
          );
        }
      }
    }

    const eventToInsert = {
      ...dto,
      user_id: new Types.ObjectId(userId),
      start_time: currentStart,
      end_time: currentEnd,
      source: dto.source || "assistant",
      severity_score: newScore,
      is_reschedulable: dto.is_reschedulable ?? true,
    };
    const created = await this.eventModel.create(eventToInsert);
    await this.redisService.publish("event_updates", {
      userId,
      event: created,
      action: "created",
      resolutionData,
    });
    return { ...created.toObject(), resolutionData };
  }

  async findByUser(userId: string, filters: any = {}) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const query: any = {
      user_id: new Types.ObjectId(userId),
      status: { $ne: "cancelled" },
      end_time: { $gte: cutoff },
    };
    if (filters.start_date || filters.end_date) {
      query.start_time = {};
      if (filters.start_date)
        query.start_time.$gte = new Date(filters.start_date);
      if (filters.end_date) query.start_time.$lte = new Date(filters.end_date);
    }
    return this.eventModel.find(query).sort({ start_time: 1 }).exec();
  }

  async findById(eventId: string, userId: string) {
    return this.eventModel.findOne({
      _id: new Types.ObjectId(eventId),
      user_id: new Types.ObjectId(userId),
    });
  }

  async update(eventId: string, userId: string, dto: UpdateEventDto) {
    const existing = await this.findById(eventId, userId);
    if (!existing) throw new NotFoundException("Event not found");

    const now = new Date();
    const eventLimit = new Date(existing.start_time.getTime() + 10 * 60000);
    if (now > eventLimit) {
      console.error(
        `[BLOCK]: Attempted reschedule of ${existing.title} at ${now.toISOString()} (10-min window passed)`,
      );
      throw new BadRequestException(
        "Rescheduling window closed (10 mins past start)",
      );
    }

    if (
      existing.source === "calendar_sync" &&
      (dto as any).source !== "assistant"
    ) {
      throw new BadRequestException(
        "Cannot modify external calendar events unless the AI assistant explicitly takes ownership.",
      );
    }

    const updateData: any = { ...dto };
    if (dto.start_time) updateData.start_time = new Date(dto.start_time);
    if (dto.end_time) updateData.end_time = new Date(dto.end_time);

    if (updateData.start_time || updateData.end_time) {
      const newStart = updateData.start_time || existing.start_time;
      const newEnd = updateData.end_time || existing.end_time;
      const conflict = await this.checkConflict(
        userId,
        newStart,
        newEnd,
        eventId,
      );
      if (conflict)
        throw new BadRequestException({
          message: "CONFLICT_DETECTED",
          conflictingEvent: {
            title: conflict.title,
            start: conflict.start_time,
          },
        });
    }

    const updated = await this.eventModel.findOneAndUpdate(
      { _id: new Types.ObjectId(eventId), user_id: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true },
    );
    await this.redisService.publish("event_updates", {
      userId,
      event: updated,
      action: "updated",
    });
    return updated;
  }

  async delete(eventId: string, userId: string) {
    const event = await this.eventModel.findOneAndDelete({
      _id: new Types.ObjectId(eventId),
      user_id: new Types.ObjectId(userId),
    });
    if (!event) throw new NotFoundException("Event not found");
    await this.kafkaService.publish("event.deleted", { userId, eventId });
    await this.redisService.publish("event_updates", {
      userId,
      eventId,
      action: "deleted",
    });
    return event;
  }

  async cancel(eventId: string, userId: string) {
    return this.update(eventId, userId, { status: "cancelled" } as any);
  }

  async bulkDelete(userId: string, eventIds: string[]) {
    const objectIds = eventIds.map((id) => new Types.ObjectId(id));
    const result = await this.eventModel.deleteMany({
      _id: { $in: objectIds },
      user_id: new Types.ObjectId(userId),
    });
    return { deleted_count: result.deletedCount };
  }

  async deleteByPattern(userId: string, title: string, startTime: string) {
    const date = new Date(startTime);
    const targets = await this.eventModel.find({
      user_id: new Types.ObjectId(userId),
      title: title,
    });
    const matchingIds = targets
      .filter(
        (e) =>
          e.start_time.getHours() === date.getHours() &&
          e.start_time.getMinutes() === date.getMinutes(),
      )
      .map((e) => e._id.toString());
    return this.bulkDelete(userId, matchingIds);
  }

  async upsertFromGoogle(
    userId: string,
    accountEmail: string,
    googleEvent: any,
  ) {
    if (!googleEvent?.id) return null;

    const existing = await this.eventModel.findOne({
      user_id: new Types.ObjectId(userId),
      external_event_id: googleEvent.id,
    });

    if (existing && existing.source === "assistant") {
      const googleUpdated = new Date(googleEvent.updated || 0).getTime();
      const localUpdated = (existing as any).updatedAt.getTime();

      if (localUpdated > googleUpdated) {
        this.logger.debug(
          `Skipping sync for Assistant-moved event: ${existing.title}`,
        );
        return existing;
      }
    }

    const start = new Date(
      googleEvent.start?.dateTime || googleEvent.start?.date,
    );
    const end = new Date(googleEvent.end?.dateTime || googleEvent.end?.date);

    const eventData = {
      user_id: new Types.ObjectId(userId),
      title: googleEvent.summary || "No Title",
      description: googleEvent.description || "",
      start_time: start,
      end_time: end,
      location: googleEvent.location || null,
      source: "calendar_sync",
      source_email: accountEmail,
      external_event_id: googleEvent.id,
      status: "scheduled",
    };

    return this.eventModel.findOneAndUpdate(
      {
        user_id: new Types.ObjectId(userId),
        external_event_id: googleEvent.id,
      },
      { $set: eventData },
      { upsert: true, new: true },
    );
  }

  async cleanupCalendarEvents(
    userId: string,
    accountEmail: string,
    currentGoogleIds: string[],
  ): Promise<DeleteResult> {
    return this.eventModel.deleteMany({
      user_id: new Types.ObjectId(userId),
      source: { $in: ["calendar_sync", "assistant"] },
      source_email: accountEmail,
      external_event_id: { $nin: currentGoogleIds, $ne: null },
      start_time: { $gte: new Date() },
    });
  }

  async existsByExternalId(externalId: string): Promise<boolean> {
    const count = await this.eventModel.countDocuments({
      external_event_id: externalId,
    });
    return count > 0;
  }

  async getUpcoming(userId: string, limit: number = 5) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.eventModel
      .find({
        user_id: new Types.ObjectId(userId),
        status: { $ne: "cancelled" },
        end_time: { $gte: cutoff },
        start_time: { $gte: new Date() },
      })
      .sort({ start_time: 1 })
      .limit(limit)
      .exec();
  }

  async getStats(userId: string) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const total = await this.eventModel.countDocuments({
      user_id: new Types.ObjectId(userId),
      status: { $ne: "cancelled" },
      end_time: { $gte: cutoff },
      start_time: { $gte: new Date() },
    });
    return { upcoming_events: total, unresolved_conflicts: 0 };
  }

  async getAdminStats() {
    return { total_created: await this.eventModel.countDocuments() };
  }

  async simulate(userId: string, dto: CreateEventDto) {
    const conflict = await this.checkConflict(
      userId,
      dto.start_time,
      dto.end_time,
    );
    return {
      simulated: true,
      would_conflict: !!conflict,
      conflicting_event: conflict,
    };
  }

  async batchReschedule(userId: string, eventIds: string[]) {
    const results: any[] = [];
    for (const id of eventIds) {
      const event = await this.findById(id, userId);
      if (!event) continue;
      const durationMin =
        (event.end_time.getTime() - event.start_time.getTime()) / 60000;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const slots = await this.findFreeSlots(
        userId,
        tomorrow.toISOString(),
        durationMin,
      );
      if (slots.length > 0) {
        await this.update(id, userId, {
          start_time: slots[0].start.toISOString(),
          end_time: slots[0].end.toISOString(),
        } as any);
        results.push({ title: event.title, newTime: slots[0].start });
      }
    }
    return results;
  }

  async checkConflict(
    userId: string,
    start: string | Date,
    end: string | Date,
    excludeId?: string,
  ) {
    const query: any = {
      user_id: new Types.ObjectId(userId),
      status: { $ne: "cancelled" },
      start_time: { $lt: new Date(end) },
      end_time: { $gt: new Date(start) },
    };
    if (excludeId) query._id = { $ne: new Types.ObjectId(excludeId) };
    return this.eventModel.findOne(query).exec();
  }

  async findFreeSlots(
    userId: string,
    dateIso: string,
    duration: number = 30,
    timezone: string = "Asia/Kolkata",
    excludeId?: string,
  ) {
    const slots: { start: Date; end: Date }[] = [];
    let currentUtc = new Date(dateIso);
    let daysChecked = 0;
    const nowPlus10 = new Date(Date.now() + 10 * 60000);
    if (currentUtc < nowPlus10) currentUtc = nowPlus10;

    while (slots.length < 3 && daysChecked < 14) {
      const localDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
      }).format(currentUtc);
      const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
      }).format(currentUtc);

      if (weekday !== "Sat" && weekday !== "Sun") {
        const block1Start = new Date(
          new Date(`${localDateStr}T09:40:00`).toLocaleString("en-US", {
            timeZone: timezone,
          }),
        );
        const block1End = new Date(
          new Date(`${localDateStr}T12:30:00`).toLocaleString("en-US", {
            timeZone: timezone,
          }),
        );
        const block2Start = new Date(
          new Date(`${localDateStr}T13:30:00`).toLocaleString("en-US", {
            timeZone: timezone,
          }),
        );
        const block2End = new Date(
          new Date(`${localDateStr}T17:45:00`).toLocaleString("en-US", {
            timeZone: timezone,
          }),
        );

        const eventsList = await this.findByUser(userId, {
          start_date: new Date(block1Start.getTime() - 3600000).toISOString(),
          end_date: new Date(block2End.getTime() + 3600000).toISOString(),
        });
        const events = excludeId
          ? eventsList.filter((e) => e._id.toString() !== excludeId)
          : eventsList;

        const findInBlock = (bStart: Date, bEnd: Date) => {
          let cursor = new Date(
            Math.max(bStart.getTime(), currentUtc.getTime()),
          );
          for (const e of events) {
            if (e.end_time <= cursor) continue;
            if (e.start_time >= bEnd) continue;
            if (e.start_time.getTime() - cursor.getTime() >= duration * 60000) {
              slots.push({
                start: new Date(cursor),
                end: new Date(cursor.getTime() + duration * 60000),
              });
              if (slots.length >= 3) return;
            }
            cursor = new Date(Math.max(cursor.getTime(), e.end_time.getTime()));
          }
          if (
            bEnd.getTime() - cursor.getTime() >= duration * 60000 &&
            slots.length < 3
          ) {
            slots.push({
              start: new Date(cursor),
              end: new Date(cursor.getTime() + duration * 60000),
            });
          }
        };

        findInBlock(block1Start, block1End);
        if (slots.length >= 3) break;
        findInBlock(block2Start, block2End);
      }
      currentUtc = new Date(currentUtc.getTime() + 24 * 60 * 60 * 1000);
      currentUtc.setUTCHours(0, 0, 0, 0);
      daysChecked++;
    }
    return slots.slice(0, 3);
  }
}
