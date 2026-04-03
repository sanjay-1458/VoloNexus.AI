import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { UsersModule } from "../users/users.module";
import { EventsModule } from "../events/events.module";
import { AccountsModule } from "../accounts/accounts.module";
import { BugsModule } from "../bugs/bugs.module";
import { TestimonialsModule } from "../testimonials/testimonials.module";
import { MonitoringAgentModule } from "../agents/monitoring-agent/monitoring-agent.module";

@Module({
  imports: [
    UsersModule,
    EventsModule,
    AccountsModule,
    BugsModule,
    TestimonialsModule,
    MonitoringAgentModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
