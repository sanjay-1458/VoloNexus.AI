import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsAgentService } from './analytics-agent.service';
import { UsersModule } from '../../users/users.module';
import { EventsModule } from '../../events/events.module';
import { AiModule } from '../../ai/ai.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    EventsModule,
    forwardRef(() => AiModule),
    NotificationsModule
  ],
  providers: [AnalyticsAgentService],
  exports: [AnalyticsAgentService],
})
export class AnalyticsAgentModule {}