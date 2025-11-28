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
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './create-book.dto';
import { UpdateBookDto } from './update-book.dto';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  create(@Body() bookData: CreateBookDto) {
    return this.booksService.create(bookData);
  }

  @Get()
  getAll() {
    return this.booksService.getAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.getById(id);
  }

  @Get('author/:authorId')
  getByAuthorId(@Param('authorId', ParseIntPipe) authorId: number) {
    return this.booksService.getByAuthorId(authorId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthenticationGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() bookData: UpdateBookDto,
  ) {
    return this.booksService.update(id, bookData);
  }

  @Post(':bookId/authors/:authorId')
  @UseGuards(JwtAuthenticationGuard)
  addAuthor(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Param('authorId', ParseIntPipe) authorId: number,
  ) {
    return this.booksService.addAuthor(bookId, authorId);
  }

  @Delete(':bookId/authors/:authorId')
  @UseGuards(JwtAuthenticationGuard)
  removeAuthor(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Param('authorId', ParseIntPipe) authorId: number,
  ) {
    return this.booksService.removeAuthor(bookId, authorId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthenticationGuard)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.booksService.delete(id);
  }
}
