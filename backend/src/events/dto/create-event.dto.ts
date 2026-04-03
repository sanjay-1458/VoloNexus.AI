import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ParticipantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsEnum(["accepted", "declined", "pending"])
  status?: string;
}

export class ReminderDto {
  @IsBoolean()
  enabled!: boolean;

  @IsNumber()
  minutes_before!: number;

  @IsArray()
  @IsString({ each: true })
  channels!: string[];
}

export class CreateEventDto {
  @ApiProperty({ example: "Team Standup" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: "Daily standup meeting" })
  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsOptional()
  severity_score?: number;

  @ApiProperty({
    enum: ["meeting", "interview", "zoom_call", "gym", "travel", "other"],
  })
  @IsEnum(["meeting", "interview", "zoom_call", "gym", "travel", "other"])
  type!: string;

  @ApiProperty({ example: "2026-06-15T10:00:00Z" })
  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @ApiProperty({ example: "2026-06-15T11:00:00Z" })
  @IsDateString()
  @IsNotEmpty()
  end_time!: string;

  @ApiPropertyOptional({ enum: ["low", "medium", "high", "critical"] })
  @IsOptional()
  @IsEnum(["low", "medium", "high", "critical"])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meeting_link?: string;

  @ApiPropertyOptional({ type: [ParticipantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants?: ParticipantDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderDto)
  reminder?: ReminderDto;

  @ApiPropertyOptional({
    enum: ["email", "manual", "ai", "calendar_sync", "assistant"],
  })
  @IsOptional()
  @IsEnum(["email", "manual", "ai", "calendar_sync", "assistant"])
  source?: string;

  @ApiPropertyOptional({
    description: "Used by Email Agent for duplicate avoidance",
  })
  @IsOptional()
  @IsString()
  external_id?: string;

  @ApiPropertyOptional({ description: "External calendar sync ID" })
  @IsOptional()
  @IsString()
  external_event_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @ApiPropertyOptional({ enum: ["daily", "weekly", "monthly"] })
  @IsOptional()
  @IsEnum(["daily", "weekly", "monthly"])
  recurrence_pattern?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  recurrence_until?: string;
}
