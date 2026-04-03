import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { google } from "googleapis";
import { AccountsService } from "../../accounts/accounts.service";
import { EventsService } from "../../events/events.service";
import { AiService } from "../../ai/ai.service";
import { KafkaService } from "../../kafka/kafka.service";
import { RedisService } from "../../redis/redis.service";

interface EmailBatchItem {
  id: string;
  subject: string;
  from: string;
  threadId: string;
  content: string;
}

@Injectable()
export class EmailAgentService {
  private readonly logger = new Logger(EmailAgentService.name);

  constructor(
    private configService: ConfigService,
    private accountsService: AccountsService,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
    @Inject(forwardRef(() => KafkaService))
    private kafkaService: KafkaService,
    private redisService: RedisService,
  ) {}

  @Cron("*/4 * * * *")
  async handleCron(): Promise<void> {
    this.logger.log("⏱️ [4-MIN HEARTBEAT]: Starting Batch Email Processing...");
    try {
      const activeAccounts = await this.accountsService.findAllConnected();
      for (const account of activeAccounts) {
        await this.scanEmails(account._id.toString());
      }
    } catch (error: any) {
      this.logger.error(`Cron Failed: ${error.message}`);
    }
  }

  private isPotentiallyMeeting(subject: string, snippet: string): boolean {
    const text = (subject + " " + snippet).toLowerCase();
    if (
      text.includes("volonexus ai") ||
      text.includes("successfully scheduled")
    ) {
      return false;
    }

    const keywords = [
      "meeting",
      "schedule",
      "appoint",
      "event",
      "zoom",
      "sync",
      "call",
      "invite",
      "sync up",
      "marketing report",
      "production",
      "tea time",
      "client meeting",
    ];
    return keywords.some((k) => text.includes(k));
  }

  async scanEmails(accountId: string): Promise<any> {
    try {
      const account = await this.accountsService.findById(accountId);
      if (!account || !account.oauth_tokens?.access_token) return;

      const auth = new google.auth.OAuth2(
        this.configService.get("GOOGLE_CLIENT_ID"),
        this.configService.get("GOOGLE_CLIENT_SECRET"),
        this.configService.get("GOOGLE_CALLBACK_URL"),
      );
      auth.setCredentials(account.oauth_tokens);
      const gmail = google.gmail({ version: "v1", auth });

      const query = "is:unread category:primary newer_than:4d";
      console.log(`--- [STEP 1]: SCANNING ${account.email} ---`);

      const response = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 15,
      });
      if (!response.data.messages) {
        console.log("--- [STEP 1]: NO NEW EMAILS FOUND ---");
        return { processed: 0 };
      }

      const emailBatch: EmailBatchItem[] = [];
      const REDIS_TTL = 4 * 24 * 60 * 60;

