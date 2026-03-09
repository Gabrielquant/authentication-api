import * as fs from "node:fs";
import { HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import * as argon2 from "argon2";
import { sendEmail } from "../../jobs/mail/mail.service";
import { CreateUserDto } from "../users/dto/createuser.dto";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { PayloadDto, Role } from "./dto/payload.dto";
import { ResetUserPasswordDto } from "./dto/reset-password.dto";
import { ResetPasswordRequest } from "./dto/reset-password-request.dto";
import { UserDto } from "./dto/user.dto";

jest.mock("src/jobs/mail/mail.service", () => ({
	sendEmail: jest.fn().mockResolvedValue({ message: "Email enviado" }),
}));

jest.mock("argon2", () => ({
	hash: jest.fn(),
	verify: jest.fn(),
}));

jest.mock("node:fs", () => ({
	...jest.requireActual("node:fs"),
	readFileSync: jest.fn(() => "fake-pem-key"),
}));

jest.mock("../../common/token.util", () => ({
	newUserToken: jest.fn(() => "mock-hashed-token"),
}));

const mockUser: UserDto & { id: string } = {
	id: "user-id",
	email: "user@example.com",
	role: Role.USER,
	passwordHash: "hashed-password",
};

describe("AuthService", () => {
	let service: AuthService;
	let userService: jest.Mocked<UsersService>;
	let jwtService: jest.Mocked<JwtService>;

	beforeEach(async () => {
		const mockUsersService = {
			createUser: jest.fn(),
			findOneWithEmail: jest.fn(),
			findResetPasswordToken: jest.fn(),
			saveUserToken: jest.fn(),
			updateUserToken: jest.fn(),
			verifyUserToken: jest.fn(),
			updateUser: jest.fn(),
		};

		const mockJwtService = {
			signAsync: jest.fn().mockResolvedValue("jwt-token"),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UsersService, useValue: mockUsersService },
				{ provide: JwtService, useValue: mockJwtService },
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		userService = module.get(UsersService);
		jwtService = module.get(JwtService);
		jest.clearAllMocks();
	});

	it("deve estar definido", () => {
		expect(service).toBeDefined();
	});

	describe("register", () => {
		it("should register user with success", async () => {
			const createUserDto: CreateUserDto = {
				email: "new@example.com",
				password: "senha123",
			};
			jest.mocked(argon2.hash).mockResolvedValue("hashed" as never);
			userService.createUser.mockResolvedValue(mockUser as never);

			const result = await service.register(createUserDto);

			expect(argon2.hash).toHaveBeenCalledWith(createUserDto.password);
			expect(userService.createUser).toHaveBeenCalledWith({
				email: createUserDto.email,
				password: "hashed",
			});
			expect(result).toEqual(mockUser);
		});

		it("should throw HttpException when FAILED_TO_CREATE_USER", async () => {
			jest.mocked(argon2.hash).mockResolvedValue("hashed" as never);
			userService.createUser.mockRejectedValue(
				new Error("FAILED_TO_CREATE_USER"),
			);

			await expect(
				service.register({ email: "a@b.com", password: "pass" }),
			).rejects.toMatchObject({
				message: "Credencias Invalidas.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException when EMAIL_ALREADY_EXISTS", async () => {
			jest.mocked(argon2.hash).mockResolvedValue("hashed" as never);
			userService.createUser.mockRejectedValue(
				new Error("EMAIL_ALREADY_EXISTS"),
			);

			await expect(
				service.register({ email: "exist@example.com", password: "pass" }),
			).rejects.toMatchObject({
				message: "Usuario ou Senha invalidas.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException for unknown error", async () => {
			jest.mocked(argon2.hash).mockResolvedValue("hashed" as never);
			userService.createUser.mockRejectedValue(new Error("UNKNOWN"));

			await expect(
				service.register({ email: "a@b.com", password: "pass" }),
			).rejects.toMatchObject({
				message: "Credencias Invalidas.",
				status: HttpStatus.BAD_REQUEST,
			});
		});
	});

	describe("generateJwt", () => {
		it("should return tokens when email and password are valid", async () => {
			const loginDto: LoginDto = {
				email: mockUser.email,
				password: "password123",
			};
			userService.findOneWithEmail.mockResolvedValue(mockUser as never);
			jest.mocked(argon2.verify).mockResolvedValue(true as never);
			jest.spyOn(service, "getTokens").mockResolvedValue({
				accessToken: "access-token",
				refreshToken: "refresh-token",
				jti: "jti-123" as never,
			});

			const result = await service.generateJwt(loginDto);

			expect(userService.findOneWithEmail).toHaveBeenCalledWith(loginDto.email);
			expect(argon2.verify).toHaveBeenCalledWith(
				mockUser.passwordHash,
				loginDto.password,
			);
			expect(result).toEqual({
				sub: mockUser.id,
				email: mockUser.email,
				accessToken: "access-token",
				refreshToken: "refresh-token",
			});
		});

		it("should throw HttpException when user not found", async () => {
			userService.findOneWithEmail.mockRejectedValue(
				new Error("USER_NOT_FOUND"),
			);

			await expect(
				service.generateJwt({
					email: "notfound@example.com",
					password: "pass",
				}),
			).rejects.toMatchObject({
				message: "Usuario não encontrado.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException when password is incorrect", async () => {
			userService.findOneWithEmail.mockResolvedValue(mockUser as never);
			jest.mocked(argon2.verify).mockResolvedValue(false as never);
			jest.spyOn(service, "getTokens").mockResolvedValue({
				accessToken: "at",
				refreshToken: "rt",
				jti: "jti" as never,
			});

			await expect(
				service.generateJwt({
					email: mockUser.email,
					password: "wrong",
				}),
			).rejects.toMatchObject({
				message: "Usuario ou Senha invalidas.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException for unknown error", async () => {
			userService.findOneWithEmail.mockRejectedValue(new Error("SOME_ERROR"));

			await expect(
				service.generateJwt({
					email: "a@b.com",
					password: "pass",
				}),
			).rejects.toMatchObject({
				message: "Credencias Invalidas.",
				status: HttpStatus.BAD_REQUEST,
			});
		});
	});

	describe("isValid", () => {
		it("should return user when found", async () => {
			const payload: PayloadDto = {
				sub: mockUser.id,
				email: mockUser.email,
				role: Role.USER,
				iat: 0,
				exp: 0,
			};
			userService.findOneWithEmail.mockResolvedValue(mockUser as never);

			const result = await service.isValid(payload);

			expect(userService.findOneWithEmail).toHaveBeenCalledWith(payload.email);
			expect(result).toEqual(mockUser);
		});

		it("should throw HttpException when USER_NOT_FOUND", async () => {
			userService.findOneWithEmail.mockRejectedValue(
				new Error("USER_NOT_FOUND"),
			);

			await expect(
				service.isValid({
					sub: "id",
					email: "not@example.com",
					role: Role.USER,
					iat: 0,
					exp: 0,
				}),
			).rejects.toMatchObject({
				message: "Usuario não encontrado.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException for unknown error", async () => {
			userService.findOneWithEmail.mockRejectedValue(new Error("OTHER_ERROR"));

			await expect(
				service.isValid({
					sub: "id",
					email: "a@b.com",
					role: Role.USER,
					iat: 0,
					exp: 0,
				}),
			).rejects.toMatchObject({
				message: "Token não é valido.",
				status: HttpStatus.BAD_REQUEST,
			});
		});
	});

	describe("getTokens", () => {
		it("should return accessToken, refreshToken and jti", async () => {
			const result = await service.getTokens(mockUser);

			expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
			expect(result).toHaveProperty("accessToken");
			expect(result).toHaveProperty("refreshToken");
			expect(result).toHaveProperty("jti");
			expect(fs.readFileSync).toHaveBeenCalled();
		});
	});

	describe("refreshTokens", () => {
		it("should return new tokens for email", async () => {
			userService.findOneWithEmail.mockResolvedValue(mockUser as never);
			jest.spyOn(service, "getTokens").mockResolvedValue({
				accessToken: "new-access",
				refreshToken: "new-refresh",
				jti: "jti-new" as never,
			});

			const result = await service.refreshTokens("user@example.com");

			expect(userService.findOneWithEmail).toHaveBeenCalledWith(
				"user@example.com",
			);
			expect(result).toEqual({
				accessToken: "new-access",
				refreshToken: "new-refresh",
				jti: "jti-new",
			});
		});

		it("should throw HttpException when TOKEN_NOT_FOUND", async () => {
			userService.findOneWithEmail.mockRejectedValue(
				new Error("TOKEN_NOT_FOUND"),
			);

			await expect(
				service.refreshTokens("user@example.com"),
			).rejects.toMatchObject({
				message: "Token inválido.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException for unknown error", async () => {
			userService.findOneWithEmail.mockRejectedValue(new Error("OTHER_ERROR"));

			await expect(
				service.refreshTokens("user@example.com"),
			).rejects.toMatchObject({
				message: "Não foi possível atualizar o refresh token.",
				status: HttpStatus.BAD_REQUEST,
			});
		});
	});

	describe("requestResetPassword", () => {
		it("should send email and return message when token does not exist", async () => {
			const request: ResetPasswordRequest = {
				email: "user@example.com",
			};
			userService.findOneWithEmail.mockResolvedValue(mockUser as never);
			userService.findResetPasswordToken.mockResolvedValue(null as never);
			userService.saveUserToken.mockResolvedValue({} as never);

			const result = await service.requestResetPassword(request);

			expect(userService.findOneWithEmail).toHaveBeenCalledWith(request.email);
			expect(userService.saveUserToken).toHaveBeenCalled();
			expect(sendEmail).toHaveBeenCalledWith(request.email);
			expect(result).toEqual({ message: "Email enviado" });
		});

		it("should update existing token and send email", async () => {
			const request: ResetPasswordRequest = {
				email: "user@example.com",
			};
			userService.findOneWithEmail.mockResolvedValue(mockUser as never);
			userService.findResetPasswordToken.mockResolvedValue({
				tokenHash: "old-hash",
			} as never);
			userService.updateUserToken.mockResolvedValue(undefined as never);

			const result = await service.requestResetPassword(request);

			expect(userService.updateUserToken).toHaveBeenCalled();
			expect(sendEmail).toHaveBeenCalledWith(request.email);
			expect(result).toEqual({ message: "Email enviado" });
		});

		it("should throw HttpException when USER_NOT_FOUND", async () => {
			userService.findOneWithEmail.mockRejectedValue(
				new Error("USER_NOT_FOUND"),
			);

			await expect(
				service.requestResetPassword({ email: "not@example.com" }),
			).rejects.toMatchObject({
				message: "Credenciais invalidas.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException when TOKEN_NOT_FOUND (after findUser)", async () => {
			userService.findOneWithEmail.mockResolvedValue(mockUser as never);
			userService.findResetPasswordToken.mockRejectedValue(
				new Error("TOKEN_NOT_FOUND"),
			);
			userService.saveUserToken.mockRejectedValue(new Error("TOKEN_NOT_FOUND"));

			await expect(
				service.requestResetPassword({ email: mockUser.email }),
			).rejects.toMatchObject({
				message: "Token inválido.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException for unknown error", async () => {
			userService.findOneWithEmail.mockRejectedValue(
				new Error("UNKNOWN_ERROR"),
			);

			await expect(
				service.requestResetPassword({ email: "a@b.com" }),
			).rejects.toMatchObject({
				message: "Não foi possivel realizar o pedido de reset de senha.",
				status: HttpStatus.BAD_REQUEST,
			});
		});
	});

	describe("resetPassword", () => {
		it("should update password and return success message", async () => {
			const resetDto: ResetUserPasswordDto = {
				resetToken: { token: "valid-token" },
				user: {
					email: "user@example.com",
					password: "novaSenha123",
				},
			};
			userService.verifyUserToken.mockResolvedValue("user-id");
			userService.updateUser.mockResolvedValue(undefined as never);

			const result = await service.resetPassword(resetDto);

			expect(userService.verifyUserToken).toHaveBeenCalledWith(
				resetDto.resetToken,
			);
			expect(userService.updateUser).toHaveBeenCalledWith(
				resetDto.user,
				"user-id",
			);
			expect(result).toEqual({
				message: "Senha alterada com sucesso",
			});
		});

		it("should throw HttpException when TOKEN_EXPIRED", async () => {
			userService.verifyUserToken.mockRejectedValue(new Error("TOKEN_EXPIRED"));

			await expect(
				service.resetPassword({
					resetToken: { token: "expired" },
					user: { email: "a@b.com", password: "pass" },
				}),
			).rejects.toMatchObject({
				message: "Token expirado. Solicite um novo pedido de reset de senha.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException when TOKEN_NOT_FOUND", async () => {
			userService.verifyUserToken.mockRejectedValue(
				new Error("TOKEN_NOT_FOUND"),
			);

			await expect(
				service.resetPassword({
					resetToken: { token: "invalid" },
					user: { email: "a@b.com", password: "pass" },
				}),
			).rejects.toMatchObject({
				message: "Token inválido.",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException when USER_NOT_FOUND", async () => {
			userService.verifyUserToken.mockResolvedValue("user-id");
			userService.updateUser.mockRejectedValue(new Error("USER_NOT_FOUND"));

			await expect(
				service.resetPassword({
					resetToken: { token: "valid" },
					user: { email: "a@b.com", password: "pass" },
				}),
			).rejects.toMatchObject({
				message: "Usuário não encontrado.",
				status: HttpStatus.NOT_FOUND,
			});
		});

		it("should throw HttpException for unknown error", async () => {
			userService.verifyUserToken.mockRejectedValue(new Error("OTHER_ERROR"));

			await expect(
				service.resetPassword({
					resetToken: { token: "t" },
					user: { email: "a@b.com", password: "pass" },
				}),
			).rejects.toMatchObject({
				message: "Não foi possível redefinir a senha.",
				status: HttpStatus.BAD_REQUEST,
			});
		});
	});
});
