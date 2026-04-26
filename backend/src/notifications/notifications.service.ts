import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google } from "googleapis";
import axios from "axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Account, AccountDocument } from "../accounts/schemas/account.schema";
import * as nodemailer from "nodemailer";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private systemMailer: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
  ) {
    this.systemMailer = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: this.configService.get<string>("SYSTEM_EMAIL_ADDRESS"),
        pass: this.configService.get<string>("SYSTEM_EMAIL_PASSWORD"),
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    fromEmail?: string,
  ): Promise<boolean> {
    try {
      if (!fromEmail) {
        const systemEmail = this.configService.get<string>(
          "SYSTEM_EMAIL_ADDRESS",
        );
        await this.systemMailer.sendMail({
          from: `"VoloNexus.AI" <${systemEmail}>`,
          to,
          subject,
          html: body,
        });

        console.log(
          `[SYSTEM EMAIL SUCCESS]: Delivered to ${to} | Subject: ${subject}`,
        );
        return true;
      }

      const account = await this.accountModel.findOne({ email: fromEmail });

      if (!account || !account.oauth_tokens) {
        console.error(
          `[OAUTH EMAIL ERROR]: No connected account for: ${fromEmail}`,
        );
        return false;
      }

      const auth = new google.auth.OAuth2(
        this.configService.get("google.clientId"),
        this.configService.get("google.clientSecret"),
      );
      auth.setCredentials({
        access_token: account.oauth_tokens.access_token,
        refresh_token: account.oauth_tokens.refresh_token,
      });

      const gmail = google.gmail({ version: "v1", auth });

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
      const messageParts = [
        `To: ${to}`,
        "Content-Type: text/html; charset=utf-8",
        "MIME-Version: 1.0",
        `Subject: ${utf8Subject}`,
        "",
        body,
      ];
      const message = messageParts.join("\n");
      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
      });

      console.log(
        `[OAUTH EMAIL SUCCESS]: Delivered to ${to} | Subject: ${subject}`,
      );
      return true;
    } catch (error: any) {
      console.error("[EMAIL API FAILURE]:", error.message);
      return false;
    }
  }

  async sendWhatsApp(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const token = this.configService.get("whatsapp.apiToken");
      const phoneId = this.configService.get("whatsapp.phoneNumberId");

      if (!token || !phoneId) {
        this.logger.warn("WhatsApp credentials missing in config");
        return false;
      }

      const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

      await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log(`[WHATSAPP SUCCESS]: Priority alert sent to ${phoneNumber}`);
      return true;
    } catch (error: any) {
      console.error("[WHATSAPP ERROR]:", error.response?.data || error.message);
      return false;
    }
  }

  async sendProactiveReminder(event: any, userEmail: string) {
    const timeStr = new Date(event.start_time).toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const body = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #0B0F1A; color: #ffffff; border-radius: 24px; border: 1px solid #1F2937;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 16px; margin-bottom: 15px;">
            <img src="https://img.icons8.com/fluency/48/000000/appointment-reminders.png" width="40" height="40" />
          </div>
          <h2 style="margin: 0; font-size: 24px; letter-spacing: -0.025em; color: #ffffff;">Upcoming Commitment</h2>
          <p style="color: #9CA3AF; font-size: 14px; margin-top: 8px;">Your swarm is standing by. Meeting starts in 10 minutes.</p>
        </div>

        <div style="background: #111827; padding: 24px; border-radius: 20px; border: 1px solid #1F2937; margin-bottom: 30px;">
          <h1 style="margin: 0 0 15px 0; font-size: 20px; color: #3B82F6;">${event.title}</h1>
          
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="color: #9CA3AF; font-size: 13px; width: 80px; font-weight: bold; text-transform: uppercase;">Time:</span>
            <span style="color: #ffffff; font-size: 14px;">${timeStr} (Local)</span>
          </div>

          ${
            event.location
              ? `
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="color: #9CA3AF; font-size: 13px; width: 80px; font-weight: bold; text-transform: uppercase;">Location:</span>
            <span style="color: #ffffff; font-size: 14px;">${event.location}</span>
          </div>`
              : ""
          }

          ${
            event.description
              ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #1F2937;">
            <p style="color: #9CA3AF; font-size: 13px; margin-bottom: 5px; font-weight: bold; text-transform: uppercase;">Agenda:</p>
            <p style="color: #D1D5DB; font-size: 14px; line-height: 1.6; margin: 0;">${event.description}</p>
          </div>`
              : ""
          }
        </div>

        ${
          event.meeting_link
            ? `
        <div style="text-align: center;">
          <a href="${event.meeting_link}" style="display: inline-block; background-color: #3B82F6; color: #ffffff; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">Join Meeting Now</a>
          <p style="color: #4B5563; font-size: 11px; margin-top: 15px;">Powered by VoloNexus.AI Autonomous Orchestrator</p>
        </div>`
            : `
        <div style="text-align: center;">
          <p style="color: #4B5563; font-size: 11px; margin: 0;">Powered by VoloNexus.AI Autonomous Orchestrator</p>
        </div>`
        }
      </div>
    `;

    return this.sendEmail(
      userEmail,
      `Reminder: ${event.title} at ${timeStr}`,
      body,
    );
  }

  async sendEventReminder(event: any, user: any, channels: string[]) {
    const tz = user?.preferences?.timezone || "Asia/Kolkata";
    const timeStr = new Date(event.start_time).toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = `👋 VoloNexus.AI Reminder: "${event.title}" starts at ${timeStr}.`;

    for (const channel of channels) {
      if (channel === "email")
        await this.sendEmail(user.email, `Upcoming: ${event.title}`, message);
      if (channel === "whatsapp" && user.phone)
        await this.sendWhatsApp(user.phone, message);
    }
  }

  async sendConflictAlert(user: any, event: any, conflictingEvent: any) {
    const message = `🚨 *Schedule Conflict Detected!*\n\n"${event.title}" overlaps with "${conflictingEvent.title}".\n\nOur AI agent has simulated the impact and is ready to help you reschedule. Open the app to view options.`;

    await this.sendEmail(
      user.email,
      "Action Required: Schedule Conflict",
      message,
    );
    if (user.phone) await this.sendWhatsApp(user.phone, message);
  }

  async sendGreetingEmail(to: string, name: string, occasion: string) {
    const subject = `Happy ${occasion}, ${name}!`;
    const body = `Wishing you a wonderful ${occasion}! - VoloNexus.AI Team`;
    await this.sendEmail(to, subject, body);
  }
}
