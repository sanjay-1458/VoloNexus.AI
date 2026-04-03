import { Module } from '@nestjs/common';
import { SchedulerAgentModule } from './scheduler-agent/scheduler-agent.module';
import { EmailAgentModule } from './email-agent/email-agent.module';
import { NotificationAgentModule } from './notification-agent/notification-agent.module';
import { ContextAgentModule } from './context-agent/context-agent.module';
import { VoiceAgentModule } from './voice-agent/voice-agent.module';
import { AnalyticsAgentModule } from './analytics-agent/analytics-agent.module';
import { MonitoringAgentModule } from './monitoring-agent/monitoring-agent.module';

@Module({
  imports: [
    SchedulerAgentModule,
    EmailAgentModule,
    NotificationAgentModule,
    ContextAgentModule,
    VoiceAgentModule,
    AnalyticsAgentModule,
    MonitoringAgentModule,
  ],
  exports: [
    SchedulerAgentModule,
    EmailAgentModule,
    NotificationAgentModule,
    ContextAgentModule,
    VoiceAgentModule,
    AnalyticsAgentModule,
    MonitoringAgentModule,
  ],
})
export class AgentsModule {}