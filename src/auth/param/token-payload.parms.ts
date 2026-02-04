import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { REQUEST_TOKEN_PAYLOAD_NAME } from "../common/auth.constants";

export const TokenPayloadParam = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext) => {
		const context = ctx.switchToHttp();
		const request: Request = context.getRequest();

		return request[REQUEST_TOKEN_PAYLOAD_NAME];
	},
);
