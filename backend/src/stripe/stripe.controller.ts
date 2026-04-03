import {
  Controller,
  Post,
  Headers,
  Req,
  Res,
  RawBodyRequest,
  HttpStatus,
  Logger,
  UseGuards,
} from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Request, Response } from "express";

@Controller("stripe")
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripeService: StripeService) {}

  @Post("create-checkout-session")
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(@CurrentUser() user: any) {
    const userId = user._id?.toString() || user.id;
    return this.stripeService.createCheckoutSession(userId, user.email);
  }

  @Post("webhook")
  async handleWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    if (!signature) {
      this.logger.error("Webhook Error: Missing stripe-signature header");
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: "Missing signature" });
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      this.logger.error(
        "Webhook Error: Raw body is empty or null. Check main.ts config.",
      );
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: "Raw body missing" });
    }

    try {
      await this.stripeService.handleWebhook(signature, rawBody);
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error: any) {
      this.logger.error(`Webhook Verification Failed: ${error.message}`);
      return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
    }
  }
}
