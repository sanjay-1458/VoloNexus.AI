import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { Event, EventSchema } from "./schemas/event.schema";
import { UsersModule } from "../users/users.module";
import { KafkaModule } from "../kafka/kafka.module";
import { RedisModule } from "../redis/redis.module";
import { EventsGateway } from "./events.gateway";
import { ContextAgentModule } from "../agents/context-agent/context-agent.module";
import { AccountsModule } from "../accounts/accounts.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    UsersModule,
    forwardRef(() => KafkaModule),
    forwardRef(() => ContextAgentModule),
    forwardRef(() => AccountsModule),
    forwardRef(() => NotificationsModule),
    RedisModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsGateway],
  exports: [EventsService],
})
export class EventsModule {}
