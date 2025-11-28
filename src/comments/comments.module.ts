import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
