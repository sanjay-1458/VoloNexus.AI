import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";

@Injectable()
export class MonitoringAgentService {
  private readonly logger = new Logger(MonitoringAgentService.name);

  constructor(
    @InjectModel("AgentLog") private agentLogModel: Model<any>,
    @InjectModel("ApiHealth") private apiHealthModel: Model<any>,
    @InjectModel("LlmMetric") private llmMetricModel: Model<any>,
  ) {
    this.logger.log("Monitoring Agent fully operational");
  }

  async logAgentDecision(
    agentName: string,
    decision: string,
    reasoning: string,
    context: any,
  ): Promise<void> {
    try {
      await this.agentLogModel.create({
        agent: agentName,
        decision,
        reasoning,
        context,
      });
      this.logger.debug(`Logged decision from ${agentName}: ${decision}`);
    } catch (error: any) {
      this.logger.error(`Failed to log agent decision: ${error.message}`);
    }
  }

  async checkApiHealth(apiName: string, healthCheckUrl: string): Promise<any> {
    const start = Date.now();
    let status = "down";
    let errorMessage = "";

    try {
      if (healthCheckUrl) {
        await axios.get(healthCheckUrl, { timeout: 5000 });
      }
      status = "healthy";
    } catch (error: any) {
      status = "down";
      errorMessage = error.message;
      this.logger.warn(
        `API Health check failed for ${apiName}: ${errorMessage}`,
      );
    }

    const latency = Date.now() - start;

    await this.apiHealthModel.findOneAndUpdate(
      { api_name: apiName },
      { status, latency, error: errorMessage, checked_at: new Date() },
      { upsert: true, new: true },
    );

    return { api: apiName, status, latency };
  }

  async logLlmMetric(metric: {
    provider: string;
    model: string;
    tokens_in?: number;
    tokens_out?: number;
    latency: number;
    success: boolean;
    error?: string;
  }): Promise<void> {
    try {
      await this.llmMetricModel.create(metric);
    } catch (error: any) {
      this.logger.error(`Failed to log LLM metric: ${error.message}`);
    }
  }

  async getAggregatedMetrics(timeRange: {
    from: Date;
    to: Date;
  }): Promise<any> {
    const logs = await this.agentLogModel
      .find({ timestamp: { $gte: timeRange.from, $lte: timeRange.to } })
      .sort({ timestamp: -1 })
      .limit(50);
    const health = await this.apiHealthModel.find({});

    const totalRequests = await this.llmMetricModel.countDocuments();
    const failures = await this.llmMetricModel.countDocuments({
      success: false,
    });

    return {
      api_health: health,
      llm_metrics: {
        total_requests: totalRequests,
        failure_rate: totalRequests > 0 ? (failures / totalRequests) * 100 : 0,
      },
      agent_activity: logs,
    };
  }

  async getRecentLogs(limit: number = 50) {
    return this.agentLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getApiStatuses() {
    return this.apiHealthModel.find().exec();
  }

  async getLlmAggregations() {
    const metrics = await this.llmMetricModel.find().exec();

    const claude = metrics.filter((m) => m.provider === "claude");
    const gemini = metrics.filter((m) => m.provider === "gemini");

    const calcAvg = (arr: any[], field: string) =>
      arr.length
        ? arr.reduce((sum, item) => sum + (item[field] || 0), 0) / arr.length
        : 0;
    const calcFailures = (arr: any[]) => arr.filter((m) => !m.success).length;

    return {
      total_requests: metrics.length,
      total_tokens: metrics.reduce(
        (sum, m) => sum + (m.tokens_in || 0) + (m.tokens_out || 0),
        0,
      ),
      avg_latency_ms: calcAvg(metrics, "latency"),
      failure_rate: metrics.length
        ? (calcFailures(metrics) / metrics.length) * 100
        : 0,
      by_provider: {
        claude: {
          requests: claude.length,
          tokens: claude.reduce(
            (sum, m) => sum + (m.tokens_in || 0) + (m.tokens_out || 0),
            0,
          ),
          avg_latency: calcAvg(claude, "latency"),
          failures: calcFailures(claude),
        },
        gemini: {
          requests: gemini.length,
          tokens: gemini.reduce(
            (sum, m) => sum + (m.tokens_in || 0) + (m.tokens_out || 0),
            0,
          ),
          avg_latency: calcAvg(gemini, "latency"),
          failures: calcFailures(gemini),
        },
      },
    };
  }
}
