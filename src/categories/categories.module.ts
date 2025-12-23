import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import CategoriesController from './categories.controller';
import { DatabaseModule } from '../database/database.module';
import { CategoriesMergeController } from './categories-merge.controller';
import { CategoriesMergeService } from './categories-merge.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoriesController, CategoriesMergeController],
  providers: [CategoriesService, CategoriesMergeService],
})
export class CategoriesModule {}
