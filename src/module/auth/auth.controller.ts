import { Body, Controller, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtRefreshGuard } from "../../common/guard/auth-refresh-token.guard";
import { CreateUserDto } from "../users/dto/createuser.dto";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ResetUserPasswordDto } from "./dto/reset-password.dto";
import { ResetPasswordRequest } from "./dto/reset-password-request.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	registerUser(@Body() createUserDto: CreateUserDto) {
		return this.authService.register(createUserDto);
	}

	@Throttle({default: { limit: 3, ttl: 60000 }})
	@Post("login")
	logIn(@Body() logInDto: LoginDto) {
		return this.authService.generateJwt(logInDto);
	}

	@Post("refresh")
	@UseGuards(JwtRefreshGuard)
	refresh(@Req() req) {
		return this.authService.refreshTokens(req.user.email);
	}

	@Throttle({default: { limit: 3, ttl: 60000 }})
	@Post("request/reset/password")
	requestResetPassword(@Body() resetPasswordRequest: ResetPasswordRequest) {
		return this.authService.requestResetPassword(resetPasswordRequest);
	}

	@Throttle({default: { limit: 3, ttl: 60000 }})
	@Patch("reset/password")
	resetPassword(@Body() resetUser: ResetUserPasswordDto) {
		return this.authService.resetPassword(resetUser);
	}
}