      for (const msgRef of response.data.messages) {
        if (!msgRef.id || emailBatch.length >= 3) continue;

        const redisKey = `email_processed:${msgRef.id}`;
        const isProcessed = await this.redisService.get(redisKey);

        if (isProcessed) {
          console.log(`[SKIP]: ID ${msgRef.id} already in Redis cache.`);
          continue;
        }

        await this.redisService.set(redisKey, "true", REDIS_TTL);

        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msgRef.id,
        });

        const headers = detail.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === "Subject")?.value || "";
        const snippet = detail.data.snippet || "";
        const content = this.extractEmailBody(detail.data.payload);

        if (this.isPotentiallyMeeting(subject, snippet)) {
          const wordCount = content.trim().split(/\s+/).length;

          if (wordCount > 100) {
            console.log(
              `[FILTER IGNORE]: "${subject}" body exceeds 100 words (${wordCount}). Leaving UNREAD.`,
            );
            continue;
          }

          console.log(
            `[FILTER MATCH]: "${subject}" added to AI processing batch.`,
          );
          emailBatch.push({
            id: msgRef.id,
            subject,
            from: headers.find((h) => h.name === "From")?.value || "",
            threadId: detail.data.threadId || "",
            content: content.substring(0, 800),
          });
        } else {
          console.log(
            `[FILTER IGNORE]: "${subject}" does not match keywords. Leaving UNREAD.`,
          );
        }
      }

      if (emailBatch.length === 0) return { processed: 0 };

      const aiResults = await this.aiService.analyzeBulkEmails(
        emailBatch,
        account.user_id.toString(),
      );

      for (const item of emailBatch) {
        const analysis = aiResults.find((r: any) => r.id === item.id);

        console.log(`--- [DECISION FOR: ${item.subject}] ---`);
        console.dir(analysis);

        if (analysis && analysis.is_event && !analysis.is_scam) {
          const requestedStart = new Date(analysis.start_time);

          if (requestedStart < new Date()) {
            console.log(
              `[REJECT STALE]: Attempted time ${requestedStart.toISOString()} is in the past. Rejecting.`,
            );
            continue;
          }

          console.log(
            `[CREATE]: Attempting to schedule "${analysis.title}" for requested time ${requestedStart.toISOString()} (Severity: ${analysis.severity_score})`,
          );

          const createdEvent = await this.eventsService.create(
            account.user_id.toString(),
            {
              title: analysis.title,
              start_time: requestedStart.toISOString(),
              end_time: new Date(
                requestedStart.getTime() +
                  (analysis.duration_minutes || 60) * 60000,
              ).toISOString(),
              source: "email",
              external_event_id: item.id,
              severity_score: analysis.severity_score,
              type: analysis.type,
              is_reschedulable: analysis.is_reschedulable,
              description: `From Email: ${item.subject}\nAI Reasoning: ${analysis.reasoning}`,
            } as any,
          );

          const finalStart = new Date(createdEvent.start_time);
          console.log(
            `[SUCCESS]: Event actually scheduled in App at ${finalStart.toISOString()}`,
          );

          let replyHtml = `<p><b>VoloNexus.AI:</b> I've scheduled <b>"${analysis.title}"</b> for ${finalStart.toLocaleString()}.</p>`;

          if (
            createdEvent.resolutionData &&
            createdEvent.resolutionData.reason
          ) {
            replyHtml += `<p><i>Note: ${createdEvent.resolutionData.reason}</i></p>`;
          }

          await this.accountsService.sendEmailReply(
            accountId,
            item.from,
            item.subject,
            item.threadId,
            replyHtml,
          );

          await gmail.users.messages.batchModify({
            userId: "me",
            requestBody: { ids: [item.id], removeLabelIds: ["UNREAD"] },
          });
        } else {
          console.log(
            `[REJECT]: AI decided this is not a valid meeting. Leaving UNREAD in inbox.`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Batch Scan failed: ${error.message}`);
    }
  }

  async processIncomingEmail(payload: {
    accountId: string;
    messageId: string;
  }): Promise<any> {
    try {
      const { accountId, messageId } = payload;
      const account = await this.accountsService.findById(accountId);

      if (!account || !account.oauth_tokens?.access_token) {
        return { success: false, reason: "Account or Auth missing." };
      }

      const REDIS_TTL = 4 * 24 * 60 * 60;
      const redisKey = `email_processed:${messageId}`;
      const isProcessed = await this.redisService.get(redisKey);

      if (isProcessed) {
        this.logger.log(
          `[WEBHOOK SKIP]: Message ID ${messageId} was already processed.`,
        );
        return { success: true, reason: "Already processed" };
      }

      await this.redisService.set(redisKey, "true", REDIS_TTL);

      const auth = new google.auth.OAuth2(
        this.configService.get("GOOGLE_CLIENT_ID"),
        this.configService.get("GOOGLE_CLIENT_SECRET"),
        this.configService.get("GOOGLE_CALLBACK_URL"),
      );
      auth.setCredentials(account.oauth_tokens);
      const gmail = google.gmail({ version: "v1", auth });

      this.logger.log(
        `📥 [WEBHOOK TRIGGERED]: Fetching real-time email ${messageId} for ${account.email}`,
      );

      const detail = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
      });

      const headers = detail.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const snippet = detail.data.snippet || "";
      const content = this.extractEmailBody(detail.data.payload);

      if (!this.isPotentiallyMeeting(subject, snippet)) {
        return { success: false, reason: "Does not match meeting keywords." };
      }

      const wordCount = content.trim().split(/\s+/).length;
      if (wordCount > 100) {
        return { success: false, reason: "Email body too long." };
      }

      const emailBatchItem: EmailBatchItem = {
        id: messageId,
        subject,
        from: headers.find((h) => h.name === "From")?.value || "",
        threadId: detail.data.threadId || "",
        content: content.substring(0, 800),
      };

      const aiResults = await this.aiService.analyzeBulkEmails(
        [emailBatchItem],
        account.user_id.toString(),
      );

      const analysis = aiResults.find((r: any) => r.id === messageId);

      if (analysis && analysis.is_event && !analysis.is_scam) {
        const requestedStart = new Date(analysis.start_time);

        if (requestedStart < new Date()) {
          return { success: false, reason: "Time is in the past." };
        }

        const createdEvent = await this.eventsService.create(
          account.user_id.toString(),
          {
            title: analysis.title,
            start_time: requestedStart.toISOString(),
            end_time: new Date(
              requestedStart.getTime() +
                (analysis.duration_minutes || 60) * 60000,
            ).toISOString(),
            source: "email",
            external_event_id: messageId,
            severity_score: analysis.severity_score,
            type: analysis.type,
            is_reschedulable: analysis.is_reschedulable,
            description: `From Email: ${subject}\nAI Reasoning: ${analysis.reasoning}`,
          } as any,
        );

        const finalStart = new Date(createdEvent.start_time);

        let replyHtml = `<p><b>VoloNexus.AI:</b> I've scheduled <b>"${analysis.title}"</b> for ${finalStart.toLocaleString()}.</p>`;
        if (createdEvent.resolutionData && createdEvent.resolutionData.reason) {
          replyHtml += `<p><i>Note: ${createdEvent.resolutionData.reason}</i></p>`;
        }

        await this.accountsService.sendEmailReply(
          accountId,
          emailBatchItem.from,
          subject,
          emailBatchItem.threadId,
          replyHtml,
        );

        await gmail.users.messages.modify({
          userId: "me",
          id: messageId,
          requestBody: { removeLabelIds: ["UNREAD"] },
        });

        this.logger.log(
          `⚡ [REAL-TIME SUCCESS]: Scheduled ${analysis.title} via Webhook!`,
        );
        return { success: true, event: createdEvent };
      }

      return {
        success: false,
        reason: "AI determined this is not a valid event.",
      };
    } catch (error: any) {
      this.logger.error(`Webhook Processing Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private extractEmailBody(payload: any): string {
    if (!payload?.parts)
      return Buffer.from(payload?.body?.data || "", "base64").toString();
    const bodyPart =
      payload.parts.find((p: any) => p.mimeType === "text/plain") ||
      payload.parts[0];
    return bodyPart.parts
      ? this.extractEmailBody(bodyPart)
      : Buffer.from(bodyPart.body?.data || "", "base64").toString();
  }
}
