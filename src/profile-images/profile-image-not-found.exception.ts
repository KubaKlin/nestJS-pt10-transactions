import { NotFoundException } from '@nestjs/common';

export class ProfileImageNotFoundException extends NotFoundException {
  constructor(userId: number) {
    super(`Profile image for user with id ${userId} not found`);
  }
}
