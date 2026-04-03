import { Module, forwardRef } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { EventsModule } from "../events/events.module";
import { UsersModule } from "../users/users.module";
import { MonitoringAgentModule } from "../agents/monitoring-agent/monitoring-agent.module";
import { ContextAgentModule } from "../agents/context-agent/context-agent.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [
    forwardRef(() => EventsModule),
    UsersModule,
    forwardRef(() => MonitoringAgentModule),
    forwardRef(() => ContextAgentModule),
    RedisModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
