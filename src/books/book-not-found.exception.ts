import { NotFoundException } from '@nestjs/common';

export class BookNotFoundException extends NotFoundException {
  constructor(id: number) {
    super(`Book with id ${id} not found`);
  }
}
