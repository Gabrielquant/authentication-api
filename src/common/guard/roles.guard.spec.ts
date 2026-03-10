import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../module/auth/dto/payload.dto";
import { ROLES_KEY } from "../decorator/roles.decorator";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
	let guard: RolesGuard;
	let reflector: jest.Mocked<Reflector>;

	beforeEach(() => {
		reflector = {
			getAllAndOverride: jest.fn(),
		} as unknown as jest.Mocked<Reflector>;
		guard = new RolesGuard(reflector);
	});

	const createMockContext = (user: { role: Role } | undefined) => {
		return {
			switchToHttp: () => ({
				getRequest: () => ({ user }),
			}),
			getHandler: () => ({}),
			getClass: () => ({}),
		} as unknown as ExecutionContext;
	};

	it("should allow when no roles are required", () => {
		reflector.getAllAndOverride.mockReturnValue(undefined);

		const result = guard.canActivate(createMockContext(undefined));

		expect(result).toBe(true);
	});

	it("should allow when requiredRoles is empty array", () => {
		reflector.getAllAndOverride.mockReturnValue([]);

		const result = guard.canActivate(
			createMockContext({ role: Role.USER }),
		);

		expect(result).toBe(true);
	});

	it("should allow when user role is in required roles", () => {
		reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.USER]);

		const result = guard.canActivate(
			createMockContext({ role: Role.ADMIN }),
		);

		expect(result).toBe(true);
	});

	it("should deny when user role is not in required roles", () => {
		reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

		const result = guard.canActivate(
			createMockContext({ role: Role.USER }),
		);

		expect(result).toBe(false);
	});

	it("should use ROLES_KEY for reflector", () => {
		reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

		guard.canActivate(createMockContext({ role: Role.ADMIN }));

		expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
			expect.anything(),
			expect.anything(),
		]);
	});
});
