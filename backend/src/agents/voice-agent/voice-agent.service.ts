import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { AiService } from "../../ai/ai.service";
import { EventsService } from "../../events/events.service";

@Injectable()
export class VoiceAgentService {
  private readonly logger = new Logger(VoiceAgentService.name);

  constructor(
    @Inject(forwardRef(() => AiService))
    private readonly aiService: AiService,
    private readonly eventsService: EventsService,
  ) {
    this.logger.log("Voice & Input Agent fully operational");
  }

  async processVoiceInput(text: string, userId: string): Promise<any> {
    this.logger.log(`Processing voice intent: "${text}" for user ${userId}`);

    try {
      const result = await this.aiService.scheduleFromNaturalLanguage(
        userId,
        text,
      );

      switch (result.intent) {
        case "create":
          if (!result.conflict) {
            return await this.eventsService.create(userId, result.details);
          }
          return result;

        case "query":
          const events = await this.eventsService.findByUser(userId);
          return events.slice(0, 3);

        case "cancel":
          if (result.details.eventId) {
            return await this.eventsService.cancel(
              result.details.eventId,
              userId,
            );
          }
          return { error: "Could not find the event to cancel" };

        default:
          return {
            intent: result.intent,
            response: "Intent recognized but no handler assigned.",
            details: result.details,
          };
      }
    } catch (error: any) {
      this.logger.error(`Voice processing failed: ${error.message}`);
      return { error: "Failed to process voice command" };
    }
  }

  async parseImage(imageBase64: string, mimeType: string): Promise<any> {
    this.logger.log("[Voice Agent] Parsing multimodal image data");

    try {
      const imageBuffer = Buffer.from(imageBase64, "base64");

      const parsedData = await this.aiService.parseImageToEvent(
        imageBuffer,
        mimeType,
      );

      return {
        parsed_event: parsedData,
        confidence: 0.9,
        message: "Event details extracted from image successfully",
      };
    } catch (error: any) {
      this.logger.error(`Image parsing failed: ${error.message}`);
      return {
        parsed_event: null,
        error: "Could not extract event data from the image",
      };
    }
  }
}
