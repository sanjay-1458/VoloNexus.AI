import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { TestimonialsService } from "./testimonials.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateTestimonialDto } from "./dto/create-testimonial.dto";

@ApiTags("Testimonials")
@Controller("testimonials")
export class TestimonialsController {
  constructor(private testimonialsService: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: "Get public testimonials (4-5 stars)" })
  async getPublic(@Query("limit") limit?: number) {
    return this.testimonialsService.getPublic(limit || 20);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit a testimonial" })
  async create(
    @CurrentUser("_id") userId: string,
    @Body() body: CreateTestimonialDto,
  ) {
    return this.testimonialsService.create(
      userId?.toString(),
      body.rating,
      body.review,
    );
  }
}
