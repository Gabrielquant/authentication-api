import {
  Body,
  Controller,
  Post,
  Request,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/createuser.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guard/auth-access-token.guard';
import { JwtRefreshGuard } from './guard/auth-refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  logIn(@Body() logInDto: LoginDto) {
    return this.authService.generateJwt(logInDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  test(@Request() req) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  refresh(@Req() req) {
    return this.authService.refreshTokens(req.user.email);
  }
}
