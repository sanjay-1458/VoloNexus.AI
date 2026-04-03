import { Module } from "@nestjs/common";
import { ContextAgentService } from "./context-agent.service";
import { UsersModule } from "../../users/users.module";

@Module({
  imports: [UsersModule],
  providers: [ContextAgentService],
  exports: [ContextAgentService],
})
export class ContextAgentModule {}
