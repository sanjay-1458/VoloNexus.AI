import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password_hash!: string;

  @Prop({ enum: ["user", "admin"], default: "user" })
  role!: string;

  @Prop({ enum: ["free", "paid"], default: "free" })
  plan!: string;

  @Prop({ default: null })
  profile_picture!: string;

  @Prop({ default: null })
  company!: string;

  @Prop({ default: null })
  phone!: string;

  @Prop({ default: null })
  google_access_token?: string;

  @Prop({ default: null })
  google_refresh_token?: string;

  @Prop({ type: Object, default: {} })
  preferences!: {
    theme?: "dark" | "light";
    timezone?: string;
    work_hours_start?: string;
    work_hours_end?: string;
    lunch_start?: string;
    lunch_end?: string;
    blocked_days?: string[];
    morning_preference?: boolean;
    evening_preference?: boolean;
    auto_mode?: boolean;
  };

  @Prop({ type: [Object], default: [] })
  automation_rules!: {
    name: string;
    condition: string;
    action: string;
    enabled: boolean;
  }[];

  @Prop({ type: Object, default: null })
  subscription!: {
    plan: string;
    started_at: Date;
    valid_until: Date;
    discount_percent: number;
    stripe_customer_id: string;
    stripe_subscription_id: string;
  };

  @Prop({ default: 0 })
  weekly_meeting_count!: number;

  @Prop({ default: 0 })
  total_meetings_scheduled!: number;

  @Prop({ default: false })
  has_reviewed!: boolean;

  @Prop()
  last_login!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1 });
UserSchema.index({ plan: 1 });
