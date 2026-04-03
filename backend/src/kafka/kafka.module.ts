import { Module, forwardRef } from "@nestjs/common";
import { KafkaService } from "./kafka.service";
import { SchedulerAgentModule } from "../agents/scheduler-agent/scheduler-agent.module";
import { EmailAgentModule } from "../agents/email-agent/email-agent.module";
import { NotificationAgentModule } from "../agents/notification-agent/notification-agent.module";
import { MonitoringAgentModule } from "../agents/monitoring-agent/monitoring-agent.module";

@Module({
  imports: [
    forwardRef(() => SchedulerAgentModule),
    forwardRef(() => EmailAgentModule),
    forwardRef(() => NotificationAgentModule),
    MonitoringAgentModule,
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
