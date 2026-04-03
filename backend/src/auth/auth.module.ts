import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { Schema } from "mongoose";
import { EmailVerificationSchema } from "./schemas/email-verification.schema";

const LoginAttemptSchema = new Schema({
  identifier: { type: String, required: true, index: true },
  attempts: { type: Number, default: 0 },
  locked_until: { type: Date, default: null },
  updated_at: { type: Date, default: Date.now },
});

const PasswordResetTokenSchema = new Schema({
  user_id: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});
PasswordResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.secret"),
        signOptions: {
          expiresIn: (configService.get<string>("jwt.expiration") ||
            "1d") as any,
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: "LoginAttempt", schema: LoginAttemptSchema },
      { name: "PasswordResetToken", schema: PasswordResetTokenSchema },
      { name: "EmailVerification", schema: EmailVerificationSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
