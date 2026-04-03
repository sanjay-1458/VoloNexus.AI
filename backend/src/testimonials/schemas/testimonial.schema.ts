import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type TestimonialDocument = Testimonial & Document;

@Schema({ timestamps: true, collection: "testimonials" })
export class Testimonial {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user_id!: Types.ObjectId;

  @Prop({ required: true })
  user_name!: string;

  @Prop({ default: null })
  user_avatar!: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ required: true })
  review!: string;

  @Prop({ default: null })
  company!: string;

  @Prop({ default: false })
  is_public!: boolean;

  @Prop({ default: null })
  ai_summary!: string;

  @Prop({ default: null })
  ai_suggested_improvements!: string;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);

TestimonialSchema.index({ user_id: 1 });
TestimonialSchema.index({ rating: -1 });
TestimonialSchema.index({ is_public: 1 });
