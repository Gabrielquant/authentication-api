import { Test, TestingModule } from "@nestjs/testing";
import { Request } from "express";
import { AuthService } from "../auth.service";
import { PayloadDto, Role } from "../dto/payload.dto";
import { JwtRefreshStrategy } from "./jwt-refresh.strategy";

jest.mock("../../../jobs/mail/mail.service", () => ({
	sendEmail: jest.fn(),
}));

jest.mock("node:fs", () => ({
	...jest.requireActual("node:fs"),
	readFileSync: jest.fn(() => "mock-refresh-public-key"),
}));

describe("JwtRefreshStrategy", () => {
	let strategy: JwtRefreshStrategy;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [JwtRefreshStrategy, { provide: AuthService, useValue: {} }],
		}).compile();

		strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
		jest.clearAllMocks();
	});

	it("should be defined", () => {
		expect(strategy).toBeDefined();
	});

	it("validate should return payload with refreshToken from header", async () => {
		const payload: PayloadDto = {
			sub: "user-id",
			email: "u@example.com",
			role: Role.USER,
			iat: 0,
			exp: 0,
		};
		const req = {
			headers: { authorization: "Bearer my-refresh-token" },
		} as Request;

		const result = await strategy.validate(req, payload);

		expect(result).toEqual({
			...payload,
			refreshToken: "my-refresh-token",
		});
	});

	it("validate should handle missing authorization header", async () => {
		const payload: PayloadDto = {
			sub: "user-id",
			email: "u@example.com",
			role: Role.USER,
			iat: 0,
			exp: 0,
		};
		const req = { headers: {} } as Request;

		const result = await strategy.validate(req, payload);

		expect(result).toEqual({
			...payload,
			refreshToken: undefined,
		});
	});
});
