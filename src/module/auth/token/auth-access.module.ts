import * as fs from "node:fs";
import path from "node:path";
import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth.module";
import { JwtStrategy } from "../config/jwt.strategy";

@Module({
	imports: [
		JwtModule.register({
			privateKey: fs.readFileSync(
				path.resolve(process.cwd(), "keys", "private.pem"),
			),
			publicKey: fs.readFileSync(
				path.resolve(process.cwd(), "keys", "public.pem"),
			),
			signOptions: { algorithm: "RS256", expiresIn: "15m" },
		}),
		forwardRef(() => AuthModule),
	],
	providers: [JwtStrategy],
	exports: [JwtModule],
})
export class AuthAccessModule {}
