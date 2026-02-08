import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import * as argon2 from "argon2";
import { generateTokenExpires } from "src/common/token.util";
import { PayloadDto } from "src/module/auth/dto/payload.dto";
import { UserDto } from "src/module/auth/dto/user.dto";
import { PrismaService } from "src/module/prisma/prisma.service";
import { UserTokenResetPasswordDto } from "../auth/dto/token-reset-password.dto";
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
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // unique constraint (email)
      if (error.code === "P2002") {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
    }
    throw new Error("FAILED_TO_CREATE_USER");
		}
	}

	async findOneWithEmail(email: string) {
		try {
			const user = await this.prisma.user.findFirst({
				where: { email: email, active: true },
				select: { id: true, email: true, role: true, passwordHash: true },
			});

			if (!user) {
				throw new Error("USER_NOT_FOUND");
			}

			return user;
		} catch (_error) {
			throw new HttpException("Credenciais invalidas", HttpStatus.BAD_REQUEST);
		}
	}

	async updateUser(updateUserDto: UpdateUserDto, userId: string) {
		const user = await this.prisma.user.findFirst({ where: { id: userId } });

		if (!user) {
			throw new Error("USER_NOT_FOUND");
		}

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

			if(!findTokenUser){
				throw new Error("TOKEN_NOT_FOUND");
			}

			return findTokenUser;
		} catch (_error) {
			throw new HttpException("Enviado com sucesso", HttpStatus.OK);
		}
	}

	async saveUserToken(user: UserDto, tokenHash: string) {
		const tokenExpires = generateTokenExpires();

		return await this.prisma.userToken.create({
			data: {
				tokenHash: tokenHash,
				type: "PASSWORD_RESET",
				sentTo: user.email,
				userId: user.id,
				expiresAt: tokenExpires,
			},
		});
	}

	async updateUserToken(user: UserDto, tokenHash: string) {
		const tokenExpires = generateTokenExpires();

		let version: number = 1;

		await this.prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: user.id },
				data: { tokenVersion: version++ },
			});
			await tx.userToken.update({
				where: { userId: user.id },
				data: { tokenHash: tokenHash, expiresAt: tokenExpires },
			});
		});
	}

	async verifyUserToken(userToken: UserTokenResetPasswordDto) {
		const expiredDate = await this.prisma.userToken.findFirst({
			where: { tokenHash: userToken.token },
			select: { expiresAt: true, userId: true },
		});

		if (!expiredDate?.expiresAt) {
			throw new Error("TOKEN_NOT_FOUND");
		}

		const nowDate = Date.now();

		if (expiredDate.expiresAt <= nowDate) {
			return expiredDate.userId;
		} else {
			throw new Error("TOKEN_EXPIRED");
		}
	}
}
