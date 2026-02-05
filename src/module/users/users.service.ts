import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import * as argon2 from "argon2";
import { PayloadDto } from "src/module/auth/dto/payload.dto";
import { UserDto } from "src/module/auth/dto/user.dto";
import { PrismaService } from "src/module/prisma/prisma.service";
import { CreateUserDto } from "./dto/createuser.dto";
import { UpdateUserDto } from "./dto/updateuser.dto";

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async createUser(createUserDto: CreateUserDto, role: Role = "USER") {
		try {
			const newUser = await this.prisma.user.create({
				data: {
					email: createUserDto.email,
					passwordHash: createUserDto.password,
					role: role,
				},
			});

			return newUser;
		} catch {
			throw new HttpException("Tente outro email.", HttpStatus.CONFLICT);
		}
	}

	async findOneWithEmail(email: string) {
		try {
			const user = await this.prisma.user.findFirst({
				where: { email: email, active: true },
				select: { id: true, email: true, role: true, passwordHash: true },
			});

			if (!user) {
				throw new HttpException(
					"Credenciais invalidas",
					HttpStatus.BAD_REQUEST,
				);
			}

			return user;
		} catch (_error) {
			throw new HttpException("Credenciais invalidas", HttpStatus.BAD_REQUEST);
		}
	}

	async updateUser(updateUserDto: UpdateUserDto, userId: string) {
		const user = await this.prisma.user.findFirst({ where: { id: userId } });

		const dataUser: { email?: string; passwordHash?: string } = {
			email: updateUserDto.email ? updateUserDto.email : user?.email,
		};

		if (updateUserDto?.password) {
			const passwordHash = await argon2.hash(updateUserDto.password);
			dataUser.passwordHash = passwordHash;
		}

		const updateUser = await this.prisma.user.update({
			where: { id: userId },
			data: {
				email: dataUser?.email,
				passwordHash: dataUser?.passwordHash
					? dataUser?.passwordHash
					: user?.passwordHash,
			},
			select: { email: true },
		});

		return updateUser;
	}

	async getUser(payloadToken: PayloadDto) {
		console.log(payloadToken);
		const user = await this.prisma.user.findMany({
			select: { id: true, email: true, role: true },
		});

		return user;
	}

	async findResetPasswordToken(userId: string) {
		try {
			const findTokenUser = await this.prisma.userToken.findFirst({
				where: { userId: userId, type: "PASSWORD_RESET" },
			});

			return findTokenUser;
		} catch (_error) {
			throw new HttpException("Enviado com sucesso", HttpStatus.OK);
		}
	}

	async saveUserToken(user: UserDto, tokenHash: string) {
		return this.prisma.userToken.create({
			data: {
				tokenHash: tokenHash,
				type: "PASSWORD_RESET",
				sentTo: user.email,
				userId: user.id,
			},
		});
	}

	async updateUserToken(user: UserDto, tokenHash: string) {
		let version: number = 1;

		await this.prisma.user.update({
			where: { id: user.id },
			data: { tokenVersion: version++ },
		});
		await this.prisma.userToken.update({
			where: { userId: user.id },
			data: { tokenHash: tokenHash },
		});
	}
}
