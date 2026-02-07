import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { UpdateUserDto } from "src/module/users/dto/updateuser.dto";
import { UserTokenResetPasswordDto } from "./token-reset-password.dto";

export class ResetUserPasswordDto {
	@ValidateNested()
	@Type(() => UserTokenResetPasswordDto)
	resetToken!: UserTokenResetPasswordDto;
	@ValidateNested()
	@Type(() => UpdateUserDto)
	user!: UpdateUserDto;
}
