import { Module, forwardRef } from "@nestjs/common";
import { VoiceAgentService } from "./voice-agent.service";
import { AiModule } from "../../ai/ai.module";
import { EventsModule } from "../../events/events.module";

@Module({
  imports: [EventsModule, forwardRef(() => AiModule)],
  providers: [VoiceAgentService],
  exports: [VoiceAgentService],
})
export class VoiceAgentModule {}
