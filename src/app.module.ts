import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AuthenticationModule } from './authentication/authentication.module';
import { CategoriesModule } from './categories/categories.module';
import { ProfileImagesModule } from './profile-images/profile-images.module';
import { CommentsModule } from './comments/comments.module';
import { BooksModule } from './books/books.module';

@Module({
  imports: [
    ArticlesModule,
    AuthenticationModule,
    CategoriesModule,
    ProfileImagesModule,
    CommentsModule,
    BooksModule,
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
