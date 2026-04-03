import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UsersService } from "../../users/users.service";

@Injectable()
export class ContextAgentService implements OnModuleInit {
  private readonly logger = new Logger(ContextAgentService.name);
  private pinecone: Pinecone | null = null;
  private genAI: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const geminiKey = this.configService.get<string>("ai.geminiApiKey");
    if (!geminiKey) throw new Error("GEMINI_API_KEY missing");
    this.genAI = new GoogleGenerativeAI(geminiKey);

    const pineconeKey = this.configService.get<string>("ai.pineconeApiKey");
    if (!pineconeKey) {
      this.logger.warn(
        "Pinecone API Key missing. Context Agent running in stub mode.",
      );
    } else {
      this.pinecone = new Pinecone({ apiKey: pineconeKey });
    }
  }

  async onModuleInit() {
    this.logger.log("Context Agent Memory Engine Initialized");
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({
      model: "text-embedding-004",
    });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async getUserContext(userId: string): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) return { error: "User not found" };

    const habits = await this.queryPatterns(
      userId,
      "What are the user's typical scheduling habits?",
    );

    return {
      userId,
      preferences: user.preferences,
      automation_rules: user.automation_rules,
      habits: habits,
      timestamp: new Date().toISOString(),
    };
  }

  async recordBehavior(
    userId: string,
    behaviorType: "completion" | "cancellation" | "preference",
    details: any,
  ): Promise<void> {
    if (!this.pinecone) return;

    const behaviorDescription = `Behavior: ${behaviorType}. Action: ${details.description ?? "No description"}. 
      Day: ${details.dayOfWeek ?? "Unknown"}. Time: ${details.time ?? "N/A"}. 
      Priority: ${details.priority ?? "medium"}. Result: ${details.outcome ?? "recorded"}.`;

    try {
      const vector = await this.getEmbedding(behaviorDescription);
      const index = this.pinecone.index("volonexus-ai-context");

      await index.namespace(userId).upsert({
        records: [
          {
            id: `pattern-${Date.now()}`,
            values: vector,
            metadata: {
              behaviorType,
              details: JSON.stringify(details),
              is_cancellation: behaviorType === "cancellation",
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      this.logger.log(
        `[Context Agent] Behavior ${behaviorType} synced to Pinecone for user ${userId}`,
      );
    } catch (error: any) {
      this.logger.error("Failed to record behavior pattern", error.stack);
    }
  }

  async queryPatterns(userId: string, query: string): Promise<any[]> {
    if (!this.pinecone) return [];

    try {
      const vector = await this.getEmbedding(query);
      const index = this.pinecone.index("volonexus-ai-context");

      const results = await index.namespace(userId).query({
        vector,
        topK: 5,
        includeMetadata: true,
      });

      return (
        results.matches?.map((match) => ({
          habit: match.metadata?.behaviorType?.toString() ?? "unknown",
          details: match.metadata?.details
            ? JSON.parse(match.metadata.details.toString())
            : {},
          confidence: match.score ?? 0,
        })) ?? []
      );
    } catch (error: any) {
      this.logger.error("Vector Search Failed", error.stack);
      return [];
    }
  }

  async evaluateRules(
    userId: string,
    proposedEvent: any,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.automation_rules || user.automation_rules.length === 0)
      return { allowed: true };

    const { start_time, type } = proposedEvent;
    const date = new Date(start_time);
    const day = date.toLocaleDateString("en-US", { weekday: "long" });

    for (const rule of user.automation_rules) {
      if (!rule.enabled) continue;

      const condition = rule.condition.toLowerCase();

      if (condition.includes(`no ${day.toLowerCase()}`)) {
        return {
          allowed: false,
          reason: `User rule (${rule.name}): No scheduling on ${day}`,
        };
      }

      if (type === "gym") {
        return { allowed: true };
      }
    }

    return { allowed: true };
  }

  async queryMemory(userId: string, query: string): Promise<string> {
    if (!this.pinecone)
      return "No historical memory found (Pinecone disabled).";

    try {
      const index = this.pinecone.index("volonexus-ai-context");

      const embeddingModel = this.genAI.getGenerativeModel({
        model: "text-embedding-004",
      });
      const embedResult = await embeddingModel.embedContent(query);
      const vector = embedResult.embedding.values;

      const queryResponse = await index.namespace(userId).query({
        vector: vector,
        topK: 3,
        includeMetadata: true,
      });

      const memories = queryResponse.matches.map((m) => {
        const type = m.metadata?.behaviorType || "unknown";
        const details = m.metadata?.details || "";
        return `[Behavior: ${type}] - ${details}`;
      });

      return memories.length > 0
        ? memories.join(" | ")
        : "No historical memory found.";
    } catch (e: any) {
      this.logger.warn(`Pinecone memory query failed: ${e.message}`);
      return "No historical memory found.";
    }
  }
}
