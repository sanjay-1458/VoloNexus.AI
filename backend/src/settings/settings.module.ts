import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { UsersModule } from "../users/users.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [UsersModule, RedisModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
