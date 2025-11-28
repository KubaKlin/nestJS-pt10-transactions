import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookDto } from './create-book.dto';
import { UpdateBookDto } from './update-book.dto';
import { Prisma } from '../../generated/prisma';
import { PrismaError } from '../database/prisma-error.enum';
import { BookNotFoundException } from './book-not-found.exception';

@Injectable()
export class BooksService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(bookData: CreateBookDto) {
    const authors = bookData.authorIds?.map((id) => {
      return {
        id,
      };
    });

    try {
      return await this.prismaService.book.create({
        data: {
          title: bookData.title,
          description: bookData.description,
          authors: {
            connect: authors,
          },
        },
        include: {
          authors: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new BadRequestException('Wrong author id provided');
      }
      throw error;
    }
  }

  async getAll() {
    return this.prismaService.book.findMany({
      include: {
        authors: true,
      },
    });
  }

  async getById(id: number) {
    const book = await this.prismaService.book.findUnique({
      where: {
        id,
      },
      include: {
        authors: true,
      },
    });
    if (!book) {
      throw new BookNotFoundException(id);
    }
    return book;
  }

  async getByAuthorId(authorId: number) {
    return this.prismaService.book.findMany({
      where: {
        authors: {
          some: {
            id: authorId,
          },
        },
      },
      include: {
        authors: true,
      },
    });
  }

  async update(id: number, bookData: UpdateBookDto) {
    const updateData: Prisma.BookUpdateInput = {
      title: bookData.title,
      description: bookData.description,
    };

    if (bookData.authorIds !== undefined) {
      const authors = bookData.authorIds.map((authorId) => ({ id: authorId }));
      updateData.authors = {
        set: authors,
      };
    }

    try {
      return await this.prismaService.book.update({
        where: {
          id,
        },
        data: updateData,
        include: {
          authors: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new BookNotFoundException(id);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new BadRequestException('Wrong author id provided');
      }
      throw error;
    }
  }

  async addAuthor(bookId: number, authorId: number) {
    try {
      return await this.prismaService.book.update({
        where: {
          id: bookId,
        },
        data: {
          authors: {
            connect: {
              id: authorId,
            },
          },
        },
        include: {
          authors: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new BookNotFoundException(bookId);
      }
      throw error;
    }
  }

  async removeAuthor(bookId: number, authorId: number) {
    try {
      return await this.prismaService.book.update({
        where: {
          id: bookId,
        },
        data: {
          authors: {
            disconnect: {
              id: authorId,
            },
          },
        },
        include: {
          authors: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new BookNotFoundException(bookId);
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      return await this.prismaService.book.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new BookNotFoundException(id);
      }
      throw error;
    }
  }
}
