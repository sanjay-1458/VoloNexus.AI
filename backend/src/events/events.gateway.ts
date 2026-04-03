import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, OnModuleInit } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: "events",
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    await this.redisService.subscribe("event_updates", (data) => {
      this.logger.log(`Pushing real-time update to user ${data.userId}`);
      this.server.to(`user_${data.userId}`).emit("event_updated", data);
    });

    await this.redisService.subscribe("conflict_alerts", (data) => {
      this.logger.warn(`Pushing conflict alert to user ${data.userId}`);
      this.server.to(`user_${data.userId}`).emit("conflict_detected", data);
    });
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.join(`user_${userId}`);
      this.logger.log(
        `Client connected: ${client.id} joined room user_${userId}`,
      );
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
