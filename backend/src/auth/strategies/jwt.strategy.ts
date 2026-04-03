import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => {
          let token = req?.cookies?.access_token || null;

          if (!token && req?.headers?.cookie) {
            const cookies = (req.headers.cookie as string)
              .split(";")
              .map((c: string) => c.trim());
            const accessCookie = cookies.find((c: string) =>
              c.toLowerCase().startsWith("access_token="),
            );
            if (accessCookie) token = accessCookie.split("=")[1];
          }
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("jwt.secret")!,
    });
  }

  async validate(payload: any) {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type for this strategy");
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Session invalid or user not found");
    }

    const userObj = user.toObject();
    delete userObj.password_hash;
    return userObj;
  }
}
