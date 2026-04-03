import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { KafkaModule } from "../kafka/kafka.module";
import { AccountsModule } from "../accounts/accounts.module";

@Module({
  imports: [KafkaModule, AccountsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
