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

  async deleteCurrentUser(userId: number, newAuthorId?: number) {
    return await this.prismaService.$transaction(async (transactionClient) => {
      const user = await transactionClient.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      if (newAuthorId !== undefined) {
        const newAuthor = await transactionClient.user.findUnique({
          where: {
            id: newAuthorId,
          },
        });

        if (!newAuthor) {
          throw new NotFoundException(
            `New author with id ${newAuthorId} not found`,
          );
        }

        const reassignResult = await transactionClient.article.updateMany({
          where: {
            authorId: userId,
          },
          data: {
            authorId: newAuthorId,
          },
        });

        await transactionClient.user.delete({
          where: {
            id: userId,
          },
        });

        return {
          message: `User ${userId} deleted successfully. ${reassignResult.count} article(s) reassigned to author ${newAuthorId}`,
          reassignedArticles: reassignResult.count,
        };
      } else {
        const deleteArticlesResult = await transactionClient.article.deleteMany(
          {
            where: {
              authorId: userId,
            },
          },
        );

        await transactionClient.user.delete({
          where: {
            id: userId,
          },
        });

        return {
          message: `User ${userId} deleted successfully. ${deleteArticlesResult.count} article(s) deleted`,
          deletedArticles: deleteArticlesResult.count,
        };
      }
    });
  }
}
