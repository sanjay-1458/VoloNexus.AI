import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { KafkaService } from "../kafka/kafka.service";
import { AccountsService } from "../accounts/accounts.service";
import { google } from "googleapis";

@ApiTags("Webhooks")
@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly accountsService: AccountsService,
  ) {}

  @Post("google")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Receive Gmail Push Notifications via Google Pub/Sub",
  })
  async handleGooglePushNotification(@Body() body: any) {
    try {
      if (!body.message || !body.message.data) {
        throw new BadRequestException("Invalid Pub/Sub payload structure");
      }

      const decodedData = Buffer.from(body.message.data, "base64").toString(
        "utf-8",
      );
      const payload = JSON.parse(decodedData);

      const { emailAddress, historyId } = payload;

      if (!emailAddress || !historyId) {
        return "OK";
      }

      this.logger.log(
        `🔔 Google Push Notification received for: ${emailAddress}`,
      );

      const connectedAccounts = await this.accountsService.findAllConnected();
      const account = connectedAccounts.find(
        (a) => a.email.toLowerCase() === emailAddress.toLowerCase(),
      );

      if (!account) {
        this.logger.warn(
          `Received webhook for unknown or disconnected email: ${emailAddress}`,
        );
        return "OK";
      }

      const accountId = account._id.toString();

      const oauth2Client =
        await this.accountsService.getValidOAuthClient(accountId);
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const historyResponse = await gmail.users.history.list({
        userId: "me",
        startHistoryId: (parseInt(historyId) - 10).toString(),
        historyTypes: ["messageAdded"],
      });

      if (historyResponse.data.history) {
        for (const record of historyResponse.data.history) {
          if (record.messagesAdded) {
            for (const msg of record.messagesAdded) {
              if (msg.message && msg.message.id) {
                this.logger.log(
                  `🎯 Extracted New Message ID [${msg.message.id}] - Firing Agent!`,
                );

                await this.kafkaService.publish("email.received", {
                  accountId: accountId,
                  messageId: msg.message.id,
                });
              }
            }
          }
        }
      }

      return "OK";
    } catch (error: any) {
      this.logger.error(`Webhook Processing Error: ${error.message}`);
      return "OK";
    }
  }
}
