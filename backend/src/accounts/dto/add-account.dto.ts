import { IsEmail, IsOptional, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AddAccountDto {
  @ApiProperty({ example: "work@gmail.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: ["self", "associated"] })
  @IsOptional()
  @IsEnum(["self", "associated"])
  type?: string;
}
