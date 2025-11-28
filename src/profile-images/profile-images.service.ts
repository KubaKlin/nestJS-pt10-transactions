import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProfileImageDto } from './create-profile-image.dto';
import { UpdateProfileImageDto } from './update-profile-image.dto';
import { Prisma } from '../../generated/prisma';
import { PrismaError } from '../database/prisma-error.enum';
import { ProfileImageNotFoundException } from './profile-image-not-found.exception';

@Injectable()
export class ProfileImagesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: number, profileImageData: CreateProfileImageDto) {
    try {
      return await this.prismaService.profileImage.create({
        data: {
          url: profileImageData.url,
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintFailed
      ) {
        throw new ConflictException(
          'Profile image already exists for this user',
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async getByUserId(userId: number) {
    const profileImage = await this.prismaService.profileImage.findUnique({
      where: {
        userId,
      },
    });
    if (!profileImage) {
      throw new ProfileImageNotFoundException(userId);
    }
    return profileImage;
  }

  async update(userId: number, profileImageData: UpdateProfileImageDto) {
    try {
      return await this.prismaService.profileImage.update({
        where: {
          userId,
        },
        data: {
          url: profileImageData.url,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ProfileImageNotFoundException(userId);
      }
      throw error;
    }
  }

  async delete(userId: number) {
    try {
      return await this.prismaService.profileImage.delete({
        where: {
          userId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ProfileImageNotFoundException(userId);
      }
      throw error;
    }
  }
}
