import { Module } from "@nestjs/common";
import { AuthModule } from "src/module/auth/auth.module";
import { UsersModule } from "src/module/users/users.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [UsersModule, AuthModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
