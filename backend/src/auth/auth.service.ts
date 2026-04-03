import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { UsersService } from "../users/users.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RegisterDto, VerifyEmailDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    @InjectModel("LoginAttempt") private loginAttemptModel: Model<any>,
    @InjectModel("PasswordResetToken") private resetTokenModel: Model<any>,
    @InjectModel("EmailVerification") private verificationModel: Model<any>,
  ) {
    this.seedAdmin();
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  private async verifyPassword(
    plain: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  createAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: "access" },
      { expiresIn: this.configService.get("jwt.expiration") || "1d" },
    );
  }

  createRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: "refresh" },
      { expiresIn: this.configService.get("jwt.refreshExpiration") || "1d" },
    );
  }

  async googleLogin(googleUser: any) {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      const randomPassword = randomBytes(16).toString("hex");
      const passwordHash = await this.hashPassword(randomPassword);

      user = await this.usersService.create({
        name: googleUser.display_name,
        email: googleUser.email,
        password_hash: passwordHash,
        role: "user",
        plan: "free",
        profile_picture: googleUser.profile_picture,
      });
      this.logger.log(`New user registered via Google OAuth: ${user.email}`);
    }

    const updateData: any = {
      last_login: new Date(),
      google_access_token: googleUser.googleAccessToken,
    };

    if (googleUser.googleRefreshToken) {
      updateData.google_refresh_token = googleUser.googleRefreshToken;
    }

    await this.usersService.updateById(user._id.toString(), updateData);

    const userId = user._id.toString();
    const accessToken = this.createAccessToken(userId, user.email);
    const refreshToken = this.createRefreshToken(userId);

    return {
      user: {
        id: userId,
        name: user.name || googleUser.display_name,
        email: user.email,
        role: user.role || "user",
        plan: user.plan || "free",
        profile_picture: user.profile_picture || googleUser.profile_picture,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      console.error(`Registration blocked: ${dto.email} already exists`);
      throw new ConflictException("Email already registered");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000);

    await this.verificationModel.findOneAndUpdate(
      { email: dto.email.toLowerCase() },
      {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: dto.password,
        otp,
        expires_at: expiresAt,
      },
      { upsert: true, new: true },
    );

    const emailBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3B82F6;">Verify your VoloNexus.AI Account</h2>
        <p>Hello ${dto.name},</p>
        <p>Thank you for signing up. Please use the following code to verify your email address:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    await this.notificationsService.sendEmail(
      dto.email,
      "Your VoloNexus.AI Verification Code",
      emailBody,
    );

    return { message: "Verification code sent to email", email: dto.email };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const record = await this.verificationModel.findOne({
      email: dto.email.toLowerCase(),
      otp: dto.otp,
      expires_at: { $gt: new Date() },
    });

    if (!record) {
      console.error(
        `Verification failed for ${dto.email}: Invalid/Expired OTP`,
      );
      throw new BadRequestException("Invalid or expired verification code");
    }

    const passwordHash = await this.hashPassword(record.password);
    const user = await this.usersService.create({
      name: record.name,
      email: record.email,
      password_hash: passwordHash,
      role: "user",
      plan: "free",
    });

    await this.verificationModel.deleteOne({ _id: record._id });

    const userId = user._id.toString();
    const accessToken = this.createAccessToken(userId, user.email);
    const refreshToken = this.createRefreshToken(userId);

    return {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto, ip: string) {
    const identifier = `${ip}:${dto.email.toLowerCase()}`;

    await this.checkBruteForce(identifier);

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      console.error(`Login failed: User not found for email ${dto.email}`);
      await this.recordFailedAttempt(identifier);
      throw new UnauthorizedException("Invalid email or password");
    }

    const isValid = await this.verifyPassword(dto.password, user.password_hash);
    if (!isValid) {
      console.error(`Login failed: Incorrect password for ${dto.email}`);
      await this.recordFailedAttempt(identifier);
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.loginAttemptModel.deleteOne({ identifier });

    await this.usersService.updateById(user._id.toString(), {
      last_login: new Date(),
    } as any);

    const userId = user._id.toString();
    const accessToken = this.createAccessToken(userId, user.email);
    const refreshToken = this.createRefreshToken(userId);

    return {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        profile_picture: user.profile_picture,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid token type");
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const accessToken = this.createAccessToken(
        user._id.toString(),
        user.email,
      );

      return { accessToken };
    } catch (error) {
      console.error("Refresh token validation error:", error);
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      console.error(
        `Forgot password requested for non-existent email: ${email}`,
      );
      return { message: "If the email exists, a reset link has been sent" };
    }

    const token = randomBytes(32).toString("hex");
    await this.resetTokenModel.create({
      user_id: user._id.toString(),
      token,
      expires_at: new Date(Date.now() + 3600000),
    });

    const frontendUrl =
      this.configService.get("FRONTEND_URL") || "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const emailBody = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>You requested to reset your VoloNexus.AI password. Click the link below to set a new password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await this.notificationsService.sendEmail(
      email,
      "Reset your VoloNexus.AI Password",
      emailBody,
    );
    this.logger.log(`Password reset link dispatched for ${email}`);

    return { message: "If the email exists, a reset link has been sent" };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.resetTokenModel.findOne({
      token,
      used: false,
      expires_at: { $gt: new Date() },
    });

    if (!resetToken) {
      console.error(`Reset password failed: Token invalid or expired`);
      throw new BadRequestException("Invalid or expired reset token");
    }

    const user = await this.usersService.findById(resetToken.user_id);
    if (!user) {
      console.error(
        `Reset password failed: User ${resetToken.user_id} not found`,
      );
      throw new BadRequestException("User not found");
    }

    const isSamePassword = await this.verifyPassword(
      newPassword,
      user.password_hash,
    );
    if (isSamePassword) {
      console.error(
        `Reset password failed: New password matches old password for ${user.email}`,
      );
      throw new BadRequestException(
        "New password cannot be the same as the old password",
      );
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.usersService.updateById(resetToken.user_id, {
      password_hash: passwordHash,
    } as any);

    resetToken.used = true;
    await resetToken.save();

    console.log(
      `Password successfully reset for user ID: ${resetToken.user_id}`,
    );
    return { message: "Password reset successfully" };
  }

  private async checkBruteForce(identifier: string) {
    const attempt = await this.loginAttemptModel.findOne({ identifier });
    if (attempt && attempt.locked_until && attempt.locked_until > new Date()) {
      const minutesLeft = Math.ceil(
        (attempt.locked_until.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked. Try again in ${minutesLeft} minutes`,
      );
    }
  }

  private async recordFailedAttempt(identifier: string) {
    const attempt = await this.loginAttemptModel.findOneAndUpdate(
      { identifier },
      {
        $inc: { attempts: 1 },
        $set: { updated_at: new Date() },
      },
      { upsert: true, new: true },
    );

    if (attempt.attempts >= this.MAX_ATTEMPTS) {
      await this.loginAttemptModel.updateOne(
        { identifier },
        {
          $set: {
            locked_until: new Date(Date.now() + this.LOCKOUT_MINUTES * 60000),
          },
        },
      );
    }
  }

  private async seedAdmin() {
    try {
      const adminEmail = this.configService.get<string>("admin.email");
      const adminPassword = this.configService.get<string>("admin.password");

      if (!adminEmail || !adminPassword) return;

      const existing = await this.usersService.findByEmail(adminEmail);

      if (!existing) {
        const hash = await this.hashPassword(adminPassword);
        await this.usersService.create({
          name: "Admin",
          email: adminEmail,
          password_hash: hash,
          role: "admin",
          plan: "paid",
        });
        this.logger.log(`Admin seeded: ${adminEmail}`);
      } else {
        const matches = await this.verifyPassword(
          adminPassword,
          existing.password_hash,
        );
        if (!matches) {
          const hash = await this.hashPassword(adminPassword);
          await this.usersService.updateById(existing._id.toString(), {
            password_hash: hash,
          } as any);
          this.logger.log("Admin password updated from environment");
        }
      }
    } catch (error: any) {
      this.logger.error("Admin seeding error:", error.message);
    }
  }
}
