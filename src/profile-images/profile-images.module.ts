import { Module } from '@nestjs/common';
import { ProfileImagesController } from './profile-images.controller';
import { ProfileImagesService } from './profile-images.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProfileImagesController],
  providers: [ProfileImagesService],
  exports: [ProfileImagesService],
})
export class ProfileImagesModule {}
