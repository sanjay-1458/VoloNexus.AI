import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Settings")
@Controller("settings")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get("profile")
  @ApiOperation({ summary: "Get user profile and settings" })
  async getProfile(@CurrentUser("_id") userId: string) {
    return this.settingsService.getProfile(userId?.toString());
  }

  @Patch("profile")
  @ApiOperation({ summary: "Update profile information" })
  async updateProfile(
    @CurrentUser("_id") userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateProfile(userId?.toString(), dto);
  }

  @Patch("preferences")
  @ApiOperation({ summary: "Update scheduling preferences" })
  async updatePreferences(
    @CurrentUser("_id") userId: string,
    @Body() preferences: any,
  ) {
    return this.settingsService.updatePreferences(
      userId?.toString(),
      preferences,
    );
  }

  @Patch("automation-rules")
  @ApiOperation({ summary: "Update automation rules" })
  async updateRules(
    @CurrentUser("_id") userId: string,
    @Body() body: { rules: any[] },
  ) {
    return this.settingsService.updateAutomationRules(
      userId?.toString(),
      body.rules,
    );
  }
}
