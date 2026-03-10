import { createHash, randomBytes } from "node:crypto";
import {
	generateRawToken,
	generateTokenExpires,
	hashToken,
	newUserToken,
} from "./token.util";

jest.mock("node:crypto", () => ({
	createHash: jest.fn(),
	randomBytes: jest.fn(),
}));

describe("token.util", () => {
	const mockDigest = jest.fn();
	const mockUpdate = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(createHash).mockReturnValue({
			update: mockUpdate.mockReturnThis(),
			digest: mockDigest.mockReturnValue("hashed-hex"),
		} as never);
	});

	describe("generateRawToken", () => {
		it("should return hex string from randomBytes", () => {
			const buf = Buffer.alloc(32, "a");
			jest.mocked(randomBytes).mockReturnValue(buf as never);

			const result = generateRawToken();

			expect(randomBytes).toHaveBeenCalledWith(32);
			expect(typeof result).toBe("string");
			expect(result).toMatch(/^[0-9a-f]+$/);
		});
	});

	describe("hashToken", () => {
		it("should hash token with TOKEN_PEPPER", () => {
			const env = process.env.TOKEN_PEPPER;
			process.env.TOKEN_PEPPER = "pepper";

			hashToken("raw-token");

			expect(createHash).toHaveBeenCalledWith("sha256");
			expect(mockUpdate).toHaveBeenCalledWith("raw-tokenpepper");
			expect(mockDigest).toHaveBeenCalledWith("hex");

			process.env.TOKEN_PEPPER = env;
		});

		it("should throw when TOKEN_PEPPER is not defined", () => {
			const env = process.env.TOKEN_PEPPER;
			delete process.env.TOKEN_PEPPER;

			expect(() => hashToken("raw")).toThrow("TOKEN_PEPPER not defined");

			process.env.TOKEN_PEPPER = env;
		});
	});

	describe("newUserToken", () => {
		it("should return hashed token", () => {
			jest.mocked(randomBytes).mockReturnValue(Buffer.from("x") as never);
			const env = process.env.TOKEN_PEPPER;
			process.env.TOKEN_PEPPER = "p";

			const result = newUserToken();

			expect(result).toBe("hashed-hex");

			process.env.TOKEN_PEPPER = env;
		});
	});

	describe("generateTokenExpires", () => {
		it("should return Date.now() + TTL when RESET_PASSWORD_TOKEN_TTL_MIN is set", () => {
			const env = process.env.RESET_PASSWORD_TOKEN_TTL_MIN;
			process.env.RESET_PASSWORD_TOKEN_TTL_MIN = "60";
			const now = 1000000;
			jest.spyOn(Date, "now").mockReturnValue(now);

			const result = generateTokenExpires();

			expect(result).toBe(now + 60);

			process.env.RESET_PASSWORD_TOKEN_TTL_MIN = env;
			jest.restoreAllMocks();
		});

		it("should throw when RESET_PASSWORD_TOKEN_TTL_MIN is missing", () => {
			const env = process.env.RESET_PASSWORD_TOKEN_TTL_MIN;
			delete process.env.RESET_PASSWORD_TOKEN_TTL_MIN;

			expect(() => generateTokenExpires()).toThrow(
				"Missing required environment variable: RESET_PASSWORD_TOKEN_TTL_MIN",
			);

			process.env.RESET_PASSWORD_TOKEN_TTL_MIN = env;
		});
	});
});
