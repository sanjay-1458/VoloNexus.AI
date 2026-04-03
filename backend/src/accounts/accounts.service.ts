import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { Account, AccountDocument } from "./schemas/account.schema";
import { google } from "googleapis";
import { EventsService } from "../events/events.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    private configService: ConfigService,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<AccountDocument[]> {
    return this.accountModel.find().exec();
  }

  async findAllConnected(): Promise<AccountDocument[]> {
    return this.accountModel.find({ is_connected: true }).exec();
  }

  async getValidOAuthClient(accountId: string) {
    const account = await this.accountModel.findById(accountId);
    if (!account || !account.oauth_tokens) {
      throw new Error("Tokens missing or account not found");
    }

    const oauth2Client = new google.auth.OAuth2(
      this.configService.get("GOOGLE_CLIENT_ID"),
      this.configService.get("GOOGLE_CLIENT_SECRET"),
      this.configService.get("GOOGLE_CALLBACK_URL"),
    );

    oauth2Client.setCredentials(account.oauth_tokens);

    oauth2Client.on("tokens", async (tokens) => {
      const updateData: any = {
        "oauth_tokens.access_token": tokens.access_token,
        "oauth_tokens.expiry_date": tokens.expiry_date,
      };

      if (tokens.refresh_token) {
        updateData["oauth_tokens.refresh_token"] = tokens.refresh_token;
      }

      await this.accountModel.updateOne(
        { _id: new Types.ObjectId(accountId) },
        { $set: updateData },
      );

      this.logger.log(
        `🔄 Tokens auto-refreshed and secured for account: ${account.email}`,
      );
    });

    return oauth2Client;
  }

  async sendEmailReply(
    accountId: string,
    to: string,
    subject: string,
    threadId: string,
    htmlContent: string,
  ) {
    const oauth2Client = await this.getValidOAuthClient(accountId);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const str = [
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `In-Reply-To: ${threadId}`,
      `References: ${threadId}`,
      "",
      htmlContent,
    ].join("\n");

    const encodedMail = Buffer.from(str)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMail, threadId: threadId },
    });
  }

  async syncGoogleCalendar(userId: string, accountId: string) {
    const account = await this.accountModel.findOne({
      _id: new Types.ObjectId(accountId),
      user_id: new Types.ObjectId(userId),
    });
    if (!account) throw new NotFoundException("Account not found");

    const oauth2Client = await this.getValidOAuthClient(accountId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const timeMin = new Date().toISOString();
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 2);

    try {
      await this.accountModel.updateOne(
        { _id: account._id },
        { sync_status: "syncing" },
      );

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin,
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const googleEvents = (response.data.items || []).filter(
        (e) => e !== null && e.id,
      );

      const googleIds: string[] = [];

      for (const gEvent of googleEvents) {
        if (!gEvent.id) continue;

        await this.eventsService.upsertFromGoogle(
          userId,
          account.email,
          gEvent,
        );

        googleIds.push(gEvent.id);
      }

      await this.eventsService.cleanupCalendarEvents(
        userId,
        account.email,
        googleIds,
      );

      await this.accountModel.updateOne(
        { _id: account._id },
        { sync_status: "completed", last_synced: new Date() },
      );

      return { processed: googleEvents.length };
    } catch (err: any) {
      await this.accountModel.updateOne(
        { _id: account._id },
        { sync_status: "failed", error_message: err.message },
      );
      throw new BadRequestException("Sync failed: " + err.message);
    }
  }

  async getAdminStats() {
    const [total, connected] = await Promise.all([
      this.accountModel.countDocuments().exec(),
      this.accountModel.countDocuments({ is_connected: true }).exec(),
    ]);
    return { total, connected, disconnected: total - connected };
  }

  async findById(accountId: string): Promise<AccountDocument | null> {
    return this.accountModel.findById(accountId).exec();
  }

  async findByUser(userId: string): Promise<any[]> {
    const accounts = await this.accountModel
      .find({ user_id: new Types.ObjectId(userId) })
      .sort({ is_primary: -1, createdAt: 1 })
      .exec();
    return accounts.map((a) => this.serialize(a));
  }

  generateOAuthUrl(userId: string): string {
    const redirectUri = this.configService.get<string>("GOOGLE_CALLBACK_URL");
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get("GOOGLE_CLIENT_ID"),
      this.configService.get("GOOGLE_CLIENT_SECRET"),
      redirectUri,
    );
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: userId,
    });
  }

  async handleGoogleCallback(userId: string, code: string) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get("GOOGLE_CLIENT_ID"),
      this.configService.get("GOOGLE_CLIENT_SECRET"),
      this.configService.get("GOOGLE_CALLBACK_URL"),
    );
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email?.toLowerCase();
      if (!email) throw new BadRequestException("No email");

      const user = await this.usersService.findById(userId);
      const maxAccounts = user?.plan === "paid" ? 7 : 2;

      const existingAccount = await this.accountModel.findOne({
        user_id: new Types.ObjectId(userId),
        email,
      });
      const existingCount = await this.accountModel.countDocuments({
        user_id: new Types.ObjectId(userId),
      });

      if (!existingAccount && existingCount >= maxAccounts) {
        throw new BadRequestException(
          `Account limit reached. Your ${user?.plan} plan allows up to ${maxAccounts} connected accounts.`,
        );
      }

      const account = await this.accountModel.findOneAndUpdate(
        { user_id: new Types.ObjectId(userId), email },
        {
          $set: {
            oauth_tokens: tokens,
            is_connected: true,
            display_name: userInfo.data.name,
            profile_picture: userInfo.data.picture,
            last_synced: new Date(),
            is_primary: existingCount === 0,
          },
        },
        { upsert: true, new: true },
      );
      await this.syncGoogleCalendar(userId, account._id.toString());
      return this.serialize(account);
    } catch (err: any) {
      throw new BadRequestException("Auth failed: " + err.message);
    }
  }

  async setPrimary(userId: string, accountId: string) {
    await this.accountModel.updateMany(
      { user_id: new Types.ObjectId(userId) },
      { $set: { is_primary: false } },
    );
    const account = await this.accountModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(accountId),
        user_id: new Types.ObjectId(userId),
      },
      { $set: { is_primary: true } },
      { new: true },
    );
    if (!account) throw new NotFoundException("Account not found");
    return this.serialize(account);
  }

  async removeAccount(userId: string, accountId: string) {
    const account = await this.accountModel.findOne({
      _id: new Types.ObjectId(accountId),
      user_id: new Types.ObjectId(userId),
    });
    if (!account) throw new NotFoundException("Not found");
    await this.accountModel.deleteOne({ _id: account._id });
    return { message: "Removed" };
  }

  private serialize(account: AccountDocument) {
    const obj = account.toObject();
    return {
      id: obj._id.toString(),
      user_id: obj.user_id.toString(),
      email: obj.email,
      is_primary: obj.is_primary,
      type: obj.type,
      is_connected: obj.is_connected,
      display_name: obj.display_name,
      profile_picture: obj.profile_picture,
      last_synced: obj.last_synced,
      sync_status: obj.sync_status || "idle",
    };
  }
}
