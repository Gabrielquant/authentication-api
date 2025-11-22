import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/createuser.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto, role: Role = 'USER') {
    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          passwordHash: createUserDto.password,
          role: role,
        },
      });

      return newUser;
    } catch (error) {
      console.log(error);

      throw new HttpException('Tente outro email.', HttpStatus.CONFLICT);
    }
  }
}
