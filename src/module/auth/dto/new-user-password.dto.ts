import { IsString, MinLength } from "class-validator";

export class NewUserPasswordDto {
  @IsString()
  @MinLength(8)
  password: string
}