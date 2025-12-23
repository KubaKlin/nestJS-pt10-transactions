import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ArticleDto } from './article.dto';
import { Prisma } from '../../generated/prisma';
import { PrismaError } from '../database/prisma-error.enum';
import { ArticleNotFoundException } from './article-not-fount.exception';
import { CreateArticleDto } from './create-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(article: CreateArticleDto, authorId: number) {
    const categories = article.categoryIds?.map((id) => {
      return {
        id,
      };
    });

    try {
      return await this.prismaService.article.create({
        data: {
          title: article.title,
          text: article.text,
          author: {
            connect: {
              id: authorId,
            },
          },
          categories: {
            connect: categories,
          },
        },
        include: {
          categories: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new BadRequestException('Wrong category id provided');
      }
      throw error;
    }
  }

  getAll() {
    return this.prismaService.article.findMany();
  }

  async getById(id: number) {
    const article = await this.prismaService.article.findUnique({
      where: {
        id,
      },
      include: {
        author: true,
        categories: true,
      },
    });
    if (!article) {
      throw new ArticleNotFoundException(id);
    }
    return article;
  }

  async delete(id: number) {
    try {
      return await this.prismaService.article.delete({
        where: {
          id,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ArticleNotFoundException(id);
      }
      throw error;
    }
  }

  async update(id: number, article: ArticleDto) {
    try {
      return await this.prismaService.article.update({
        data: {
          ...article,
          id: undefined,
        },
        where: {
          id,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ArticleNotFoundException(id);
      }
      throw error;
    }
  }

  async upvote(id: number) {
    try {
      return await this.prismaService.article.update({
        where: {
          id,
        },
        data: {
          upvotes: {
            increment: 1,
          },
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ArticleNotFoundException(id);
      }
      throw error;
    }
  }

  async downvote(id: number) {
    try {
      return await this.prismaService.$transaction(async (transactionClient) => {
        const article = await transactionClient.article.findUnique({
          where: {
            id,
          },
        });

        if (!article) {
          throw new ArticleNotFoundException(id);
        }

        return await transactionClient.article.update({
          where: {
            id,
          },
          data: {
            upvotes: {
              decrement: article.upvotes > 0 ? 1 : 0,
            },
          },
        });
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ArticleNotFoundException(id);
      }
      throw error;
    }
  }

  async deleteByUpvotesFewerThan(upvotesThreshold: number) {
    return await this.prismaService.$transaction(async (transactionClient) => {
      const articlesToDelete = await transactionClient.article.findMany({
        where: {
          upvotes: {
            lt: upvotesThreshold,
          },
        },
        select: {
          id: true,
        },
      });

      if (articlesToDelete.length === 0) {
        throw new NotFoundException(
          `No articles found with upvotes fewer than ${upvotesThreshold}`,
        );
      }

      const result = await transactionClient.article.deleteMany({
        where: {
          upvotes: {
            lt: upvotesThreshold,
          },
        },
      });

      return {
        deletedCount: result.count,
        message: `Successfully deleted ${result.count} article(s) with upvotes fewer than ${upvotesThreshold}`,
      };
    });
  }

  async reassignArticles(previousAuthorId: number, newAuthorId: number) {
    return await this.prismaService.$transaction(async (transactionClient) => {
      const previousAuthor = await transactionClient.user.findUnique({
        where: {
          id: previousAuthorId,
        },
      });

      if (!previousAuthor) {
        throw new NotFoundException(
          `Previous author with id ${previousAuthorId} not found`,
        );
      }

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

      const result = await transactionClient.article.updateMany({
        where: {
          authorId: previousAuthorId,
        },
        data: {
          authorId: newAuthorId,
        },
      });

      return {
        reassignedCount: result.count,
        message: `Successfully reassigned ${result.count} article(s) from author ${previousAuthorId} to author ${newAuthorId}`,
      };
    });
  }
}
