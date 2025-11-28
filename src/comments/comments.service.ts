import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCommentDto } from './create-comment.dto';
import { UpdateCommentDto } from './update-comment.dto';
import { Prisma } from '../../generated/prisma';
import { PrismaError } from '../database/prisma-error.enum';
import { CommentNotFoundException } from './comment-not-found.exception';

@Injectable()
export class CommentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(commentData: CreateCommentDto & { articleId: number }) {
    try {
      return await this.prismaService.comment.create({
        data: {
          content: commentData.content,
          article: {
            connect: {
              id: commentData.articleId,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new BadRequestException('Article not found');
      }
      throw error;
    }
  }

  async getByArticleId(articleId: number) {
    return this.prismaService.comment.findMany({
      where: {
        articleId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: number, commentData: UpdateCommentDto) {
    try {
      return await this.prismaService.comment.update({
        where: {
          id,
        },
        data: {
          content: commentData.content,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new CommentNotFoundException(id);
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      return await this.prismaService.comment.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new CommentNotFoundException(id);
      }
      throw error;
    }
  }
}
