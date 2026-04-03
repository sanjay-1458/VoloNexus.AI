import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AccountsService } from "./accounts.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Accounts")
@Controller("accounts")
export class AccountsController {
  constructor(
    private accountsService: AccountsService,
    private configService: ConfigService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@CurrentUser("_id") userId: string) {
    return this.accountsService.findByUser(userId?.toString());
  }

  @Post(":id/sync")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Manually trigger 2-month calendar sync" })
  async sync(@CurrentUser("_id") userId: string, @Param("id") id: string) {
    return this.accountsService.syncGoogleCalendar(userId?.toString(), id);
  }

  @Get("google/auth-url")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Initiate Google OAuth Flow" })
  async getOAuthUrl(@CurrentUser("_id") userId: string) {
    const url = this.accountsService.generateOAuthUrl(userId?.toString());
    return { url };
  }

  @Get("google/callback")
  @ApiOperation({ summary: "Google OAuth Callback Handler" })
  async googleCallback(
    @Query("code") code: string,
    @Query("state") userId: string,
    @Query("error") error: string,
  ) {
    if (error)
      return `<html><body><script>window.close();</script>Auth Cancelled</body></html>`;
    if (!code) throw new BadRequestException("Missing code");

    await this.accountsService.handleGoogleCallback(userId, code);

    return `
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0B0F1A; color: white;">
          <div style="text-align: center;">
            <h2 style="color: #3B82F6;">Sync Successful!</h2>
            <p>Your Google account is now linked. This window will close.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage('google-account-connected', '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@CurrentUser("_id") userId: string, @Param("id") id: string) {
    return this.accountsService.removeAccount(userId?.toString(), id);
  }

  @Patch(":id/primary")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setPrimary(
    @CurrentUser("_id") userId: string,
    @Param("id") id: string,
  ) {
    return this.accountsService.setPrimary(userId?.toString(), id);
  }
}
