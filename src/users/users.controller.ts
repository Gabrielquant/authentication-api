import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/updateuser.dto';
import { JwtAuthGuard } from 'src/auth/guard/auth-access-token.guard';
import { CurrentUser } from 'src/auth/param/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('update')
  updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.userService.updateUser(updateUserDto, userId);
  }
}
