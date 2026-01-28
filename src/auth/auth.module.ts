import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './config/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtRefreshStrategy } from './config/jwt-refresh.strategy';
import { AuthAccessModule } from './token/auth-access.module';
import { AuthRefreshModule } from './token/auth-refresh.module';

@Module({
  imports: [UsersModule, PassportModule, AuthAccessModule, AuthRefreshModule],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
