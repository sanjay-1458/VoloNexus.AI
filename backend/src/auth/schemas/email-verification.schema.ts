import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type EmailVerificationDocument = EmailVerification & Document;

@Schema({ timestamps: true, collection: "email_verifications" })
export class EmailVerification {
  @Prop({ required: true, index: true })
  email!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  otp!: string;

  @Prop({ required: true, expires: "10m" })
  expires_at!: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);