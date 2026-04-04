import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventsService } from "../events/events.service";
import { UsersService } from "../users/users.service";
import { MonitoringAgentService } from "../agents/monitoring-agent/monitoring-agent.service";
import { ContextAgentService } from "../agents/context-agent/context-agent.service";
import { RedisService } from "../redis/redis.service";
import { GoogleGenerativeAI } from "@google/generative-ai";

import * as dns from "dns";
dns.setDefaultResultOrder("ipv4first");

const STATIC_FAQS = [
  {
    keywords: [
      "plan",
      "price",
      "pricing",
      "free",
      "paid",
      "cost",
      "subscription",
      "upgrade",
    ],
    answer:
      "VoloNexus.AI offers two main tiers:\n1. **Free Tier**: 20 AI requests/day.\n2. **Pro Tier ($100/mo)**: Unlimited AI orchestration and priority conflict resolution.",
  },
  {
    keywords: [
      "what is this",
      "what is volonexus.ai",
      "about this app",
      "features",
    ],
    answer:
      "VoloNexus.AI is an advanced orchestration engine that manages your calendar and resolves meeting conflicts automatically.",
  },
  {
    keywords: ["support", "help", "contact", "email support"],
    answer: "Contact our technical team at **support.volonexus.ai@gmail.com**.",
  },
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService,
    private usersService: UsersService,
    @Inject(forwardRef(() => MonitoringAgentService))
    private monitoringAgent: MonitoringAgentService,
    @Inject(forwardRef(() => ContextAgentService))
    private contextAgent: ContextAgentService,
    private redisService: RedisService,
  ) {
    const geminiKey = this.configService.get<string>("ai.geminiApiKey")!;
    this.genAI = new GoogleGenerativeAI(geminiKey);
  }

  private extractJson(text: string) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("[AI JSON EXTRACTION SUCCESS]", parsed);
      return parsed;
    } catch (e: any) {
      console.error("[AI JSON EXTRACTION FAILED]", text);
      this.logger.error("JSON Extraction failed. Raw: " + text);
      return {};
    }
  }

  async chat(
    userId: string | null,
    message: string,
    history: any[] = [],
    timezone: string = "Asia/Kolkata",
  ) {
    const staticAnswer = this.checkStaticFaqs(message);
    if (staticAnswer)
      return { response: staticAnswer, engine: "static-faq-engine" };
    if (!userId) return { response: "SYSTEM STATUS: UNAUTHORIZED." };

    try {
      const now = new Date();

      const user = await this.usersService.findById(userId);
      const activeTimezone =
        user?.preferences?.timezone || timezone || "Asia/Kolkata";

      const timeFormatter = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: activeTimezone,
      });

      const dateFormatter = new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: activeTimezone,
      });

      const userLocalDate = dateFormatter
        .format(now)
        .split("/")
        .reverse()
        .join("-");
      const userLocalTime = timeFormatter.format(now);

      const activeHistory =
        history.length > 0 ? history : await this.getStoredHistory(userId);

      let pineconeMemory = "";
      try {
        if (
          this.contextAgent &&
          typeof (this.contextAgent as any).queryPinecone === "function"
        ) {
          pineconeMemory = await (this.contextAgent as any).queryPinecone(
            userId,
            message,
          );
        }
      } catch (e) {
        this.logger.warn("Pinecone retrieval skipped/failed.");
      }

      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const eventsRaw = await this.eventsService.findByUser(userId, {
        start_date: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
        end_date: thirtyDaysFromNow.toISOString(),
      });

      const eventsForAi = eventsRaw.map((e) => {
        return {
          id: e._id,
          title: e.title,
          local_date: dateFormatter
            .format(e.start_time)
            .split("/")
            .reverse()
            .join("-"),
          local_time: timeFormatter.format(e.start_time),
          priority_label:
            e.severity_score >= 76
              ? "High"
              : e.severity_score >= 41
                ? "Medium"
                : "Low",
          score: e.severity_score,
          raw_utc_start: e.start_time.toISOString(),
        };
      });

      console.log(
        `[AI CHAT] Localized Events for context: ${eventsForAi.length}`,
      );

      const analysisPrompt = `
        You are the VoloNexus.AI Orchestrator. Tone: Professional, Precise, Agentic.

        1. MULTI-TASKING
        - Generate an action object for EACH user request.

        2. TIME RULES (DETERMINISTIC)
        - User Timezone: ${activeTimezone}
        - Current Local Date: ${userLocalDate}
        - Current Local Time: ${userLocalTime}
        
        STRICT FILTERING:
        - Use the "local_time" and "local_date" fields in the CURRENT EVENTS list below.
        - If a user asks for "after 12pm", compare that string against "local_time". 
        - IGNORE and EXCLUDE any event that does not match the user's specific time/date filter.

        3. FORMATTING
        - For "answer" type, YOU MUST USE A MARKDOWN TABLE.
        - Blank line before and after tables.
        - Columns: Date | Time | Title | Priority.

        4. MODIFICATION
        - Use EXACT 'id' for "target_id".
        - Rescheduling inherits details from CURRENT EVENTS.

        LONG-TERM USER PREFERENCES (Pinecone): ${pineconeMemory || "None."}
        CURRENT EVENTS (LOCALIZED TO ${activeTimezone}): ${JSON.stringify(eventsForAi)}
        RECENT HISTORY: ${JSON.stringify(activeHistory.slice(-6))}
        USER MESSAGE: "${message}"

        Return ONLY structured JSON:
        {
          "actions": [
            {
              "type": "create" | "reschedule" | "ask_user" | "cancel" | "answer",
              "answer_text": "string",
              "target_id": "string",
              "event": { 
                "title": "string", 
                "start_time": "UTC_ISO_STRING", 
                "duration": "number",
                "severity_score": "number",
                "severity": "low | medium | high | critical",
                "is_reschedulable": boolean,
                "type": "string"
              }
            }
          ]
        }
      `;

      const { text: analysisRaw } =
        await this.generateWithFallback(analysisPrompt);
      const analysis = this.extractJson(analysisRaw);

      let actionTaken = false;
      let needsOnboarding = false;
      let answerTexts: string[] = [];
      let conflictTexts: string[] = [];
      let actionResults: string[] = [];

      const actions = Array.isArray(analysis.actions)
        ? analysis.actions
        : analysis.action
          ? [analysis]
          : [];

      actions.sort((a, b) => {
        const order = {
          cancel: 0,
          reschedule: 1,
          create: 2,
          answer: 3,
          ask_user: 4,
        };
        return (order[a.type] || 99) - (order[b.type] || 99);
      });

      for (const act of actions) {
        const actionType = act.type || act.action;
        console.log(`[EXECUTING]: ${actionType}`);

        try {
          if (actionType === "answer" && act.answer_text) {
            const answerPrompt = `
              User Query: "${message}"
              Current Local Time: ${userLocalTime}
              
              Task: Create a table of events.
              FILTERING RULE: If the query was "after 12pm", ONLY include events where local_time is 12:00 PM or later. 
              If the query was for a specific date, ONLY include that date.
              If no events match, say "No events found for that specific timeframe."

              FORMATTING:
              - Use Markdown Table: Date | Time | Title | Priority.
              - Double newline before/after.
              
              Localized Events Context: ${JSON.stringify(eventsForAi)}
            `;
            const { text: generatedTable } =
              await this.generateWithFallback(answerPrompt);
            answerTexts.push(generatedTable);
          } else if (actionType === "ask_user") {
            needsOnboarding = true;
          } else if (actionType === "cancel" && act.target_id) {
            const target = await this.eventsService.findById(
              act.target_id,
              userId,
            );
            if (target) {
              await this.eventsService.cancel(target._id.toString(), userId);
              actionTaken = true;
              actionResults.push(`✅ Canceled: **${target.title}**`);
            }
          } else if (actionType === "reschedule" && act.target_id) {
            const target = await this.eventsService.findById(
              act.target_id,
              userId,
            );
            if (target) {
              const updatePayload: any = { ...act.event };
              if (act.event.start_time) {
                const start = new Date(act.event.start_time);
                const dur =
                  act.event.duration ||
                  (target.end_time.getTime() - target.start_time.getTime()) /
                    60000;
                updatePayload.start_time = start.toISOString();
                updatePayload.end_time = new Date(
                  start.getTime() + dur * 60000,
                ).toISOString();
              }
              await this.eventsService.update(
                target._id.toString(),
                userId,
                updatePayload,
              );
              actionTaken = true;
              actionResults.push(`📅 Rescheduled: **${target.title}**`);
            }
          } else if (actionType === "create" && act.event?.title) {
            await this.eventsService.create(userId, act.event, activeTimezone);
            actionTaken = true;
            actionResults.push(`✨ Scheduled: **${act.event.title}**`);
          }
        } catch (error: any) {
          if (error.response?.message === "CONFLICT_DETECTED") {
            const conflictingEvent = error.response.conflictingEvent;
            const resolutionPrompt = `
              Conflict: "${conflictingEvent.title}" at ${conflictingEvent.start}.
              Write a short, professional warning in ${activeTimezone} and suggest alternatives.
            `;
            const { text: resText } =
              await this.generateWithFallback(resolutionPrompt);
            conflictTexts.push(resText);
          } else {
            actionResults.push(`❌ Error: ${error.message}`);
          }
        }
      }

      let finalCombinedResponse = "";
      if (answerTexts.length > 0)
        finalCombinedResponse += answerTexts.join("\n\n") + "\n\n";
      if (actionResults.length > 0)
        finalCombinedResponse +=
          "### Update Status\n" +
          actionResults.map((r) => `- ${r}`).join("\n") +
          "\n\n";
      if (conflictTexts.length > 0)
        finalCombinedResponse +=
          "### ⚠️ Attention Required\n" + conflictTexts.join("\n\n") + "\n\n";

      if (!finalCombinedResponse.trim()) {
        finalCombinedResponse = needsOnboarding
          ? "Please provide details for the event."
          : "Task completed.";
      }

      const updatedHistory = [
        ...activeHistory,
        { role: "user", content: message },
        { role: "assistant", content: finalCombinedResponse.trim() },
      ];

      await this.redisService.set(
        `chat:${userId}:history`,
        JSON.stringify(updatedHistory),
        86400,
      );

      try {
        if (
          this.contextAgent &&
          typeof (this.contextAgent as any).storePineconeMemory === "function"
        ) {
          (this.contextAgent as any)
            .storePineconeMemory(userId, message, finalCombinedResponse.trim())
            .catch(console.error);
        }
      } catch (e) {}

      return {
        response: finalCombinedResponse.trim(),
        refreshNeeded: actionTaken,
      };
    } catch (error: any) {
      console.error("[CRITICAL ASSISTANT ERROR]", error);
      this.logger.error(`Assistant Error: ${error.message}`);
      throw new InternalServerErrorException("Assistant Offline.");
    }
  }

  async resolveConflict(
    userId: string,
    eventId: string,
    conflictingEventId: string,
  ) {
    try {
      const user = await this.usersService.findById(userId);
      const tz = user?.preferences?.timezone || "Asia/Kolkata";
      const [e1, e2] = await Promise.all([
        this.eventsService.findById(eventId, userId),
        this.eventsService.findById(conflictingEventId, userId),
      ]);
      if (!e1 || !e2)
        return { suggested_slots: [], reasoning: "Events not found." };
      const slots = await this.eventsService.findFreeSlots(
        userId,
        e1.start_time.toISOString(),
        (e1.end_time.getTime() - e1.start_time.getTime()) / 60000,
        tz,
        eventId,
      );
      const { text } = await this.generateWithFallback(
        `Conflict between ${e1.title} and ${e2.title}. Suggest from: ${JSON.stringify(slots)}. Return JSON.`,
      );
      const res = this.extractJson(text);
      return {
        suggested_slots: res.suggested_slots || slots,
        event_to_move_id: res.event_to_move_id,
        reasoning: res.reasoning,
      };
    } catch (e) {
      return { suggested_slots: [], reasoning: "Failed." };
    }
  }

  async analyzeBugReport(description: string, severity: string = "medium") {
    try {
      const { text } = await this.generateWithFallback(
        `Analyze bug: ${description}. Return JSON with "summary" and "impact_analysis".`,
      );
      const res = this.extractJson(text);
      return {
        is_relevant: true,
        summary: res.summary || description,
        impact_analysis: res.impact_analysis || "Standard.",
      };
    } catch (e) {
      return {
        is_relevant: true,
        summary: description,
        impact_analysis: "Review needed.",
      };
    }
  }

  async getStoredHistory(userId: string) {
    const history = await this.redisService.get(`chat:${userId}:history`);
    return history ? JSON.parse(history) : [];
  }

  async clearStoredHistory(userId: string) {
    await this.redisService.set(
      `chat:${userId}:history`,
      JSON.stringify([]),
      86400,
    );
    return true;
  }

  private async generateWithFallback(prompt: string | any[], config: any = {}) {
    const models = ["models/gemini-flash-latest", "models/gemini-2.5-flash"];
    let lastError: any = null;
    for (const modelName of models) {
      try {
        const model = this.genAI.getGenerativeModel(
          { model: modelName, ...config },
          { apiVersion: "v1beta" },
        );
        const result = await model.generateContent(prompt);
        return { text: (await result.response).text(), model: modelName };
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    throw lastError || new Error("AI failed.");
  }

  private cleanJson(text: string) {
    return text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
  }

  async analyzeBulkEmails(emails: any[], userId?: string) {
    try {
      const now = new Date();
      let activeTimezone = "Asia/Kolkata";

      if (userId) {
        const user = await this.usersService.findById(userId);
        if (user?.preferences?.timezone) {
          activeTimezone = user.preferences.timezone;
        }
      }

      const timeFormatter = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: activeTimezone,
      });
      const dateFormatter = new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: activeTimezone,
      });

      const userLocalDate = dateFormatter
        .format(now)
        .split("/")
        .reverse()
        .join("-");
      const userLocalTime = timeFormatter.format(now);

      // Generate a dynamic cheat sheet for the next 8 days so AI maps weekdays (e.g. "Monday") to the correct date exactly.
      const daysProjection = Array.from({ length: 8 })
        .map((_, i) => {
          const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
          return new Intl.DateTimeFormat("en-GB", {
            weekday: "short",
            month: "short",
            day: "2-digit",
            timeZone: activeTimezone,
          }).format(d);
        })
        .join(" -> ");

      const prompt = `
        Analyze incoming emails for scheduling intent. 
        
        TEMPORAL CONTEXT (CRITICAL):
        - User's Timezone: ${activeTimezone}
        - User's Current Local Date: ${userLocalDate}
        - User's Current Local Time: ${userLocalTime}
        - 8-Day Calendar Cheat Sheet (Local): ${daysProjection}

        Task: Determine if emails are requesting or proposing a meeting.
        
        Return a JSON array where each object MUST follow this schema:
        - id: string (the exact email ID provided)
        - is_event: boolean (true if meeting request, false otherwise)
        - is_scam: boolean (true if it looks like spam/phishing)
        - title: string (create a clear title for the event)
        - start_time: UTC ISO string (Use the Calendar Cheat Sheet to find the correct local date requested in the email, combine it with the requested local time, and convert that final local time to a UTC ISO string by applying the offset for ${activeTimezone}).
        - duration_minutes: number (default 60 if unspecified)
        - severity_score: number (1 to 100. 1=tea time, 100=critical production issue)
        - type: string (choose: "meeting", "interview", "gym", "travel", "other")
        - is_reschedulable: boolean (MUST BE false for gym/tea time, true otherwise)
        - reasoning: string (short sentence explaining classification)

        Emails Data: ${JSON.stringify(emails)}
        
        Return ONLY valid raw JSON array.
      `;

      const { text } = await this.generateWithFallback(prompt);
      const cleaned = this.cleanJson(text);
      console.log("[EMAIL ANALYSIS SUCCESS]", cleaned);
      return JSON.parse(cleaned);
    } catch (e: any) {
      console.error("[EMAIL ANALYSIS FAILURE]", e.message);
      return [];
    }
  }

  async parseEmail(content: string) {
    const res = await this.analyzeBulkEmails([{ id: "1", content }]);
    return res[0] || { is_event: false };
  }

  async scheduleFromNaturalLanguage(userId: string, input: string) {
    const { text } = await this.generateWithFallback(`Extract: ${input}`);
    return JSON.parse(this.cleanJson(text));
  }

  async parseImageToEvent(imageBuffer: Buffer, mimeType: string) {
    return { title: "Extracted" };
  }

  private checkStaticFaqs(message: string): string | null {
    const lowerMsg = message.toLowerCase();
    const match = STATIC_FAQS.find((faq) =>
      faq.keywords.some((k) => lowerMsg.includes(k)),
    );
    return match ? match.answer : null;
  }
}
