import { Controller, Patch } from '@nestjs/common';
import { CategoriesMergeService } from './categories-merge.service';

@Controller('categories-merge')
export class CategoriesMergeController {
  constructor(
    private readonly categoriesMergeService: CategoriesMergeService,
  ) {}

  @Patch()
  mergeDuplicateCategories() {
    return this.categoriesMergeService.mergeDuplicateCategories();
  }
}
