import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AccountDocument = Account & Document;

@Schema({ timestamps: true, collection: "accounts" })
export class Account {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  user_id!: Types.ObjectId;

  @Prop({ required: true, lowercase: true })
  email!: string;

  @Prop({ default: false })
  is_primary!: boolean;

  @Prop({ enum: ["self", "associated"], default: "self" })
  type!: string;

  @Prop({ type: Object, default: null })
  oauth_tokens!: {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expiry_date?: number;
    scope?: string;
  };

  @Prop({ default: false })
  is_connected!: boolean;

  @Prop({
    enum: ["idle", "syncing", "completed", "failed"],
    default: "idle",
  })
  sync_status!: string;

  @Prop({ default: null })
  error_message!: string;

  @Prop({ default: null })
  last_synced!: Date;

  @Prop({ default: null })
  display_name!: string;

  @Prop({ default: null })
  profile_picture!: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
AccountSchema.index({ user_id: 1, email: 1 }, { unique: true });
