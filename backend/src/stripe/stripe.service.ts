import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { UsersService } from "../users/users.service";

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    this.stripe = new Stripe(secretKey || "sk_test_mock", {
      apiVersion: "2023-10-16" as any,
    });
  }

  async createCheckoutSession(userId: string, email: string) {
    try {
      const frontendUrl =
        this.configService.get<string>("FRONTEND_URL") ||
        "http://localhost:3000";

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: email,
        client_reference_id: userId,
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "MeetFlow Knight Tier",
                description:
                  "Unlimited AI scheduling, 7 accounts, and Pinecone memory.",
              },
              unit_amount: 10000,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/dashboard`,
      });

      return { url: session.url };
    } catch (error: any) {
      this.logger.error(`Failed to create Stripe session: ${error.message}`);
      throw new BadRequestException("Could not initiate checkout");
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>(
      "STRIPE_WEBHOOK_SECRET",
    );
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret!,
      );
    } catch (err: any) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email;

        if (email) {
          await this.usersService.upgradeUserPlanByEmail(email, "paid");
          this.logger.log(
            `Successfully upgraded user ${email} to Knight Tier.`,
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        this.logger.log(
          `Subscription deleted for customer ${subscription.customer}`,
        );
        break;
      }
      default:
        this.logger.log(`Unhandled Stripe event type ${event.type}`);
    }

    return { received: true };
  }
}
