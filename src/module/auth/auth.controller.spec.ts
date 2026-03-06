import { Test, TestingModule } from "@nestjs/testing";
import { CreateUserDto } from "../users/dto/createuser.dto";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

jest.mock("src/jobs/mail/mail.service", () => ({
	sendEmail: jest.fn(),
}));

import { LoginDto } from "./dto/login.dto";
import { ResetUserPasswordDto } from "./dto/reset-password.dto";
import { ResetPasswordRequest } from "./dto/reset-password-request.dto";

describe("AuthController", () => {
	let controller: AuthController;
	let authService: jest.Mocked<AuthService>;

	const mockAuthService = {
		register: jest.fn(),
		generateJwt: jest.fn(),
		refreshTokens: jest.fn(),
		requestResetPassword: jest.fn(),
		resetPassword: jest.fn(),
	};

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		authService = module.get(AuthService);
	});

	it("deve estar definido", () => {
		expect(controller).toBeDefined();
	});

	describe("registerUser", () => {
		it("deve chamar authService.register com CreateUserDto e retornar o resultado", async () => {
			const createUserDto: CreateUserDto = {
				email: "user@example.com",
				password: "senha123",
			};
			const expectedUser = {
				id: "user-id",
				email: createUserDto.email,
				role: "USER",
				passwordHash: "hash",
				active: true,
				tokenVersion: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockAuthService.register.mockResolvedValue(expectedUser);

			const result = await controller.registerUser(createUserDto);

			expect(authService.register).toHaveBeenCalledTimes(1);
			expect(authService.register).toHaveBeenCalledWith(createUserDto);
			expect(result).toEqual(expectedUser);
		});
	});

	describe("logIn", () => {
		it("deve chamar authService.generateJwt com LoginDto e retornar tokens", async () => {
			const loginDto: LoginDto = {
				email: "user@example.com",
				password: "senha123",
			};
			const expectedResponse = {
				sub: "user-id",
				email: loginDto.email,
				accessToken: "access-token",
				refreshToken: "refresh-token",
			};

			mockAuthService.generateJwt.mockResolvedValue(expectedResponse);

			const result = await controller.logIn(loginDto);

			expect(authService.generateJwt).toHaveBeenCalledTimes(1);
			expect(authService.generateJwt).toHaveBeenCalledWith(loginDto);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe("refresh", () => {
		it("deve chamar authService.refreshTokens com email do req.user e retornar tokens", async () => {
			const req = { user: { email: "user@example.com" } };
			const expectedTokens = {
				accessToken: "new-access-token",
				refreshToken: "new-refresh-token",
				jti: "jti-uuid",
			};

			mockAuthService.refreshTokens.mockResolvedValue(expectedTokens);

			const result = await controller.refresh(req);

			expect(authService.refreshTokens).toHaveBeenCalledTimes(1);
			expect(authService.refreshTokens).toHaveBeenCalledWith(
				"user@example.com",
			);
			expect(result).toEqual(expectedTokens);
		});
	});

	describe("requestResetPassword", () => {
		it("deve chamar authService.requestResetPassword com ResetPasswordRequest", async () => {
			const resetPasswordRequest: ResetPasswordRequest = {
				email: "user@example.com",
			};
			const expectedResponse = { message: "Email enviado" };

			mockAuthService.requestResetPassword.mockResolvedValue(
				expectedResponse as never,
			);

			const result =
				await controller.requestResetPassword(resetPasswordRequest);

			expect(authService.requestResetPassword).toHaveBeenCalledTimes(1);
			expect(authService.requestResetPassword).toHaveBeenCalledWith(
				resetPasswordRequest,
			);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe("resetPassword", () => {
		it("deve chamar authService.resetPassword com ResetUserPasswordDto", async () => {
			const resetUserPasswordDto: ResetUserPasswordDto = {
				resetToken: { token: "reset-token-123" },
				user: { email: "new@example.com", password: "novaSenha123" },
			};
			const expectedResponse = { message: "Senha alterada com sucesso" };

			mockAuthService.resetPassword.mockResolvedValue(
				expectedResponse as never,
			);

			const result = await controller.resetPassword(resetUserPasswordDto);

			expect(authService.resetPassword).toHaveBeenCalledTimes(1);
			expect(authService.resetPassword).toHaveBeenCalledWith(
				resetUserPasswordDto,
			);
			expect(result).toEqual(expectedResponse);
		});
	});
});
