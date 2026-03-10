import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { PayloadDto, Role } from "../dto/payload.dto";
import { JwtStrategy } from "./jwt.strategy";

jest.mock("../../../jobs/mail/mail.service", () => ({
	sendEmail: jest.fn(),
}));

jest.mock("node:fs", () => ({
	...jest.requireActual("node:fs"),
	readFileSync: jest.fn(() => "mock-public-key"),
}));

describe("JwtStrategy", () => {
	let strategy: JwtStrategy;
	let authService: jest.Mocked<AuthService>;

	beforeEach(async () => {
		const mockAuthService = {
			isValid: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtStrategy,
				{ provide: AuthService, useValue: mockAuthService },
			],
		}).compile();

		strategy = module.get<JwtStrategy>(JwtStrategy);
		authService = module.get(AuthService);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(strategy).toBeDefined();
	});

	it("validate should return user from authService.isValid", async () => {
		const payload: PayloadDto = {
			sub: "user-id",
			email: "u@example.com",
			role: Role.USER,
			iat: 0,
			exp: 0,
		};
		const user = {
			id: "user-id",
			email: "u@example.com",
			role: Role.USER,
			passwordHash: "hash",
		};
		authService.isValid.mockResolvedValue(user);

		const result = await strategy.validate(payload);

		expect(authService.isValid).toHaveBeenCalledWith(payload);
		expect(result).toEqual({
			sub: user.id,
			email: user.email,
			role: user.role,
		});
	});
});
