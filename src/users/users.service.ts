import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaError } from '../database/prisma-error.enum';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../database/prisma.service';
import { UserDto } from './user.dto';
import { UpdatePhoneNumberDto } from './update-phone-number.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: {
        articles: true,
      },
    });
    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async getById(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        articles: true,
      },
    });
    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async create(user: UserDto) {
    try {
      return await this.prismaService.user.create({
        data: user,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintFailed
      ) {
        throw new ConflictException('User with that email already exists');
      }
      throw error;
    }
  }

  async updatePhoneNumber(
    userId: number,
    updatePhoneNumberDto: UpdatePhoneNumberDto,
  ) {
    return await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        phoneNumber: updatePhoneNumberDto.phoneNumber,
      },
    });
  }
}
