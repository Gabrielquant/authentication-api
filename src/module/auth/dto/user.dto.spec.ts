import { Role } from "@prisma/client";
import { UserDto } from "./user.dto";

describe("UserDto", () => {
	it("should allow creating instance with required fields", () => {
		const dto = new UserDto();
		dto.id = "user-1";
		dto.email = "u@example.com";
		dto.role = Role.USER;
		dto.passwordHash = "hash";

		expect(dto.id).toBe("user-1");
		expect(dto.email).toBe("u@example.com");
		expect(dto.role).toBe(Role.USER);
		expect(dto.passwordHash).toBe("hash");
	});
});
