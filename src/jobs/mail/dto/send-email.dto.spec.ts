import { SendEmailDto } from "./send-email.dto";

describe("SendEmailDto", () => {
	it("should allow creating instance with fields", () => {
		const dto = new SendEmailDto();
		dto.toSend = "user@example.com";
		dto.subject = "Test";
		dto.html = "<p>Hello</p>";

		expect(dto.toSend).toBe("user@example.com");
		expect(dto.subject).toBe("Test");
		expect(dto.html).toBe("<p>Hello</p>");
	});
});
