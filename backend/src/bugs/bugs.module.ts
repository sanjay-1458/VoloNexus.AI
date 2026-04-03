import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BugsController } from "./bugs.controller";
import { BugsService } from "./bugs.service";
import { BugReport, BugReportSchema } from "./schemas/bug.schema";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BugReport.name, schema: BugReportSchema },
    ]),
    AiModule,
  ],
  controllers: [BugsController],
  providers: [BugsService],
  exports: [BugsService],
})
export class BugsModule {}
