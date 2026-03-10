import { validate } from "class-validator";
import { NewUserPasswordDto } from "./new-user-password.dto";

describe("NewUserPasswordDto", () => {
	it("should pass with valid password (min 8 chars)", async () => {
		const dto = new NewUserPasswordDto();
		dto.password = "password123";

		const errors = await validate(dto);
		expect(errors).toHaveLength(0);
	});

	it("should fail when password is too short", async () => {
		const dto = new NewUserPasswordDto();
		dto.password = "short";

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});
});
