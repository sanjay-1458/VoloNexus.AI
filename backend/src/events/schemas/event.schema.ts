import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type EventDocument = Event & Document;

@Schema({
  timestamps: true,
  collection: "events",
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Event {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  user_id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ default: "" })
  description!: string;

  @Prop({
    required: true,
    enum: ["meeting", "interview", "zoom_call", "gym", "travel", "other"],
    default: "other",
  })
  type!: string;

  @Prop({ required: true })
  start_time!: Date;

  @Prop({ required: true, index: true })
  end_time!: Date;

  @Prop({ enum: ["low", "medium", "high", "critical"], default: "medium" })
  priority!: string;

  @Prop({ default: 50 })
  severity_score!: number;

  @Prop({
    enum: ["scheduled", "confirmed", "cancelled", "rescheduled", "completed"],
    default: "scheduled",
  })
  status!: string;

  @Prop({
    enum: ["email", "manual", "ai", "calendar_sync", "assistant"],
    default: "manual",
  })
  source!: string;

  @Prop({ default: null })
  source_email!: string;

  @Prop({ default: null })
  external_event_id!: string;

  @Prop({ default: null })
  location!: string;

  @Prop({ default: null })
  meeting_link!: string;

  @Prop({ type: [Object], default: [] })
  participants!: {
    name: string;
    email: string;
    status: "accepted" | "declined" | "pending";
  }[];

  @Prop({
    type: Object,
    default: { enabled: true, minutes_before: 15, channels: ["email"] },
  })
  reminder!: {
    enabled: boolean;
    minutes_before: number;
    channels: string[];
  };

  @Prop({ default: false })
  reminder_sent!: boolean;

  @Prop({ default: false })
  is_recurring!: boolean;

  @Prop({ type: Object, default: null })
  recurrence!: {
    frequency: "daily" | "weekly" | "monthly";
    interval: number;
    end_date: Date;
  };

  @Prop({ default: false })
  has_conflict!: boolean;

  @Prop({ type: [Types.ObjectId], default: [] })
  conflicting_event_ids!: Types.ObjectId[];

  @Prop({ type: Object, default: null })
  ai_metadata!: {
    suggested_by_ai: boolean;
    reasoning: string;
    original_request: string;
  };

  @Prop({ default: true })
  is_flexible!: boolean;

  @Prop({ default: true })
  is_reschedulable!: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.virtual("id").get(function (this: any) {
  return this._id.toHexString();
});

EventSchema.index({ user_id: 1, start_time: 1 });
EventSchema.index({ user_id: 1, status: 1 });
EventSchema.index({ user_id: 1, type: 1 });
EventSchema.index({ start_time: 1, end_time: 1 });

EventSchema.index(
  { user_id: 1, external_event_id: 1 },
  {
    unique: true,
    partialFilterExpression: { external_event_id: { $ne: null } },
  },
);
