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
			console.log(error);
			throw new HttpException("Credenciais Invalidas", HttpStatus.CONFLICT);
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
				throw new HttpException(
					"Credenciais invalidas",
					HttpStatus.BAD_REQUEST,
				);
			}

			return {
				sub: user.id,
				email: user.email,
				accessToken: accessToken,
				refreshToken: refreshToken,
			};
		} catch (error) {
			console.log(error);
			throw new HttpException("Credenciais invalidas.", HttpStatus.CONFLICT);
		}
	}

	async isValid(payLoad: PayloadDto) {
		const findUser = await this.userServices.findOneWithEmail(payLoad.email);

		return findUser;
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
		const user = await this.userServices.findOneWithEmail(userEmail);

		const tokens = await this.getTokens(user);

		return tokens;
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
		} catch (_error) {
			throw new HttpException("Enviado com sucesso", HttpStatus.OK);
		}
	}

	async resetPassword(resetUser: ResetUserPasswordDto) {
		try {
			const userId = await this.userServices.verifyUserToken(resetUser.resetToken);

			await this.userServices.updateUser(resetUser.user, userId);

			return new HttpException("Senha alterada com sucesso", HttpStatus.OK);
		} catch (_error) {
			console.log(_error);
			throw new HttpException("Credenciais invalidas", HttpStatus.BAD_REQUEST);
		}
	}
}
