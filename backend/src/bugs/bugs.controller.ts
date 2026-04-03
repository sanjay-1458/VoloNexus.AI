import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { BugsService } from "./bugs.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { Request } from "express";
import { CreateBugDto } from "./dto/create-bug.dto";
import * as jwt from "jsonwebtoken";

@ApiTags("Bug Reports")
@Controller("bugs")
export class BugsController {
  constructor(private bugsService: BugsService) {}

  @Post()
  @ApiOperation({ summary: "Submit a bug report" })
  async create(@Body() body: CreateBugDto, @Req() req: Request) {
    let userId = null;

    try {
      let token =
        req.cookies?.["access_token"] || req.cookies?.["refresh_token"];
      if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (token && token.includes(".")) {
        const payloadBase64 = token.split(".")[1];
        const decodedJson = Buffer.from(payloadBase64, "base64").toString(
          "utf-8",
        );
        const decoded = JSON.parse(decodedJson);

        userId = decoded.sub || null;
      }
    } catch (e) {
      console.error("[BugsController] Failed to decode user token:", e);
    }

    const browserInfo = req.headers["user-agent"] || "Unknown";

    return this.bugsService.create(userId, {
      ...body,
      browser_info: browserInfo,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all bug reports (admin)" })
  async findAll(
    @Query("status") status?: string,
    @Query("severity") severity?: string,
  ) {
    return this.bugsService.findAll({ status, severity });
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update bug status (admin)" })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string; admin_notes?: string },
  ) {
    return this.bugsService.updateStatus(id, body.status, body.admin_notes);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get bug report stats (admin)" })
  async stats() {
    return this.bugsService.getStats();
  }
}
