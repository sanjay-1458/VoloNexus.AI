import { Module, forwardRef } from '@nestjs/common';
import { SchedulerAgentService } from './scheduler-agent.service';
import { EventsModule } from '../../events/events.module'; 
import { UsersModule } from '../../users/users.module';   
import { KafkaModule } from '../../kafka/kafka.module';   
import { AiModule } from '../../ai/ai.module'; 
import { ContextAgentModule } from '../context-agent/context-agent.module';

@Module({
  imports: [
    forwardRef(() => EventsModule), 
    forwardRef(() => KafkaModule),
    forwardRef(() => AiModule),
    forwardRef(() => ContextAgentModule),
    UsersModule, 
  ],
  providers: [SchedulerAgentService],
  exports: [SchedulerAgentService],
})
export class SchedulerAgentModule {}