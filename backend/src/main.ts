import * as dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix("api");

  app.use((req: any, res: any, next: any) => {
    if (req.originalUrl.includes("/api/stripe/webhook")) {
      return next();
    }
    json({ limit: "50mb" })(req, res, next);
  });

  app.use((req: any, res: any, next: any) => {
    if (req.originalUrl.includes("/api/stripe/webhook")) {
      return next();
    }
    urlencoded({ extended: true, limit: "50mb" })(req, res, next);
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("MeetFlow API")
    .setDescription("AI-driven Meeting & Event Orchestration Platform")
    .setVersion("1.0")
    .addBearerAuth()
    .addCookieAuth("access_token")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 8001;
  const server = await app.listen(port);

  server.keepAliveTimeout = 120000;
  server.headersTimeout = 125000;

  console.log(`MeetFlow API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
