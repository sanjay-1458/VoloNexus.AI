import { IsString, IsOptional, IsEnum, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBugDto {
  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshots?: string[];

  @ApiPropertyOptional({ enum: ["low", "medium", "high", "critical"] })
  @IsOptional()
  @IsEnum(["low", "medium", "high", "critical"])
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  browser_info?: string;
}
