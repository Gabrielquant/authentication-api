import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { sendEmail } from "src/jobs/mail/mail.service";
import { UsersService } from "src/module/users/users.service";
import { newUserToken } from "../../common/token.util";
import { CreateUserDto } from "../users/dto/createuser.dto";
import { LoginDto } from "./dto/login.dto";
import { PayloadDto } from "./dto/payload.dto";
import { ResetUserPasswordDto } from "./dto/reset-password.dto";
import { ResetPasswordRequest } from "./dto/reset-password-request.dto";
import { UserDto } from "./dto/user.dto";

@Injectable()
export class AuthService {
	constructor(
		private readonly userServices: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async register(createUserDto: CreateUserDto) {
		try {
			const hashedPassword = await argon2.hash(createUserDto.password);

			const newUser = await this.userServices.createUser({
				email: createUserDto.email,
				password: hashedPassword,
			});

			return newUser;
		} catch (error) {
			if (error instanceof Error) {
				switch (error.message) {
					case "FAILED_TO_CREATE_USER":
						throw new HttpException(
							"Credencias Invalidas.",
							HttpStatus.BAD_REQUEST,
						);
					case "EMAIL_ALREADY_EXISTS":
						throw new HttpException(
							"Usuaruio ou Senha invalidas.",
							HttpStatus.BAD_REQUEST,
						);
				}
			}
			throw new HttpException("Credencias Invalidas.", HttpStatus.BAD_REQUEST);
		}
	}

	async generateJwt(loginDto: LoginDto) {
		try {
			const user = await this.userServices.findOneWithEmail(loginDto.email);

			const passwordValid = await argon2.verify(
				user.passwordHash,
				loginDto.password,
			);

			const { accessToken, refreshToken } = await this.getTokens(user);

			if (!passwordValid) {
				throw new Error("INCORRECT_PASSWORD");
			}

			return {
				sub: user.id,
				email: user.email,
				accessToken: accessToken,
				refreshToken: refreshToken,
			};
		} catch (error) {
			if (error instanceof Error) {
				switch (error.message) {
					case "USER_NOT_FOUND":
						throw new HttpException(
							"Usuaruio não encontrado.",
							HttpStatus.BAD_REQUEST,
						);
					case "INCORRECT_PASSWORD":
						throw new HttpException(
							"Usuaruio ou Senha invalidas.",
							HttpStatus.BAD_REQUEST,
						);
				}
			}
			throw new HttpException("Credencias Invalidas.", HttpStatus.BAD_REQUEST);
		}
	}

	async isValid(payLoad: PayloadDto) {
		try {
			const findUser = await this.userServices.findOneWithEmail(payLoad.email);

			return findUser;
		} catch (error) {
			if (error instanceof Error) {
				switch (error.message) {
					case "USER_NOT_FOUND":
						throw new HttpException(
							"Usuaruio não encontrado.",
							HttpStatus.BAD_REQUEST,
						);
				}
			}
			throw new HttpException("Token não é valido.", HttpStatus.BAD_REQUEST);
		}
	}

	async getTokens(userDto: UserDto) {
		const jti = randomUUID();

		const payload = {
			sub: userDto.id,
			email: userDto.email,
			role: userDto.role,
		};

		const accessToken = await this.jwtService.signAsync(
			{ ...payload, type: "access" },
			{
				algorithm: "RS256",
				expiresIn: "15m",
				privateKey: fs.readFileSync(
					path.resolve(process.cwd(), "keys", "private.pem"),
				),
			},
		);

		const refreshToken = await this.jwtService.signAsync(
			{ ...payload, type: "refresh", jti },
			{
				algorithm: "RS256",
				expiresIn: "7d",
				privateKey: fs.readFileSync(
					path.resolve(process.cwd(), "keys", "private-refresh.pem"),
				),
			},
		);

		return { accessToken, refreshToken, jti };
	}

	async refreshTokens(userEmail: string) {
		try {
			const user = await this.userServices.findOneWithEmail(userEmail);

			const tokens = await this.getTokens(user);

			return tokens;
		} catch (error) {
			if (error instanceof Error) {
				switch (error.message) {
					case "TOKEN_NOT_FOUND":
						throw new HttpException("Token inválido.", HttpStatus.BAD_REQUEST);
				}
			}
			throw new HttpException(
				"Não foi realizar o refresh de token.",
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async requestResetPassword(ResetPasswordRequest: ResetPasswordRequest) {
		try {
			const user = await this.userServices.findOneWithEmail(
				ResetPasswordRequest.email,
			);

			const token = await this.userServices.findResetPasswordToken(user.id);

			let newToken = newUserToken();

			if (!token?.tokenHash) {
				await this.userServices.saveUserToken(user, newToken);
			} else {
				newToken = newUserToken();
				await this.userServices.updateUserToken(user, newToken);
			}

			return await sendEmail(ResetPasswordRequest.email);
		} catch (error) {
			if (error instanceof Error) {
				switch (error.message) {
					case "TOKEN_NOT_FOUND":
						throw new HttpException("Token inválido.", HttpStatus.BAD_REQUEST);

					case "USER_NOT_FOUND":
						throw new HttpException(
							"Credenciais invalidas.",
							HttpStatus.BAD_REQUEST,
						);
				}
			}
			throw new HttpException(
				"Não foi realizar o pedido de reset de senha.",
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async resetPassword(resetUser: ResetUserPasswordDto) {
		try {
			const userId = await this.userServices.verifyUserToken(
				resetUser.resetToken,
			);

			await this.userServices.updateUser(resetUser.user, userId);

			return {
				message: "Senha alterada com sucesso",
			};
		} catch (error) {
			if (error instanceof Error) {
				switch (error.message) {
					case "TOKEN_EXPIRED":
						throw new HttpException(
							"Token expirado. Solicite um novo reset de senha.",
							HttpStatus.BAD_REQUEST,
						);

					case "TOKEN_NOT_FOUND":
						throw new HttpException("Token inválido.", HttpStatus.BAD_REQUEST);

					case "USER_NOT_FOUND":
						throw new HttpException(
							"Usuário não encontrado.",
							HttpStatus.NOT_FOUND,
						);
				}
			}
			throw new HttpException(
				"Não foi possível redefinir a senha.",
				HttpStatus.BAD_REQUEST,
			);
		}
	}
}
