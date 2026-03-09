import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorator/current-user.decorator";
import { Roles } from "../../common/decorator/roles.decorator";
import { JwtAuthGuard } from "../../common/guard/auth-access-token.guard";
import { RolesGuard } from "../../common/guard/roles.guard";
import { PayloadDto, Role } from "../auth/dto/payload.dto";
import { UpdateUserDto } from "./dto/updateuser.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
	constructor(private readonly userService: UsersService) {}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Realiza o update de email do usuario" })
	@Post("update")
	updateUser(
		@Body() updateUserDto: UpdateUserDto,
		@CurrentUser("sub") userId: string,
	) {
		return this.userService.updateUser(updateUserDto, userId);
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@ApiBearerAuth()
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: "Busca todas as informações do usuario" })
	@Get()
	getUser(@CurrentUser() payloadDto: PayloadDto) {
		return this.userService.getUser(payloadDto);
	}
}
