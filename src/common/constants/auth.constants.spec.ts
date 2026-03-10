import { REQUEST_TOKEN_PAYLOAD_NAME } from "./auth.constants";

describe("auth.constants", () => {
	it("REQUEST_TOKEN_PAYLOAD_NAME should be token_payload", () => {
		expect(REQUEST_TOKEN_PAYLOAD_NAME).toBe("token_payload");
	});
});
