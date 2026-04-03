import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { UsersService } from "../../users/users.service";
import { EventsService } from "../../events/events.service";
import { AiService } from "../../ai/ai.service";
import { NotificationsService } from "../../notifications/notifications.service";

@Injectable()
export class AnalyticsAgentService {
  private readonly logger = new Logger(AnalyticsAgentService.name);

  constructor(
    private usersService: UsersService,
    private eventsService: EventsService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
    private notificationsService: NotificationsService,
  ) {
    this.logger.log("Analytics Agent fully operational");
  }

  async generateWeeklyReport(): Promise<any> {
    this.logger.log("Generating weekly report");

    const freeUsers = await this.usersService.countUsers({ plan: "free" });
    const paidUsers = await this.usersService.countUsers({ plan: "paid" });

    const revenue = paidUsers * 100;

    const prompt = `You are a data analyst for VoloNexus.AI. Generate a concise, 2-paragraph executive summary based on this weekly data: 
    - Free Users: ${freeUsers}
    - Paid Users: ${paidUsers}
    - Estimated Monthly Recurring Revenue: $${revenue}
    Highlight the revenue and user growth context.`;

    let summary = "Summary generation failed.";
    try {
      const aiResponse = await this.aiService.chat(null, prompt);
      summary = aiResponse.response;
    } catch (e) {
      this.logger.error("Failed to generate AI summary", e);
    }

    const reportHtml = `
      <h1>VoloNexus.AI Weekly Admin Report</h1>
      <p>${summary}</p>
      <ul>
        <li>Total Free Users: ${freeUsers}</li>
        <li>Total Paid Users: ${paidUsers}</li>
        <li>MRR: $${revenue}</li>
      </ul>
    `;

    await this.notificationsService.sendEmail(
      "support.volonexus.ai@gmail.com",
      "Weekly Analytics Report - VoloNexus.AI",
      reportHtml,
    );

    return {
      period: "last_week",
      metrics: { freeUsers, paidUsers, revenue },
      summary: summary,
      is_stub: false,
    };
  }

  async calculateDiscountEligibility(): Promise<any> {
    this.logger.log("Calculating discount eligibility");

    const eligibleUsers = await this.usersService.findAll({
      weekly_meeting_count: { $gte: 10 },
    });
    let discountsApplied = 0;

    for (const user of eligibleUsers) {
      if (user.plan !== "paid") {
        this.logger.log(
          `User ${user.email} is eligible for 50% discount (6 months)`,
        );

        await this.notificationsService.sendEmail(
          user.email,
          "You unlocked a VoloNexus.AI Discount!",
          `Congratulations ${user.name}! Because you scheduled 10+ meetings this week, you've unlocked a 50% discount for 6 months!`,
        );
        discountsApplied++;
      }
    }

    await this.usersService.resetWeeklyMeetingCounts();

    return {
      eligible_users: eligibleUsers.length,
      discounts_applied: discountsApplied,
    };
  }

  async summarizeFeedback(reviews: any[]): Promise<any> {
    this.logger.log("Summarizing feedback using Claude");

    const lowRatings = reviews.filter((r) => r.rating < 4);

    if (lowRatings.length === 0) {
      return { themes: ["No recent low-rated reviews!"], suggestions: [] };
    }

    const prompt = `Analyze these low-rated user reviews for VoloNexus.AI. 
    Reviews: ${JSON.stringify(lowRatings.map((r) => r.review))}
    
    Output strictly in JSON format:
    {
      "themes": ["common complaint 1", "common complaint 2"],
      "suggestions": ["actionable fix 1", "actionable fix 2"]
    }`;

    try {
      const aiResponse = await this.aiService.chat(null, prompt);
      const parsed = JSON.parse(
        aiResponse.response.replace(/```json|```/g, "").trim(),
      );
      return parsed;
    } catch (error) {
      this.logger.error("Failed to parse AI feedback summary", error);
      return { themes: ["Error analyzing themes"], suggestions: [] };
    }
  }
}
