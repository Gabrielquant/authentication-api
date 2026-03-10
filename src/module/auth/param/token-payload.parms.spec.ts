import { ExecutionContext } from "@nestjs/common";
import { REQUEST_TOKEN_PAYLOAD_NAME } from "../../../common/constants/auth.constants";
import {
	getTokenPayloadFromContext,
	TokenPayloadParam,
} from "./token-payload.parms";

describe("TokenPayloadParam", () => {
	it("TokenPayloadParam should be defined", () => {
		expect(TokenPayloadParam).toBeDefined();
	});

	it("getTokenPayloadFromContext should return request[REQUEST_TOKEN_PAYLOAD_NAME]", () => {
		const payload = { sub: "id", email: "a@b.com" };
		const request = { [REQUEST_TOKEN_PAYLOAD_NAME]: payload };
		const ctx = {
			switchToHttp: () => ({ getRequest: () => request }),
		} as unknown as ExecutionContext;

		const result = getTokenPayloadFromContext(undefined, ctx);

		expect(result).toEqual(payload);
	});
});
