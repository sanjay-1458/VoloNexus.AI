import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { EventsService } from "../events/events.service";
import { AccountsService } from "../accounts/accounts.service";
import { BugsService } from "../bugs/bugs.service";
import { TestimonialsService } from "../testimonials/testimonials.service";
import { MonitoringAgentService } from "../agents/monitoring-agent/monitoring-agent.service";

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private eventsService: EventsService,
    private accountsService: AccountsService,
    private bugsService: BugsService,
    private testimonialsService: TestimonialsService,
    private monitoringService: MonitoringAgentService,
  ) {}

  async getDashboardAnalytics() {
    const [
      totalUsers,
      adminUsers,
      freeUsers,
      paidUsers,
      eventStats,
      accountStats,
      bugStats,
    ] = await Promise.all([
      this.usersService.countUsers(),
      this.usersService.countUsers({ role: "admin" }),
      this.usersService.countUsers({ plan: "free" }),
      this.usersService.countUsers({ plan: "paid" }),
      this.eventsService.getAdminStats(),
      this.accountsService.getAdminStats(),
      this.bugsService.getStats(),
    ]);

    const earnings = { total: paidUsers * 100, this_month: 0 };

    return {
      users: {
        total: totalUsers,
        admins: adminUsers,
        free: freeUsers,
        paid: paidUsers,
      },
      events: eventStats,
      accounts: accountStats,
      bugs: bugStats,
      earnings,
      ai_agents: {
        scheduler: { status: "active", last_run: new Date() },
        email: { status: "active", last_run: new Date() },
        notification: { status: "active", last_run: new Date() },
        context: { status: "active", last_run: new Date() },
        voice: { status: "inactive", last_run: null },
        analytics: { status: "active", last_run: new Date() },
        monitoring: { status: "active", last_run: new Date() },
      },
    };
  }

  async getDetailedUsers(planFilter?: string) {
    const query = planFilter ? { plan: planFilter } : {};
    const users = await this.usersService.findAll(query);
    const enrichedUsers = await Promise.all(
      users.map(async (user: any) => {
        const userAccounts = await this.accountsService.findByUser(
          user._id.toString(),
        );
        const totalEvents = await this.eventsService.countEventsForUser(
          user._id.toString(),
        );
        const synced_accounts = userAccounts.map((acc) => ({
          _id: acc.id || acc._id,
          email: acc.email,
          provider: acc.provider || acc.type || "google",
          events_from_mail: Math.floor(totalEvents * 0.4),
          events_from_calendar: Math.floor(totalEvents * 0.6),
          status: acc.status || "active",
          last_sync: acc.last_synced || new Date(),
        }));
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          created_at:
            (user as any).created_at || (user as any).createdAt || new Date(),
          total_events: totalEvents,
          engagement_score: Math.floor(Math.random() * 100),
          mrr: user.plan === "paid" ? 100 : 0,
          ltv: user.plan === "paid" ? 1200 : 0,
          synced_accounts,
        };
      }),
    );
    return enrichedUsers;
  }

  async getRevenueIntelligence() {
    const allUsers = await this.usersService.findAll();
    const paidUsers = allUsers.filter(
      (u: any) => u.plan && u.plan.toLowerCase() !== "free",
    );
    const monthlyPrice = 100;
    const currentMRR = paidUsers.length * monthlyPrice;
    const history: Array<{ month: string; revenue: number; expenses: number }> =
      [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString("en-US", { month: "short" });

      const endOfMonth = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      const usersAtTime = paidUsers.filter((u: any) => {
        const createdAt = new Date(
          (u as any).created_at || (u as any).createdAt || 0,
        );
        return createdAt <= endOfMonth;
      });

      history.push({
        month: monthName,
        revenue: usersAtTime.length * monthlyPrice,
        expenses: 100,
      });
    }

    const recent_transactions = paidUsers
      .sort((a: any, b: any) => {
        const dateA = new Date(
          (a as any).created_at || (a as any).createdAt || 0,
        ).getTime();
        const dateB = new Date(
          (b as any).created_at || (b as any).createdAt || 0,
        ).getTime();
        return dateB - dateA;
      })
      .map((u: any, index: number) => ({
        id: `tx_${u._id.toString()}_${index}`,
        user: u.name,
        email: u.email,
        plan: u.plan || "Pro",
        amount: monthlyPrice,
        date: (
          u.created_at ||
          (u as any).createdAt ||
          new Date()
        ).toISOString(),
        status: "success",
        invoice: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      }));

    return {
      mrr: currentMRR,
      arr: currentMRR * 12,
      arpu: currentMRR > 0 ? monthlyPrice : 0,
      churnRate: 1.2,
      totalCustomers: paidUsers.length,
      growthMoM:
        history.length >= 2 && history[4].revenue > 0
          ? (
              ((history[5].revenue - history[4].revenue) / history[4].revenue) *
              100
            ).toFixed(1)
          : 0,
      history,
      recent_transactions,
    };
  }

  async getGlobalEventIntelligence(yearStr?: string, monthStr?: string) {
    const today = new Date();
    const year = yearStr ? parseInt(yearStr) : today.getFullYear();
    const month = monthStr ? parseInt(monthStr) : today.getMonth() + 1;

    const data = await this.eventsService.getGlobalAnalytics(year, month);

    const maxHourCount = Math.max(...data.peakHours.map((p) => p.count), 1);
    const peakHours = data.peakHours
      .map((p) => ({
        hour: p.hour,
        percentage: Math.round((p.count / maxHourCount) * 100),
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    const colorMap: Record<string, string> = {
      meeting: "bg-blue-500",
      zoom_call: "bg-indigo-500",
      interview: "bg-emerald-500",
      gym: "bg-rose-500",
      travel: "bg-amber-500",
      other: "bg-gray-500",
    };

    const distribution = data.typeDistribution.map((d) => ({
      type: d.type
        ? d.type.charAt(0).toUpperCase() + d.type.slice(1).replace("_", " ")
        : "Other",
      count: d.count,
      color: colorMap[d.type] || "bg-gray-500",
    }));

    return {
      totalMonth: data.totalMonth,
      totalWeek: data.totalWeek,
      busiestDayName: (data as any).busiestDayName || "--",
      conflictRate: data.conflictRate,
      calendarDays: data.calendarDays,
      peakHours: peakHours.length
        ? peakHours
        : [
            { hour: "09:00", percentage: 0 },
            { hour: "12:00", percentage: 0 },
            { hour: "15:00", percentage: 0 },
          ],
      typeDistribution: distribution.length
        ? distribution
        : [{ type: "No Events", count: 0, color: "bg-gray-500" }],
    };
  }

  async getActiveSynchronizations() {
    const accounts = await this.accountsService.findAll();
    const users = await this.usersService.findAll();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u.name]));

    return await Promise.all(
      accounts.map(async (acc: any) => {
        const importedCount = await this.eventsService.countEventsByEmail(
          acc.email,
        );
        const lastSync = new Date(
          acc.last_synced || acc.createdAt || new Date(),
        );
        const hoursSinceSync =
          (new Date().getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        let status = "healthy";
        if (acc.sync_status === "failed" || !acc.is_connected)
          status = "failed";
        else if (hoursSinceSync > 24) status = "warning";

        return {
          id: acc._id.toString(),
          user_id: acc.user_id.toString(),
          user_name: userMap.get(acc.user_id.toString()) || "Unknown User",
          account_email: acc.email,
          provider: acc.provider || acc.type || "google",
          status: status,
          last_sync: lastSync.toISOString(),
          events_imported: importedCount,
          sync_latency_ms: Math.floor(Math.random() * 200) + 50,
        };
      }),
    );
  }

  async deleteBug(id: string) {
    return this.bugsService.delete(id);
  }

  async getAgentLogs(agent?: string, limit: number = 50) {
    const logs = await this.monitoringService.getRecentLogs(limit);
    const filteredLogs = agent ? logs.filter((l) => l.agent === agent) : logs;
    return { logs: filteredLogs, message: "Live Agent logs fetched." };
  }

  async getApiHealth() {
    const dbStatuses = await this.monitoringService.getApiStatuses();

    const mappedApis = dbStatuses.map((api) => ({
      name: api.api_name,
      status: api.status,
      last_check: api.checked_at,
      latency: `${api.latency}ms`,
    }));

    return {
      apis: mappedApis,
      recent_errors: dbStatuses
        .filter((a) => a.status !== "healthy")
        .map((a) => a.error),
    };
  }

  async getLlmMetrics() {
    const aggregations = await this.monitoringService.getLlmAggregations();
    return {
      metrics: aggregations,
      message: "Live LLM metrics active.",
    };
  }

  async getSubscriptionOverview() {
    const freeUsers = await this.usersService.countUsers({ plan: "free" });
    const paidUsers = await this.usersService.countUsers({ plan: "paid" });
    return {
      plans: {
        free: { users: freeUsers, max_accounts: 2, price: 0 },
        paid: { users: paidUsers, max_accounts: 10, price: 100 },
      },
      discounts: {
        description: "Based on activity (10+ meetings/week)",
        tiers: [
          { duration: "6 months", discount: "50%" },
          { duration: "1 year", discount: "60%" },
        ],
        eligibility_reset: "weekly",
      },
    };
  }

  async getAllReviews() {
    return this.testimonialsService.getAllForAdmin();
  }
}