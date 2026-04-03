import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type BugReportDocument = BugReport & Document;

@Schema({ timestamps: true, collection: "bug_reports" })
export class BugReport {
  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  user_id!: Types.ObjectId;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [String], default: [] })
  screenshots!: string[];

  @Prop({ enum: ["low", "medium", "high", "critical"], default: "medium" })
  severity!: string;

  @Prop({
    enum: ["submitted", "verified", "in_progress", "resolved", "dismissed"],
    default: "submitted",
  })
  status!: string;

  @Prop({ default: false })
  ai_filtered!: boolean;

  @Prop({ default: true })
  ai_relevant!: boolean;

  @Prop({ default: null })
  ai_summary!: string;

  @Prop({ default: null })
  ai_impact_analysis!: string;

  @Prop({ default: null })
  page_url!: string;

  @Prop({ default: null })
  browser_info!: string;

  @Prop({ default: null })
  admin_notes!: string;

  @Prop({ default: null })
  resolved_by!: string;

  @Prop({ default: null })
  resolved_at!: Date;
}

export const BugReportSchema = SchemaFactory.createForClass(BugReport);

BugReportSchema.index({ status: 1 });
BugReportSchema.index({ severity: -1 });
BugReportSchema.index({ ai_relevant: 1 });
