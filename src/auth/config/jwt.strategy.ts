import * as fs from "node:fs";
import * as path from "node:path";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { PayloadDto } from "../dto/payload.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		@Inject(forwardRef(() => AuthService))
		private authService: AuthService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: fs.readFileSync(
				path.resolve(process.cwd(), "keys", "public.pem"),
				"utf8",
			),
			algorithms: ["RS256"],
		});
	}

	async validate(payLoad: PayloadDto) {
		const user = await this.authService.isValid(payLoad);
		return { userId: user.id, email: user.email };
	}
}
