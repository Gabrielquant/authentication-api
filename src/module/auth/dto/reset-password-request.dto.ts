import { IsEmail } from "class-validator";

export class ResetPasswordRequest {
  @IsEmail()
  email: string
}