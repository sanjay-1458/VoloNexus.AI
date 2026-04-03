import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { AiService } from "../../ai/ai.service";
import { ContextAgentService } from "../context-agent/context-agent.service";
import { EventsService } from "../../events/events.service";
import { KafkaService } from "../../kafka/kafka.service";
import { UsersService } from "../../users/users.service";

@Injectable()
export class SchedulerAgentService {
  private readonly logger = new Logger(SchedulerAgentService.name);

  constructor(
    @Inject(forwardRef(() => KafkaService))
    private readonly kafkaClient: KafkaService,
    @Inject(forwardRef(() => AiService))
    private readonly aiService: AiService,
    @Inject(forwardRef(() => ContextAgentService))
    private readonly contextAgent: ContextAgentService,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
  ) {}

  async processNewEvent(payload: {
    userId: string;
    event: any;
    isBulk?: boolean;
  }) {
    const { userId, event, isBulk } = payload;

    const conflict = await this.eventsService.checkConflict(
      userId,
      event.start_time,
      event.end_time,
      event._id.toString(),
    );

    if (!conflict) return;

    this.logger.warn(
      `[Conflict Detected] Source: ${event.source} | "${event.title}" vs "${conflict.title}"`,
    );

    if (isBulk)
      return this.handleBulkConflictNotification(userId, event, conflict);
    if (event.source === "calendar_sync")
      return this.handleCalendarSyncConflict(userId, event, conflict);
    if (event.source === "email")
      return this.handleEmailConflict(userId, event, conflict);
  }

  private async handleCalendarSyncConflict(
    userId: string,
    incoming: any,
    existing: any,
  ) {
    const specialKeywords = ["birthday", "anniversary", "reminder"];
    const title = incoming.title.toLowerCase();

    if (specialKeywords.some((k) => title.includes(k))) {
      await this.kafkaClient.publish("notification.send", {
        userId,
        type: "SPECIAL_EVENT_ALERT",
        payload: {
          message: `Special event noted: ${incoming.title}. It overlaps your schedule but wasn't added to your main list.`,
        },
      });
      return;
    }

    this.logger.log(
      `[Sync] Rescheduling local event "${existing.title}" to accommodate Sync.`,
    );
    return this.reallocateEvent(
      userId,
      existing,
      incoming,
      "Calendar Sync priority.",
    );
  }

  private async handleEmailConflict(
    userId: string,
    incoming: any,
    existing: any,
  ) {
    const incomingScore = incoming.severity_score || 50;
    const existingScore = existing.severity_score || 50;
    const diff = Math.abs(incomingScore - existingScore);

    if (diff >= 20) {
      const lower = incomingScore < existingScore ? incoming : existing;
      const higher = incomingScore < existingScore ? existing : incoming;

      this.logger.log(
        `[Email] Gap ${diff} >= 20. Moving lower priority: "${lower.title}".`,
      );
      return this.reallocateEvent(
        userId,
        lower,
        higher,
        "Automated Severity Rule.",
      );
    }

    this.logger.log(
      `[Email] Gap ${diff} < 20. Auto-resolving and sending alternatives.`,
    );
    const aiAlternatives = await this.aiService.resolveConflict(
      userId,
      incoming._id.toString(),
      existing._id.toString(),
    );

    const eventToMove = incomingScore < existingScore ? incoming : existing;
    const conflictingWith = incomingScore < existingScore ? existing : incoming;

    if (aiAlternatives.suggested_slots?.length > 0) {
      const bestSlot = aiAlternatives.suggested_slots[0];
      const remainingSlots = aiAlternatives.suggested_slots.slice(1);

      try {
        await this.eventsService.update(eventToMove._id.toString(), userId, {
          start_time: bestSlot.start,
          end_time: bestSlot.end,
          description: `${eventToMove.description || ""} (Auto-moved: Close Priority Conflict)`,
        } as any);

        await this.kafkaClient.publish("notification.send", {
          userId,
          type: "CONFLICT_CHOICE_REQUIRED",
          payload: {
            subject: "Close Schedule Conflict Auto-Resolved",
            message: `Both "${incoming.title}" and "${existing.title}" had similar priority. Since we couldn't ask you in real-time, we kept "${conflictingWith.title}" at its original time and temporarily moved "${eventToMove.title}" to ${new Date(bestSlot.start).toLocaleString()}.`,
            alternatives: remainingSlots,
            conflictingEvents: [incoming, existing],
          },
        });
      } catch (err) {
        if (err instanceof Error) {
          console.error(
            `[AGENT ERROR]: Cannot move event ${eventToMove.title}: ${err.message}`,
          );
        } else {
          console.error(
            `[AGENT ERROR]: Cannot move event ${eventToMove.title}:`,
            err,
          );
        }
      }
    }
  }

  private async reallocateEvent(
    userId: string,
    eventToMove: any,
    conflictingWith: any,
    reason: string,
  ) {
    if (eventToMove.title.toLowerCase().includes("gym")) {
      this.logger.log(
        `[Logic] Routine event "${eventToMove.title}" cancelled.`,
      );
      return this.eventsService.cancel(eventToMove._id, userId);
    }

    const resolution = await this.aiService.resolveConflict(
      userId,
      eventToMove._id.toString(),
      conflictingWith._id.toString(),
    );

    if (resolution.suggested_slots?.length > 0) {
      const bestSlot = resolution.suggested_slots[0];
      try {
        await this.eventsService.update(eventToMove._id.toString(), userId, {
          start_time: bestSlot.start,
          end_time: bestSlot.end,
          description: `${eventToMove.description || ""} (Auto-moved: ${reason})`,
        } as any);

        await this.kafkaClient.publish("notification.send", {
          userId,
          type: "EVENT_RESCHEDULED",
          payload: {
            message: `Your existing event "${eventToMove.title}" has been rescheduled to ${new Date(bestSlot.start).toLocaleString()}.\n\nThis change was made to accommodate a higher priority event: "${conflictingWith.title}" (scheduled for ${new Date(conflictingWith.start_time).toLocaleString()}).\n\nReason: ${reason}`,
          },
        });
      } catch (err) {
        if (err instanceof Error) {
          console.error(
            `[AGENT ERROR]: Cannot reallocate ${eventToMove.title}: ${err.message}`,
          );
        } else {
          console.error(
            `[AGENT ERROR]: Cannot reallocate ${eventToMove.title}:`,
            err,
          );
        }
      }
    }
  }

  private async handleBulkConflictNotification(
    userId: string,
    newEvent: any,
    existingEvent: any,
  ) {
    await this.kafkaClient.publish("notification.send", {
      userId,
      type: "BULK_CONFLICT",
      payload: {
        message: `Recurring conflict: ${newEvent.title} overlaps with ${existingEvent.title}.`,
      },
    });
  }
}
