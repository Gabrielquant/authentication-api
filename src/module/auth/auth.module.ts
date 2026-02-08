import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "src/module/users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./config/jwt.strategy";
import { JwtRefreshStrategy } from "./config/jwt-refresh.strategy";
import { AuthAccessModule } from "./token/auth-access.module";
import { AuthRefreshModule } from "./token/auth-refresh.module";

@Module({
	imports: [UsersModule, PassportModule, AuthAccessModule, AuthRefreshModule,],
	providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
