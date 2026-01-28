import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from '../users/dto/createuser.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { PayloadDto } from './dto/payload.dto';
import { UserDto } from './dto/user.dto';
import * as fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userServices: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await argon2.hash(createUserDto.password);

      const newUser = await this.userServices.createUser({
        email: createUserDto.email,
        password: hashedPassword,
      });

      return newUser;
    } catch (error) {
      console.log(error);
      throw new HttpException('Credenciais Invalidas', HttpStatus.CONFLICT);
    }
  }

  async generateJwt(loginDto: LoginDto) {
    try {
      const user = await this.userServices.findOne(loginDto.email);

      const passwordValid = await argon2.verify(
        user.passwordHash,
        loginDto.password,
      );

      const { accessToken, refreshToken } = await this.getTokens(user);

      if (!passwordValid) {
        throw new HttpException(
          'Credenciais invalidas',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        sub: user.id,
        email: user.email,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('Tente outro email.', HttpStatus.CONFLICT);
    }
  }

  async isValid(payLoad: PayloadDto) {
    const findUser = await this.userServices.findOne(payLoad.email);

    return findUser;
  }

  async getTokens(userDto: UserDto) {
    const jti = randomUUID();

    const payload = {
      sub: userDto.id,
      email: userDto.email,
      role: userDto.role,
    };

    const accessToken = await this.jwtService.signAsync(
      { ...payload, type: 'access' },
      {
        algorithm: 'RS256',
        expiresIn: '15m',
        privateKey: fs.readFileSync(
          path.resolve(process.cwd(), 'keys', 'private.pem'),
        ),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh', jti },
      {
        algorithm: 'RS256',
        expiresIn: '7d',
        privateKey: fs.readFileSync(
          path.resolve(process.cwd(), 'keys', 'private-refresh.pem'),
        ),
      },
    );

    return { accessToken, refreshToken, jti };
  }

  async refreshTokens(userEmail: string) {
    const user = await this.userServices.findOne(userEmail);

    const tokens = await this.getTokens(user);

    return tokens;
  }
}
