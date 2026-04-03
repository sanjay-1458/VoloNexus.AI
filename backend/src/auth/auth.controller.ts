import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { RegisterDto, VerifyEmailDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto, ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Initiate Google OAuth login and consent screen" })
  async googleAuth(@Req() req: Request) {}

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Handle Google OAuth callback and tokens" })
  async googleAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    try {
      const result = await this.authService.googleLogin(req.user);

      this.setAuthCookies(res as any, result.accessToken, result.refreshToken);

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/assistant`);
    } catch (error) {
      this.logger.error("Google OAuth Callback Failed", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email with 6-digit OTP" })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result.user;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const result = await this.authService.login(dto, ip);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result.user;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout and clear cookies" })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
    return { message: "Logged out successfully" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  async me(@CurrentUser() user: any) {
    return {
      id: user._id?.toString() || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      profile_picture: user.profile_picture,
      preferences: user.preferences,
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    let refreshToken = req.cookies?.refresh_token;

    if (!refreshToken && req.headers?.cookie) {
      const cookies = req.headers.cookie.split(";").map((c) => c.trim());
      const refreshCookie = cookies.find((c) =>
        c.toLowerCase().startsWith("refresh_token="),
      );
      if (refreshCookie) refreshToken = refreshCookie.split("=")[1];
    }

    if (!refreshToken) {
      this.logger.error(
        "Refresh attempt failed: No refresh token found in cookies or headers.",
      );
      throw new UnauthorizedException("No refresh token");
    }

    const result = await this.authService.refreshToken(refreshToken);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 86400000,
      path: "/",
    });
    return { message: "Token refreshed" };
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset email" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 86400000,
      path: "/",
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 86400000,
      path: "/",
    });
  }
}
