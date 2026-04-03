import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      this.logger.warn(
        `[${request.method} ${request.url}] Error occurred after response was sent. Skipping duplicate response.`,
      );
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: "Internal server error" };

    const message =
      typeof errorResponse === "object" &&
      errorResponse !== null &&
      "message" in errorResponse
        ? (errorResponse as any).message
        : errorResponse;

    if (exception instanceof Error) {
      this.logger.error(
        `[${request.method} ${request.url}] Status: ${status} - Message: ${JSON.stringify(message)}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `[${request.method} ${request.url}] Status: ${status} - Message: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
