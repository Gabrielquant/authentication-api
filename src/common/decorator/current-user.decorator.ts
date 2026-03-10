import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export function getCurrentUserFromContext(
	data: string | undefined,
	ctx: ExecutionContext,
) {
	const request = ctx.switchToHttp().getRequest();
	return data ? request.user[data] : request.user;
}

export const CurrentUser = createParamDecorator(getCurrentUserFromContext);
