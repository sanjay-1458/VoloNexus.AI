import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";

import configuration from "./config/configuration";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { EventsModule } from "./events/events.module";
import { AccountsModule } from "./accounts/accounts.module";
import { SettingsModule } from "./settings/settings.module";
import { AdminModule } from "./admin/admin.module";
import { TestimonialsModule } from "./testimonials/testimonials.module";
import { AiModule } from "./ai/ai.module";
import { BugsModule } from "./bugs/bugs.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AgentsModule } from "./agents/agents.module";
import { KafkaModule } from "./kafka/kafka.module";
import { RedisModule } from "./redis/redis.module";
import { StripeModule } from "./stripe/stripe.module";
import { WebhooksModule } from "./webhooks/webhooks.module";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URL"),
        dbName: configService.get<string>("database.mongoDbName"),
        family: 4,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    EventsModule,
    AccountsModule,
    SettingsModule,
    AdminModule,
    TestimonialsModule,
    AiModule,
    BugsModule,
    NotificationsModule,
    AgentsModule,
    StripeModule,

    KafkaModule,
    RedisModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    console.log("VoloNexus.AI application initialized successfully");
  }
}
