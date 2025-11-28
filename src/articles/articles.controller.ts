import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './create-article.dto';
import { UpdateArticleDto } from './update-article.dto';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import type { RequestWithUser } from '../authentication/request-with-user';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/create-comment.dto';
import { UpdateCommentDto } from '../comments/update-comment.dto';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  create(@Body() article: CreateArticleDto, @Req() request: RequestWithUser) {
    return this.articlesService.create(article, request.user.id);
  }

  @Get()
  getAll() {
    return this.articlesService.getAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.getById(id);
  }

  @Delete()
  deleteByUpvotes(@Query('upvotesFewerThan', ParseIntPipe) upvotesFewerThan: number) {
    return this.articlesService.deleteByUpvotesFewerThan(upvotesFewerThan);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.articlesService.delete(id);
  }

  @Patch()
  reassignArticles(
    @Query('previousAuthor', ParseIntPipe) previousAuthor: number,
    @Query('newAuthor', ParseIntPipe) newAuthor: number,
  ) {
    return this.articlesService.reassignArticles(previousAuthor, newAuthor);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() article: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, article);
  }

  @Get(':articleId/comments')
  getComments(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.commentsService.getByArticleId(articleId);
  }

  @Post(':articleId/comments')
  @UseGuards(JwtAuthenticationGuard)
  createComment(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() commentData: CreateCommentDto,
  ) {
    return this.commentsService.create({ ...commentData, articleId });
  }

  @Patch(':articleId/comments/:commentId')
  @UseGuards(JwtAuthenticationGuard)
  updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() commentData: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, commentData);
  }

  @Delete(':articleId/comments/:commentId')
  @UseGuards(JwtAuthenticationGuard)
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    await this.commentsService.delete(commentId);
  }

  @Patch(':id/upvote')
  upvote(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.upvote(id);
  }

  @Patch(':id/downvote')
  downvote(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.downvote(id);
  }
}
