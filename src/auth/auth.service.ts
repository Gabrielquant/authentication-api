import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from '../users/dto/createuser.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private readonly userServices: UsersService) {}

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
      throw new HttpException('Tente outro email.', HttpStatus.CONFLICT);
    }
  }
}
