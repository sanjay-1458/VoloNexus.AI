import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TestimonialsController } from "./testimonials.controller";
import { TestimonialsService } from "./testimonials.service";
import { Testimonial, TestimonialSchema } from "./schemas/testimonial.schema";
import { UsersModule } from "../users/users.module";
import { AnalyticsAgentModule } from "../agents/analytics-agent/analytics-agent.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Testimonial.name, schema: TestimonialSchema },
    ]),
    UsersModule,
    AnalyticsAgentModule,
  ],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
