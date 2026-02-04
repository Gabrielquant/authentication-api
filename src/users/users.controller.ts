import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { PayloadDto } from "src/auth/dto/payload.dto";
import { JwtAuthGuard } from "src/auth/guard/auth-access-token.guard";
import { CurrentUser } from "src/auth/param/current-user.decorator";
import { TokenPayloadParam } from "src/auth/param/token-payload.parms";
import { UpdateUserDto } from "./dto/updateuser.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
	constructor(private readonly userService: UsersService) {}

	@UseGuards(JwtAuthGuard)
	@Post("update")
	updateUser(
		@Body() updateUserDto: UpdateUserDto,
		@CurrentUser("userId") userId: string,
	) {
		return this.userService.updateUser(updateUserDto, userId);
	}

	@UseGuards(JwtAuthGuard)
	@Get()
	getUser(@TokenPayloadParam() payloadDto: PayloadDto) {
		return this.userService.getUser(payloadDto);
	}
}
