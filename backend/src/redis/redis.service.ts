import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private subscriber!: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>("redis.url") || "redis://localhost:6379";

    try {
      this.client = new Redis(redisUrl);
      this.subscriber = new Redis(redisUrl);

      this.client.on("connect", () =>
        this.logger.log("🚀 Redis Main Client Connected"),
      );
      this.subscriber.on("connect", () =>
        this.logger.log("📡 Redis Subscriber Connected"),
      );

      this.client.on("error", (err) =>
        this.logger.error("Redis Client Error", err),
      );
    } catch (error) {
      this.logger.error("Failed to initialize Redis connection", error);
    }
  }

  async onModuleInit() {}

  async onModuleDestroy() {
    await this.client?.quit();
    await this.subscriber?.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, "EX", ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async saveChatMessage(
    userId: string,
    conversationId: string,
    message: any,
  ): Promise<void> {
    const key = `chat:${userId}:${conversationId}`;
    const messageString = JSON.stringify({ ...message, timestamp: new Date() });

    await this.client.rpush(key, messageString);
    await this.client.expire(key, 259200);
  }

  async getChatHistory(userId: string, conversationId: string): Promise<any[]> {
    const key = `chat:${userId}:${conversationId}`;
    const messages = await this.client.lrange(key, 0, -1);

    return messages.map((m) => JSON.parse(m));
  }

  async setSession(
    userId: string,
    data: any,
    ttl: number = 3600,
  ): Promise<void> {
    await this.client.set(`session:${userId}`, JSON.stringify(data), "EX", ttl);
  }

  async getSession(userId: string): Promise<any | null> {
    const data = await this.client.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.client.publish(channel, JSON.stringify(message));
  }

  async subscribe(
    channel: string,
    handler: (message: any) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on("message", (ch, msg) => {
      if (ch === channel) {
        try {
          handler(JSON.parse(msg));
        } catch (e) {
          this.logger.error(`Error parsing Pub/Sub message from ${channel}`, e);
        }
      }
    });
  }

  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    return true;
  }
}
