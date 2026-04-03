import { PartialType } from "@nestjs/mapped-types";
import { CreateEventDto } from "./create-event.dto";
import { IsOptional, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    enum: ["scheduled", "confirmed", "cancelled", "rescheduled", "completed"],
  })
  @IsOptional()
  @IsEnum(["scheduled", "confirmed", "cancelled", "rescheduled", "completed"])
  status?: string;
}
