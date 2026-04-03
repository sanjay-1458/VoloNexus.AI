import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Testimonial, TestimonialDocument } from "./schemas/testimonial.schema";
import { UsersService } from "../users/users.service";
import { AnalyticsAgentService } from "../agents/analytics-agent/analytics-agent.service";

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(
    @InjectModel(Testimonial.name)
    private testimonialModel: Model<TestimonialDocument>,
    private usersService: UsersService,
    private analyticsAgent: AnalyticsAgentService,
  ) {}

  async getPublic(limit: number = 20) {
    const testimonials = await this.testimonialModel
      .find({ is_public: true, rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return testimonials.map((t) => this.serialize(t));
  }

  async create(userId: string, rating: number, review: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException("User not found");

    const existing = await this.testimonialModel.findOne({
      user_id: new Types.ObjectId(userId),
    });
    if (existing) {
      throw new BadRequestException("You have already submitted a review");
    }

    if (user.total_meetings_scheduled < 10) {
      throw new BadRequestException(
        "You need at least 10 scheduled meetings to leave a review",
      );
    }

    const isPublic = rating >= 4;

    const testimonial = new this.testimonialModel({
      user_id: new Types.ObjectId(userId),
      user_name: user.name,
      user_avatar: user.profile_picture,
      rating,
      review,
      company: user.company,
      is_public: isPublic,
    });

    if (rating < 4) {
      try {
        const analysis = await this.analyticsAgent.summarizeFeedback([
          { rating, review },
        ]);
        if (analysis) {
          testimonial.ai_summary =
            analysis.themes?.join(", ") || "General dissatisfaction";
          testimonial.ai_suggested_improvements =
            analysis.suggestions?.join(", ") || "Follow up required";
        }
      } catch (e) {
        this.logger.error("Failed to generate AI summary for review", e);
      }
    }

    await testimonial.save();

    await this.usersService.updateById(userId, { has_reviewed: true } as any);

    return this.serialize(testimonial);
  }

  async getAllForAdmin() {
    const testimonials = await this.testimonialModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
    return testimonials.map((t) => this.serialize(t));
  }

  private serialize(t: TestimonialDocument) {
    const obj = t.toObject();
    return {
      id: obj._id.toString(),
      user_name: obj.user_name,
      user_avatar: obj.user_avatar,
      rating: obj.rating,
      review: obj.review,
      company: obj.company,
      created_at: obj.createdAt,
      ai_summary: obj.ai_summary,
      ai_suggested_improvements: obj.ai_suggested_improvements,
    };
  }
}
