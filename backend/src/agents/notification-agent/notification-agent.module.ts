import { Module, forwardRef } from "@nestjs/common";
import { NotificationAgentService } from "./notification-agent.service";
import { NotificationsModule } from "../../notifications/notifications.module";
import { UsersModule } from "../../users/users.module";
import { KafkaModule } from "../../kafka/kafka.module";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [
    NotificationsModule,
    UsersModule,
    RedisModule,
    forwardRef(() => KafkaModule),
  ],
  providers: [NotificationAgentService],
  exports: [NotificationAgentService],
})
export class NotificationAgentModule {}
