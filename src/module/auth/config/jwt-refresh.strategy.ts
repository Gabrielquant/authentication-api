import * as fs from "node:fs";
import * as path from "node:path";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { PayloadDto } from "../dto/payload.dto";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
	Strategy,
	"jwt-refresh",
) {
	constructor(_authService: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: fs.readFileSync(
				path.resolve(process.cwd(), "keys", "public-refresh.pem"),
			),
			algorithms: ["RS256"],
			passReqToCallback: true,
		});
	}

	async validate(req: Request, payload: PayloadDto) {
		const refreshToken = req.headers.authorization?.split(" ")[1];
		return { ...payload, refreshToken };
	}
}
