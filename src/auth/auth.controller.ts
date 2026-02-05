import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { CreateUserDto } from "../users/dto/createuser.dto";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtRefreshGuard } from "./guard/auth-refresh-token.guard";
import { ResetPasswordRequest } from "./dto/reset-password-request.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	registerUser(@Body() createUserDto: CreateUserDto) {
		return this.authService.register(createUserDto);
	}

	@Post("login")
	logIn(@Body() logInDto: LoginDto) {
		return this.authService.generateJwt(logInDto);
	}


	@Post("refresh")
	@UseGuards(JwtRefreshGuard)
	refresh(@Req() req) {
		return this.authService.refreshTokens(req.user.email);
	}

	@Post("reset/password")
	resetPassword(@Body() resetPasswordRequest: ResetPasswordRequest){
		return this.authService.passwordReset(resetPasswordRequest)
	}
}
