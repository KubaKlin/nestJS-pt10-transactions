import { NotFoundException } from '@nestjs/common';

export class ArticleNotFoundException extends NotFoundException {
  constructor(articleID: number) {
    super(`Article with ID ${articleID} not found`);
  }
}
