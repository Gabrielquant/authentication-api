import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as fs from 'fs';
import * as path from 'path';
import { AuthService } from '../auth.service';
import { PayloadDto } from '../dto/payload.dto';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: fs.readFileSync(
        path.resolve(process.cwd(), 'keys', 'public-refresh.pem'),
      ),
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: PayloadDto) {
    console.log('refresh-guard');
    const refreshToken = req.headers.authorization?.split(' ')[1];
    return { ...payload, refreshToken };
  }
}
