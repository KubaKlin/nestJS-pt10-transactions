import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { DatabaseModule } from '../database/database.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [DatabaseModule, CommentsModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
