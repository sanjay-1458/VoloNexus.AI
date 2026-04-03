import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Logger,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Request } from "express";

@ApiTags("AI")
@Controller("ai")
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private aiService: AiService) {}

  private extractUserId(req: Request): string | null {
    try {
      let token = req.headers.authorization?.split(" ")[1];
      if (!token && req.cookies && req.cookies["access_token"]) {
        token = req.cookies["access_token"];
      }
      if (!token) return null;

      const payload = token.split(".")[1];
      const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
      return decoded.sub || decoded.id || decoded._id || decoded.userId;
    } catch (e) {
      return null;
    }
  }

  @Post("chat")
  async chat(@Body() body: any, @Req() req: Request) {
    const userId = this.extractUserId(req);
    if (userId) this.logger.log(`[Chat] Authorized Request: ${userId}`);

    return this.aiService.chat(
      userId,
      body.message,
      body.history || [],
      body.timezone,
    );
  }

  @Get("history")
  async getHistory(@Req() req: Request) {
    const userId = this.extractUserId(req);
    if (!userId) return [];

    return this.aiService.getStoredHistory(userId);
  }

  @Delete("history")
  async clearHistory(@Req() req: Request) {
    const userId = this.extractUserId(req);
    if (!userId) return { success: false, message: "Unauthorized" };

    await this.aiService.clearStoredHistory(userId);
    return { success: true, message: "History cleared successfully" };
  }

  @Post("schedule")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async schedule(
    @CurrentUser("_id") userId: string,
    @Body() body: { input: string },
  ) {
    return this.aiService.scheduleFromNaturalLanguage(
      userId.toString(),
      body.input,
    );
  }

  @Post("resolve-conflict")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async resolveConflict(
    @CurrentUser("_id") userId: string,
    @Body() body: { event_id: string; conflicting_event_id: string },
  ) {
    return this.aiService.resolveConflict(
      userId.toString(),
      body.event_id,
      body.conflicting_event_id,
    );
  }

  @Post("parse-email")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async parseEmail(@Body() body: { email_content: string }) {
    return this.aiService.parseEmail(body.email_content);
  }
}
