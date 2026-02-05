import * as fs from "node:fs";
import path from "node:path";
import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth.module";
import { JwtRefreshStrategy } from "../config/jwt-refresh.strategy";

@Module({
	imports: [
		JwtModule.register({
			privateKey: fs.readFileSync(
				path.resolve(process.cwd(), "keys", "private-refresh.pem"),
			),
			publicKey: fs.readFileSync(
				path.resolve(process.cwd(), "keys", "public-refresh.pem"),
			),
			signOptions: { algorithm: "RS256", expiresIn: "7d" },
		}),
		forwardRef(() => AuthModule),
	],
	providers: [JwtRefreshStrategy],
	exports: [JwtModule],
})
export class AuthRefreshModule {}
