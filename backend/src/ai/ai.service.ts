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
      return JSON.parse(jsonMatch[0]);
    } catch (e: any) {
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

      const userLocalDate = new Intl.DateTimeFormat("en-GB", {
        dateStyle: "full",
        timeZone: activeTimezone,
      }).format(now);
      const userLocalTime = new Intl.DateTimeFormat("en-GB", {
        timeStyle: "short",
        timeZone: activeTimezone,
      }).format(now);

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

      const events = await this.eventsService.findByUser(userId, {
        start_date: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
        end_date: thirtyDaysFromNow.toISOString(),
      });

      const analysisPrompt = `
        You are an intelligent scheduling assistant with strict reasoning and memory awareness.

        1. MULTI-TASKING & CONVERSATION LOOP
        - If the user asks for MULTIPLE things, generate a separate action object for EACH request.
        - If the user asks a general question about their schedule, use the "answer" action and write a natural response.

        2. TIME RULES (CRITICAL)
        - User's Timezone: ${activeTimezone}
        - User's Local Date: ${userLocalDate}
        - User's Local Time: ${userLocalTime}
        - System UTC Time: ${now.toISOString()}
        - Use the User's Local Date to calculate relative days (e.g. "next Tuesday").
        - NEVER suggest a time in the past or less than 10 mins from now.

        3. FORMATTING (CRITICAL)
        - When using the "answer" action to list events, YOU MUST FORMAT THE EVENTS AS A CLEAN MARKDOWN TABLE (Columns: Date, Time, Title, Priority).
        - DO NOT output messy raw text lists.

        4. MODIFYING EVENTS & MEMORY (EXACT ID MATCHING & INHERITANCE)
        - To reschedule or cancel an event, YOU MUST USE THE EXACT 'id' FROM THE CURRENT EVENTS LIST below in the "target_id" field. Do NOT use fuzzy guessing if you have the ID.
        - INHERITANCE: If rescheduling an existing event, YOU MUST INHERIT its duration, severity, and other details from the CURRENT EVENTS list. DO NOT trigger "ask_user" for missing details if you are modifying an existing event! Only use "ask_user" for completely new events with missing info.
        - If user already provided details in previous turns, retain them from history.

        5. INPUT EXTRACTION & PRIORITY ENGINE
        Extract: title, start_time (UTC ISO), duration (mins), description, location, type.
        - Assign "severity_score" (1 to 100).
        - Assign "is_reschedulable" boolean. MUST BE FALSE for "gym", "walking", "tea_time". True for others.
        
        LONG-TERM USER PREFERENCES (From Pinecone): ${pineconeMemory || "None found."}
        CURRENT EVENTS (UTC): ${JSON.stringify(events.map((e) => ({ id: e._id, title: e.title, start: e.start_time, end: e.end_time, source: e.source, score: e.severity_score })))}
        RECENT CHAT HISTORY (Redis): ${JSON.stringify(activeHistory.slice(-6))}
        USER MESSAGE: "${message}"

        Analyze and return ONLY structured JSON. Return an array of "actions":
        {
          "actions": [
            {
              "type": "create" | "reschedule" | "ask_user" | "cancel" | "answer",
              "answer_text": "string (MUST use Markdown tables for schedules)",
              "target_id": "string (the exact ID of the event to modify from the CURRENT EVENTS list)",
              "event": { 
                "title": "string", 
                "start_time": "UTC_ISO_STRING", 
                "duration": "number (optional if rescheduling)",
                "severity_score": "number (optional if rescheduling)",
                "severity": "low | medium | high | critical",
                "is_reschedulable": boolean,
                "type": "string"
              },
              "fuzzy_target": "string (only if exact ID is unknown)"
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
        if (a.type !== b.type)
          return (order[a.type] || 99) - (order[b.type] || 99);

        if (a.type === "reschedule" && b.type === "reschedule") {
          const timeA = a.event?.start_time
            ? new Date(a.event.start_time).getTime()
            : 0;
          const timeB = b.event?.start_time
            ? new Date(b.event.start_time).getTime()
            : 0;
          return timeB - timeA;
        }
        return 0;
      });

      for (const act of actions) {
        const actionType = act.type || act.action;

        try {
          if (actionType === "answer" && act.answer_text) {
            const updatedEvents = await this.eventsService.findByUser(userId, {
              start_date: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
              end_date: thirtyDaysFromNow.toISOString(),
            });

            const answerPrompt = `
              Generate a clean, strictly formatted MARKDOWN TABLE of the following events.
              Columns MUST BE: Date | Time | Title | Priority.
              Format the date and time using ${activeTimezone}.
              Events: ${JSON.stringify(updatedEvents.map((e) => ({ title: e.title, start: e.start_time, score: e.severity_score })))}
            `;
            const { text: generatedTable } =
              await this.generateWithFallback(answerPrompt);
            answerTexts.push(generatedTable);
          } else if (actionType === "ask_user") {
            needsOnboarding = true;
          } else if (
            actionType === "cancel" &&
            (act.target_id || act.fuzzy_target)
          ) {
            let target: any = null;
            if (act.target_id)
              target = await this.eventsService.findById(act.target_id, userId);
            if (!target && act.fuzzy_target)
              target = await this.eventsService.fuzzyFindEvent(
                userId,
                act.fuzzy_target,
              );

            if (target) {
              await this.eventsService.cancel(target._id.toString(), userId);
              actionTaken = true;
              actionResults.push(`✅ Canceled: **${target.title}**`);
            } else {
              actionResults.push(
                `❌ Could not find event to cancel: "${act.target_id || act.fuzzy_target}"`,
              );
            }
          } else if (
            actionType === "reschedule" &&
            (act.target_id || act.fuzzy_target)
          ) {
            let target: any = null;
            if (act.target_id)
              target = await this.eventsService.findById(act.target_id, userId);
            if (!target && act.fuzzy_target)
              target = await this.eventsService.fuzzyFindEvent(
                userId,
                act.fuzzy_target,
              );

            if (target) {
              const updatePayload: any = { ...act.event };

              if (act.event.start_time) {
                const start = new Date(act.event.start_time);
                const dur =
                  act.event.duration ||
                  (target.end_time.getTime() - target.start_time.getTime()) /
                    60000;
                const end = new Date(start.getTime() + dur * 60000);
                updatePayload.start_time = start.toISOString();
                updatePayload.end_time = end.toISOString();
              }

              if (target.source === "calendar_sync") {
                updatePayload.source = "assistant";
              }

              await this.eventsService.update(
                target._id.toString(),
                userId,
                updatePayload,
              );
              actionTaken = true;
              actionResults.push(`📅 Rescheduled: **${target.title}**`);
            } else {
              actionResults.push(
                `❌ Could not find event to reschedule: "${act.target_id || act.fuzzy_target}"`,
              );
            }
          } else if (
            actionType === "create" &&
            act.event?.title &&
            act.event?.start_time
          ) {
            await this.eventsService.create(userId, act.event, activeTimezone);
            actionTaken = true;
            actionResults.push(`✨ Scheduled: **${act.event.title}**`);
          }
        } catch (error: any) {
          if (error.response?.message === "CONFLICT_DETECTED") {
            const conflictingEvent = error.response.conflictingEvent;
            const reason = error.response.reason || "Scheduling overlap";
            const alternatives = error.response.suggestedSlots || [];

            const resolutionPrompt = `
              A conflict occurred while executing a user action.
              CONFLICT WITH: "${conflictingEvent.title}" at ${conflictingEvent.start_time}.
              REASON: ${reason}
              Alternative available slots in UTC: ${JSON.stringify(alternatives)}
              
              Write a short, natural warning message to the user in their local time (${activeTimezone}).
              State the conflict, present the alternative slots cleanly, and ask how they want to proceed.
            `;
            const { text: resolutionText } =
              await this.generateWithFallback(resolutionPrompt);
            conflictTexts.push(resolutionText);
          } else {
            actionResults.push(`❌ System Error: ${error.message}`);
          }
        }
      }

      let finalCombinedResponse = "";

      if (answerTexts.length > 0) {
        finalCombinedResponse += answerTexts.join("\n\n") + "\n\n---\n\n";
      }
      if (actionResults.length > 0) {
        finalCombinedResponse +=
          "### Update Status\n" +
          actionResults.map((r) => `- ${r}`).join("\n") +
          "\n\n";
      }
      if (conflictTexts.length > 0) {
        finalCombinedResponse +=
          "### ⚠️ Attention Required\n" + conflictTexts.join("\n\n") + "\n\n";
      }

      if (!finalCombinedResponse.trim()) {
        finalCombinedResponse = needsOnboarding
          ? "Hi! Tell me more about the meeting you'd like to schedule (title, time, duration)."
          : "I've processed your requests.";
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
      this.logger.error(`Assistant Error: ${error.message}`);
      throw new InternalServerErrorException("Assistant Recalibrating.");
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

      const prompt = `
        CONFLICT (${tz}):
        Event 1: "${e1.title}" | Event 2: "${e2.title}"
        Available Slots (UTC): ${JSON.stringify(slots)}

        Return JSON:
        {
          "suggested_slots": [{"start": "UTC_ISO", "end": "UTC_ISO"}],
          "event_to_move_id": "string",
          "reasoning": "string"
        }
      `;

      const { text } = await this.generateWithFallback(prompt);
      const resolution = this.extractJson(text);

      return {
        suggested_slots: resolution.suggested_slots || slots,
        event_to_move_id: resolution.event_to_move_id,
        reasoning: resolution.reasoning,
      };
    } catch (e) {
      return { suggested_slots: [], reasoning: "Resolution failed." };
    }
  }

  async analyzeBugReport(description: string, severity: string = "medium") {
    try {
      const { text } = await this.generateWithFallback(
        `Analyze bug: ${description} (Severity: ${severity}). Return JSON with "summary" and "impact_analysis".`,
      );
      const res = this.extractJson(text);
      return {
        is_relevant: true,
        summary: res.summary || description,
        impact_analysis: res.impact_analysis || "Standard impact.",
      };
    } catch (e) {
      return {
        is_relevant: true,
        summary: description,
        impact_analysis: "Manual review required.",
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
    throw lastError || new Error("AI models failed.");
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

      const userLocalDate = new Intl.DateTimeFormat("en-GB", {
        dateStyle: "full",
        timeZone: activeTimezone,
      }).format(now);
      const userLocalTime = new Intl.DateTimeFormat("en-GB", {
        timeStyle: "short",
        timeZone: activeTimezone,
      }).format(now);

      const prompt = `
        Analyze the following incoming emails. Determine if they are requesting or proposing a scheduling event/meeting.
        
        CRITICAL TEMPORAL CONTEXT:
        - User's Timezone Preference: ${activeTimezone}
        - User's Current Local Date: ${userLocalDate}
        - User's Current Local Time: ${userLocalTime}
        - Calculate date time based on this user preference (${activeTimezone}).
        - Convert and return the final start_time as a valid future UTC ISO string.

        For each email, return a JSON object within an array.
        
        Required schema per object:
        - id: string (the exact email ID provided)
        - is_event: boolean (true if it's a meeting request, false otherwise)
        - is_scam: boolean (true if it looks like spam/phishing)
        - title: string (create a clear title for the event)
        - start_time: UTC ISO string (MUST be the calculated UTC conversion of the requested local time)
        - duration_minutes: number (default 60 if unspecified)
        - severity_score: number (1 to 100. Assign based on context. 1=tea time/gym, 100=critical bug/founder/client meeting)
        - type: string (choose from: "meeting", "interview", "zoom_call", "gym", "travel", "other")
        - is_reschedulable: boolean (MUST BE false for gym/tea time, true otherwise)
        - reasoning: string (a short sentence explaining your severity score and event classification)

        Emails Data: ${JSON.stringify(emails)}
        
        Return ONLY valid JSON array without any markdown formatting.
      `;
      const { text } = await this.generateWithFallback(prompt);
      return JSON.parse(this.cleanJson(text));
    } catch (e: any) {
      this.logger.error("Failed to parse bulk emails: " + e.message);
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