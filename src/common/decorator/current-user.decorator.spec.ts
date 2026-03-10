import { ExecutionContext } from "@nestjs/common";
import {
	CurrentUser,
	getCurrentUserFromContext,
} from "./current-user.decorator";

describe("CurrentUser decorator", () => {
	const user = { id: "user-1", email: "u@example.com", role: "USER" };

	const createContext = (request: { user: typeof user }): ExecutionContext =>
		({
			switchToHttp: () => ({ getRequest: () => request }),
		}) as unknown as ExecutionContext;

	it("CurrentUser should be defined", () => {
		expect(CurrentUser).toBeDefined();
	});

	it("getCurrentUserFromContext should return full user when data is undefined", () => {
		const ctx = createContext({ user });

		const result = getCurrentUserFromContext(undefined, ctx);

		expect(result).toEqual(user);
	});

	it("getCurrentUserFromContext should return user[data] when data is provided", () => {
		const ctx = createContext({ user });

		expect(getCurrentUserFromContext("email", ctx)).toBe("u@example.com");
		expect(getCurrentUserFromContext("id", ctx)).toBe("user-1");
		expect(getCurrentUserFromContext("role", ctx)).toBe("USER");
	});
});
