import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProfileImagesService } from './profile-images.service';
import { CreateProfileImageDto } from './create-profile-image.dto';
import { UpdateProfileImageDto } from './update-profile-image.dto';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import type { RequestWithUser } from '../authentication/request-with-user';

@Controller('profile-images')
export class ProfileImagesController {
  constructor(private readonly profileImagesService: ProfileImagesService) {}

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  create(
    @Body() profileImageData: CreateProfileImageDto,
    @Req() request: RequestWithUser,
  ) {
    return this.profileImagesService.create(request.user.id, profileImageData);
  }

  @Get('user/:userId')
  getByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.profileImagesService.getByUserId(userId);
  }

  @Get('my-profile-image')
  @UseGuards(JwtAuthenticationGuard)
  getMyProfileImage(@Req() request: RequestWithUser) {
    return this.profileImagesService.getByUserId(request.user.id);
  }

  @Patch()
  @UseGuards(JwtAuthenticationGuard)
  update(
    @Body() profileImageData: UpdateProfileImageDto,
    @Req() request: RequestWithUser,
  ) {
    return this.profileImagesService.update(request.user.id, profileImageData);
  }

  @Delete()
  @UseGuards(JwtAuthenticationGuard)
  delete(@Req() request: RequestWithUser) {
    return this.profileImagesService.delete(request.user.id);
  }
}
