import { IsString } from "class-validator";

export class UserTokenResetPasswordDto {
  @IsString()
  token: string
}