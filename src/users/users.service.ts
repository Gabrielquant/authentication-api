import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import * as argon2 from "argon2";
import { PayloadDto } from "src/auth/dto/payload.dto";
import { PrismaService } from "src/prisma/prisma.service";
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

	async findOne(email: string) {
		const user = await this.prisma.user.findFirst({
			where: { email: email, active: true },
		});

		if (!user) {
			throw new HttpException("Credenciais invalidas", HttpStatus.BAD_REQUEST);
		}

		return user;
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
		const user = await this.prisma.user.findFirst({
			where: { id: payloadToken.sub },
			select: { id: true, email: true, role: true },
		});

		return user;
	}
}
