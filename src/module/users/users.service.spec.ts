import { HttpStatus } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Prisma, Role } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { PayloadDto, Role as PayloadRole } from "../auth/dto/payload.dto";
import { UserDto } from "../auth/dto/user.dto";
import { CreateUserDto } from "./dto/createuser.dto";
import { UsersService } from "./users.service";

jest.mock("src/common/token.util", () => ({
	generateTokenExpires: jest.fn(() => Date.now() + 3600000),
}));

jest.mock("argon2", () => ({
	hash: jest.fn(),
	verify: jest.fn(),
}));

describe("UsersService", () => {
	let service: UsersService;
	let prisma: {
		user: {
			create: jest.Mock;
			findFirst: jest.Mock;
			findMany: jest.Mock;
			update: jest.Mock;
		};
		userToken: {
			findFirst: jest.Mock;
			create: jest.Mock;
			update: jest.Mock;
		};
		$transaction: jest.Mock;
	};

	const mockUser = {
		id: "user-id",
		email: "user@example.com",
		passwordHash: "hash",
		role: "USER" as Role,
		active: true,
		tokenVersion: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		const mockPrisma = {
			user: {
				create: jest.fn(),
				findFirst: jest.fn(),
				findMany: jest.fn(),
				update: jest.fn(),
			},
			userToken: {
				findFirst: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
			},
			$transaction: jest.fn((cb) => cb(mockPrisma)),
		};
		prisma = mockPrisma as typeof prisma;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: PrismaService,
					useValue: mockPrisma,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("createUser", () => {
		it("should create user with success and return the user", async () => {
			const createUserDto: CreateUserDto = {
				email: "new@example.com",
				password: "hashed",
			};
			prisma.user.create.mockResolvedValue(mockUser);

			const result = await service.createUser(createUserDto);

			expect(prisma.user.create).toHaveBeenCalledWith({
				data: {
					email: createUserDto.email,
					passwordHash: createUserDto.password,
					role: "USER",
				},
			});
			expect(result).toEqual(mockUser);
		});

		it("should create user with role ADMIN when informed", async () => {
			prisma.user.create.mockResolvedValue({ ...mockUser, role: "ADMIN" });

			await service.createUser(
				{ email: "admin@example.com", password: "hash" },
				"ADMIN",
			);

			expect(prisma.user.create).toHaveBeenCalledWith({
				data: {
					email: "admin@example.com",
					passwordHash: "hash",
					role: "ADMIN",
				},
			});
		});

		it("should throw EMAIL_ALREADY_EXISTS when email already exists (P2002)", async () => {
			const error = new Prisma.PrismaClientKnownRequestError(
				"Unique constraint failed",
				{ code: "P2002", clientVersion: "1" },
			);
			prisma.user.create.mockRejectedValue(error);

			await expect(
				service.createUser({
					email: "existing@example.com",
					password: "hash",
				}),
			).rejects.toThrow("EMAIL_ALREADY_EXISTS");
		});

		it("should throw FAILED_TO_CREATE_USER when other Prisma error", async () => {
			prisma.user.create.mockRejectedValue(new Error("Database error"));

			await expect(
				service.createUser({
					email: "user@example.com",
					password: "hash",
				}),
			).rejects.toThrow("FAILED_TO_CREATE_USER");
		});
	});

	describe("findOneWithEmail", () => {
		it("should return user when found", async () => {
			const userFound = {
				id: mockUser.id,
				email: mockUser.email,
				role: mockUser.role,
				passwordHash: mockUser.passwordHash,
			};
			prisma.user.findFirst.mockResolvedValue(userFound);

			const result = await service.findOneWithEmail("user@example.com");

			expect(prisma.user.findFirst).toHaveBeenCalledWith({
				where: { email: "user@example.com", active: true },
				select: { id: true, email: true, role: true, passwordHash: true },
			});
			expect(result).toEqual(userFound);
		});

		it("should throw HttpException when user not found", async () => {
			prisma.user.findFirst.mockResolvedValue(null);

			await expect(
				service.findOneWithEmail("notfound@example.com"),
			).rejects.toMatchObject({
				message: "Credenciais invalidas",
				status: HttpStatus.BAD_REQUEST,
			});
		});

		it("should throw HttpException when Prisma throws error", async () => {
			prisma.user.findFirst.mockRejectedValue(new Error("DB error"));

			await expect(
				service.findOneWithEmail("user@example.com"),
			).rejects.toMatchObject({
				message: "Credenciais invalidas",
				status: HttpStatus.BAD_REQUEST,
			});
		});
	});

	describe("updateUser", () => {
		it("should update only email when only email is passed", async () => {
			prisma.user.findFirst.mockResolvedValue(mockUser);
			prisma.user.update.mockResolvedValue({
				email: "newemail@example.com",
			});

			const result = await service.updateUser(
				{ email: "newemail@example.com" },
				mockUser.id,
			);

			expect(prisma.user.findFirst).toHaveBeenCalledWith({
				where: { id: mockUser.id },
			});
			expect(argon2.hash).not.toHaveBeenCalled();
			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: {
					email: "newemail@example.com",
					passwordHash: mockUser.passwordHash,
				},
				select: { email: true },
			});
			expect(result).toEqual({ email: "newemail@example.com" });
		});

		it("should update email and password when both are passed", async () => {
			prisma.user.findFirst.mockResolvedValue(mockUser);
			jest.mocked(argon2.hash).mockResolvedValue("new-hash" as never);
			prisma.user.update.mockResolvedValue({ email: "updated@example.com" });

			await service.updateUser(
				{ email: "updated@example.com", password: "newpass123" },
				mockUser.id,
			);

			expect(argon2.hash).toHaveBeenCalledWith("newpass123");
			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: {
					email: "updated@example.com",
					passwordHash: "new-hash",
				},
				select: { email: true },
			});
		});

		it("should throw USER_NOT_FOUND when user not exists", async () => {
			prisma.user.findFirst.mockResolvedValue(null);

			await expect(
				service.updateUser({ email: "a@b.com" }, "inexistente"),
			).rejects.toThrow("USER_NOT_FOUND");
		});
	});

	describe("getUser", () => {
		it("should return list of users", async () => {
			const users = [
				{ id: "1", email: "u1@example.com", role: "USER" },
				{ id: "2", email: "u2@example.com", role: "ADMIN" },
			];
			prisma.user.findMany.mockResolvedValue(users);

			const payload: PayloadDto = {
				sub: "admin",
				email: "admin@example.com",
				role: PayloadRole.ADMIN,
				iat: 0,
				exp: 0,
			};

			const result = await service.getUser(payload);

			expect(prisma.user.findMany).toHaveBeenCalledWith({
				select: { id: true, email: true, role: true },
			});
			expect(result).toEqual(users);
		});
	});

	describe("findResetPasswordToken", () => {
		it("should return token when found", async () => {
			const tokenRecord = {
				id: "token-id",
				userId: mockUser.id,
				tokenHash: "hash",
				type: "PASSWORD_RESET",
				expiresAt: BigInt(123),
				sentTo: mockUser.email,
			};
			prisma.userToken.findFirst.mockResolvedValue(tokenRecord);

			const result = await service.findResetPasswordToken(mockUser.id);

			expect(prisma.userToken.findFirst).toHaveBeenCalledWith({
				where: { userId: mockUser.id, type: "PASSWORD_RESET" },
			});
			expect(result).toEqual(tokenRecord);
		});

		it("should throw HttpException when token not found", async () => {
			prisma.userToken.findFirst.mockResolvedValue(null);

			await expect(
				service.findResetPasswordToken("user-id"),
			).rejects.toMatchObject({
				message: "Enviado com sucesso",
				status: HttpStatus.OK,
			});
		});
	});

	describe("saveUserToken", () => {
		it("should create reset token for user", async () => {
			const userDto: UserDto = {
				id: mockUser.id,
				email: mockUser.email,
				role: mockUser.role,
				passwordHash: mockUser.passwordHash,
			};
			const tokenHash = "hashed-token";
			const created = {
				id: "token-id",
				userId: userDto.id,
				tokenHash,
				type: "PASSWORD_RESET",
				sentTo: userDto.email,
				expiresAt: BigInt(Date.now() + 3600000),
			};
			prisma.userToken.create.mockResolvedValue(created);

			const result = await service.saveUserToken(userDto, tokenHash);

			expect(prisma.userToken.create).toHaveBeenCalledWith({
				data: {
					tokenHash,
					type: "PASSWORD_RESET",
					sentTo: userDto.email,
					userId: userDto.id,
					expiresAt: expect.any(Number),
				},
			});
			expect(result).toEqual(created);
		});
	});

	describe("updateUserToken", () => {
		it("should update token and tokenVersion of user", async () => {
			const userDto: UserDto = {
				id: mockUser.id,
				email: mockUser.email,
				role: mockUser.role,
				passwordHash: mockUser.passwordHash,
			};
			const tokenHash = "new-hash";

			await service.updateUserToken(userDto, tokenHash);

			expect(prisma.$transaction).toHaveBeenCalled();
			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: userDto.id },
				data: { tokenVersion: 1 },
			});
			expect(prisma.userToken.update).toHaveBeenCalledWith({
				where: { userId: userDto.id },
				data: {
					tokenHash,
					expiresAt: expect.any(Number),
				},
			});
		});
	});

	describe("verifyUserToken", () => {
		it("should return userId when token exists and is expired (expiresAt <= now)", async () => {
			const now = Date.now();
			prisma.userToken.findFirst.mockResolvedValue({
				expiresAt: now - 1000,
				userId: "user-123",
			});

			const result = await service.verifyUserToken({ token: "token-hash" });

			expect(prisma.userToken.findFirst).toHaveBeenCalledWith({
				where: { tokenHash: "token-hash" },
				select: { expiresAt: true, userId: true },
			});
			expect(result).toBe("user-123");
		});

		it("should throw TOKEN_NOT_FOUND when token not exists", async () => {
			prisma.userToken.findFirst.mockResolvedValue(null);

			await expect(
				service.verifyUserToken({ token: "inexistente" }),
			).rejects.toThrow("TOKEN_NOT_FOUND");
		});

		it("should throw TOKEN_NOT_FOUND when expiresAt is null/undefined", async () => {
			prisma.userToken.findFirst.mockResolvedValue({
				expiresAt: null,
				userId: "user-123",
			});

			await expect(
				service.verifyUserToken({ token: "token-hash" }),
			).rejects.toThrow("TOKEN_NOT_FOUND");
		});

		it("should throw TOKEN_EXPIRED when token is not expired (expiresAt > now)", async () => {
			const now = Date.now();
			prisma.userToken.findFirst.mockResolvedValue({
				expiresAt: now + 3600000,
				userId: "user-123",
			});

			await expect(
				service.verifyUserToken({ token: "token-hash" }),
			).rejects.toThrow("TOKEN_EXPIRED");
		});
	});
});
