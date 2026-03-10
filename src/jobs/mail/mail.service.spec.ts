import { HttpStatus } from "@nestjs/common";
import { sendEmail } from "./mail.service";

declare global {
	// eslint-disable-next-line no-var
	var __resendSendMock: jest.Mock;
}

jest.mock("resend", () => {
	const sendFn = jest.fn();
	global.__resendSendMock = sendFn;
	return {
		Resend: jest.fn().mockImplementation(() => ({
			emails: { send: sendFn },
		})),
	};
});

describe("mail.service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("should send email and return success message", async () => {
		global.__resendSendMock.mockResolvedValue({
			data: { id: "1" },
			error: null,
		});

		const result = await sendEmail("user@example.com");

		expect(global.__resendSendMock).toHaveBeenCalledWith({
			from: "Acme <onboarding@resend.dev>",
			to: ["user@example.com"],
			subject: "Hello World",
			html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
		});
		expect(result).toEqual({ message: "Email enviado com sucesso" });
	});

	it("should throw HttpException on error", async () => {
		global.__resendSendMock.mockRejectedValue(new Error("API error"));

		await expect(sendEmail("user@example.com")).rejects.toMatchObject({
			message: "Credenciais invalidas.",
			status: HttpStatus.CONFLICT,
		});
	});
});
