import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ example: 'Schedule a meeting tomorrow at 3pm' })
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  history?: any[];
}