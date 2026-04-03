import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { EventEmitter } from "events";
import { SchedulerAgentService } from "../agents/scheduler-agent/scheduler-agent.service";
import { EmailAgentService } from "../agents/email-agent/email-agent.service";
import { NotificationAgentService } from "../agents/notification-agent/notification-agent.service";
import { MonitoringAgentService } from "../agents/monitoring-agent/monitoring-agent.service";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("LocalSwarmBroker");
  private broker: EventEmitter;

  private readonly topics = [
    "email.received",
    "event.created",
    "event.conflict",
    "notification.send",
    "agent.decision",
    "admin.analytics",
    "bug.reported",
  ];

  constructor(
    @Inject(forwardRef(() => SchedulerAgentService))
    private schedulerAgentService: SchedulerAgentService,

    @Inject(forwardRef(() => EmailAgentService))
    private emailAgentService: EmailAgentService,

    @Inject(forwardRef(() => NotificationAgentService))
    private notificationAgentService: NotificationAgentService,

    @Inject(forwardRef(() => MonitoringAgentService))
    private monitoringAgentService: MonitoringAgentService,
  ) {
    this.broker = new EventEmitter();
  }

  async onModuleInit() {
    this.logger.log("🚀 Local Event Broker Connected");
    this.subscribeToTopics();
  }

  async onModuleDestroy() {
    this.broker.removeAllListeners();
  }

  async publish(topic: string, message: any): Promise<void> {
    try {
      setTimeout(() => {
        this.broker.emit(topic, message);
      }, 50);
    } catch (error: any) {
      this.logger.error(`Error publishing to ${topic}`, error.stack);
    }
  }

  private subscribeToTopics(): void {
    for (const topic of this.topics) {
      this.broker.on(topic, async (message) => {
        try {
          await this.handleMessage(topic, message);
        } catch (error: any) {
          this.logger.error(
            `Failed to process message on topic ${topic}`,
            error.stack,
          );
        }
      });
      this.logger.log(`📥 Subscribed to local topic: ${topic}`);
    }
  }

  private async handleMessage(topic: string, message: any): Promise<void> {
    this.logger.debug(`Processing topic [${topic}]`);

    switch (topic) {
      case "email.received":
        if (message.accountId && message.messageId) {
          await this.emailAgentService.processIncomingEmail(message);
        } else {
          this.logger.warn(
            "Received email.received event with missing accountId or messageId",
          );
        }
        break;

      case "event.created":
        await this.schedulerAgentService.processNewEvent(message);
        break;

      case "event.conflict":
        await this.notificationAgentService.processNotification({
          userId: message.userId,
          type: "CONFLICT_ALERT",
          payload: message,
        });
        break;

      case "notification.send":
        await this.notificationAgentService.processNotification(message);
        break;

      case "agent.decision":
        await this.monitoringAgentService.logAgentDecision(
          message.agent,
          message.decision,
          message.reasoning,
          message.context,
        );
        break;

      case "bug.reported":
        this.logger.log("Handler: Forwarding bug report to AI filter.");
        break;

      default:
        this.logger.warn(`No specific handler implemented for topic: ${topic}`);
    }
  }
}
