import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { REQUEST_TOKEN_PAYLOAD_NAME } from "../../../common/constants/auth.constants";

export function getTokenPayloadFromContext(
	_data: unknown,
	ctx: ExecutionContext,
) {
	const context = ctx.switchToHttp();
	const request: Request = context.getRequest();
	return request[REQUEST_TOKEN_PAYLOAD_NAME];
}

export const TokenPayloadParam = createParamDecorator(getTokenPayloadFromContext);
