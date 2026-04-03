import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NotificationsService } from "../../notifications/notifications.service";
import { UsersService } from "../../users/users.service";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class NotificationAgentService {
  private readonly logger = new Logger(NotificationAgentService.name);

  constructor(
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private redisService: RedisService,
  ) {
    this.logger.log("Notification Agent logic synchronized with Delivery Hub");
  }

  async processNotification(notificationData: any): Promise<any> {
    const { userId, type, payload } = notificationData;
    const safeType = type || "GENERAL_NOTIFICATION";
    this.logger.log(`Determining delivery for: ${safeType} (User: ${userId})`);

    const user = await this.usersService.findById(userId);
    if (!user) {
      this.logger.error(`User ${userId} not found for notification`);
      return { delivered: false, reason: "user_not_found" };
    }

    const priority = this.getPriority(safeType, payload);
    const channels = this.getChannels(priority, user.preferences);

    const results: { channel: string; success: boolean }[] = [];
    for (const channel of channels) {
      if (
        priority !== "critical" &&
        priority !== "high" &&
        !this.isWithinWorkHours(user)
      ) {
        this.logger.log(
          `Skipping ${channel} for ${userId} - outside work hours.`,
        );
        continue;
      }

      const success = await this.executeDelivery(
        channel,
        user,
        safeType,
        payload,
      );
      results.push({ channel, success });
    }

    return {
      delivered: results.some((r) => r.success),
      channels_used: results.filter((r) => r.success).map((r) => r.channel),
    };
  }

  private getPriority(type: string, payload: any): string {
    if (
      type === "CONFLICT_CHOICE_REQUIRED" ||
      type === "CONFLICT_ALERT" ||
      payload?.priority === "urgent"
    )
      return "critical";
    if (
      type === "EVENT_RESCHEDULED" ||
      type === "EVENT_REMINDER" ||
      type === "EVENT_CREATED"
    )
      return "high";
    return "medium";
  }

  private getChannels(priority: string, prefs: any): string[] {
    const channels = ["email"];
    if (priority === "critical" || priority === "high")
      channels.push("whatsapp");
    if (priority === "critical") channels.push("voice");
    return channels;
  }

  private async executeDelivery(
    channel: string,
    user: any,
    type: string,
    payload: any,
  ): Promise<boolean> {
    try {
      const safeType = type ? type.replace(/_/g, " ") : "Update";

      let message = payload?.message || "You have a new update.";

      if (
        type === "CONFLICT_CHOICE_REQUIRED" &&
        payload.alternatives &&
        payload.alternatives.length > 0
      ) {
        const slots = payload.alternatives
          .map((s: any) => new Date(s.start).toLocaleString())
          .join("\n - ");
        message = `${payload.message}\n\nIf you prefer a different time, here are other free slots:\n - ${slots}\n\nYou can chat with the AI Assistant to change this, or ignore this if the new time works!`;
      } else if (type === "CONFLICT_CHOICE_REQUIRED") {
        message = payload.message;
      }

      switch (channel) {
        case "whatsapp":
          return await this.notificationsService.sendWhatsApp(
            user.phone,
            `VoloNexus.AI Alert: ${safeType} - ${message}`,
          );
        case "email":
          return await this.notificationsService.sendEmail(
            user.email,
            safeType,
            `Hello ${user.name}, \n\n${message}`,
          );
        case "voice":
          this.logger.log(`Triggering WebSocket Voice for user ${user._id}`);
          await this.redisService.publish("voice_alerts", {
            userId: user._id.toString(),
            text: message,
            type: "critical_alert",
          });
          return true;
        default:
          return false;
      }
    } catch (e: any) {
      this.logger.error(`Failed delivery on ${channel}`, e.stack);
      return false;
    }
  }

  private isWithinWorkHours(user: any): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const start = parseInt(
      user.preferences?.work_hours_start?.split(":")[0] || "8",
    );
    const end = parseInt(
      user.preferences?.work_hours_end?.split(":")[0] || "20",
    );
    return currentHour >= start && currentHour < end;
  }

  async scheduleReminder(event: any, user: any): Promise<any> {
    const minutesBefore = event.reminder?.minutes_before || 15;
    await this.notificationsService.sendEventReminder(event, user, [
      "email",
      "whatsapp",
    ]);
    return { scheduled: true };
  }
}
