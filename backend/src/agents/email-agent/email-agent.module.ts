import { Module, forwardRef } from "@nestjs/common";
import { EmailAgentService } from "./email-agent.service";
import { AccountsModule } from "../../accounts/accounts.module";
import { EventsModule } from "../../events/events.module";
import { KafkaModule } from "../../kafka/kafka.module";
import { AiModule } from "../../ai/ai.module";

@Module({
  imports: [
    AccountsModule,
    forwardRef(() => AiModule),
    forwardRef(() => EventsModule),
    forwardRef(() => KafkaModule),
  ],
  providers: [EmailAgentService],
  exports: [EmailAgentService],
})
export class EmailAgentModule {}
