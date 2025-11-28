import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdatePhoneNumberDto } from './update-phone-number.dto';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import type { RequestWithUser } from '../authentication/request-with-user';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('phone-number')
  @UseGuards(JwtAuthenticationGuard)
  async updatePhoneNumber(
    @Body() updatePhoneNumberDto: UpdatePhoneNumberDto,
    @Req() request: RequestWithUser,
  ) {
    return this.usersService.updatePhoneNumber(
      request.user.id,
      updatePhoneNumberDto,
    );
  }
}
