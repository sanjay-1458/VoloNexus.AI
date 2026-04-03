import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@ApiTags("Admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("analytics")
  @ApiOperation({ summary: "Get dashboard analytics" })
  async analytics() {
    return this.adminService.getDashboardAnalytics();
  }

  @Get("users")
  @ApiOperation({ summary: "Get detailed users with sync and event data" })
  async getUsers(@Query("plan") plan?: string) {
    return this.adminService.getDetailedUsers(plan);
  }

  @Get("revenue")
  @ApiOperation({ summary: "Get MRR, ARR, and financial metrics" })
  async getRevenue() {
    return this.adminService.getRevenueIntelligence();
  }

  @Get("events/analytics")
  @ApiOperation({ summary: "Get platform-wide event heatmap and distribution" })
  async getEventsAnalytics(
    @Query("year") year?: string,
    @Query("month") month?: string,
  ) {
    return this.adminService.getGlobalEventIntelligence(year, month);
  }

  @Get("sync-active")
  @ApiOperation({ summary: "Get status of all connected OAuth accounts" })
  async getSyncActive() {
    return this.adminService.getActiveSynchronizations();
  }

  @Delete("bugs/:id")
  @ApiOperation({ summary: "Permanently delete a bug report" })
  async deleteBug(@Param("id") id: string) {
    return this.adminService.deleteBug(id);
  }

  @Get("agents")
  @ApiOperation({ summary: "Get agent logs" })
  async agentLogs(
    @Query("agent") agent?: string,
    @Query("limit") limit?: number,
  ) {
    return this.adminService.getAgentLogs(agent, limit || 50);
  }

  @Get("api-health")
  @ApiOperation({ summary: "Get API health status" })
  async apiHealth() {
    return this.adminService.getApiHealth();
  }

  @Get("llm-metrics")
  @ApiOperation({ summary: "Get LLM usage metrics" })
  async llmMetrics() {
    return this.adminService.getLlmMetrics();
  }

  @Get("subscriptions")
  @ApiOperation({ summary: "Get subscription overview" })
  async subscriptions() {
    return this.adminService.getSubscriptionOverview();
  }

  @Get("reviews")
  @ApiOperation({ summary: "Get all reviews (1-5 stars)" })
  async reviews() {
    return this.adminService.getAllReviews();
  }
}
