import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { MonitoringAgentService } from "./monitoring-agent.service";

export const AgentLogSchema = new MongooseSchema({
  agent: { type: String, required: true },
  decision: { type: String, required: true },
  reasoning: { type: String, required: true },
  context: { type: MongooseSchema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

export const ApiHealthSchema = new MongooseSchema({
  api_name: { type: String, required: true },
  status: {
    type: String,
    enum: ["healthy", "degraded", "down", "unknown"],
    default: "unknown",
  },
  latency: { type: Number },
  error: { type: String },
  checked_at: { type: Date, default: Date.now },
});

export const LlmMetricSchema = new MongooseSchema({
  provider: { type: String, required: true },
  model: { type: String, required: true },
  tokens_in: { type: Number, default: 0 },
  tokens_out: { type: Number, default: 0 },
  latency: { type: Number, required: true },
  success: { type: Boolean, required: true },
  error: { type: String },
  timestamp: { type: Date, default: Date.now },
});

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "AgentLog", schema: AgentLogSchema },
      { name: "ApiHealth", schema: ApiHealthSchema },
      { name: "LlmMetric", schema: LlmMetricSchema },
    ]),
  ],
  providers: [MonitoringAgentService],
  exports: [MonitoringAgentService],
})
export class MonitoringAgentModule {}
