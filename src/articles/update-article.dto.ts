import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CanBeUndefined } from '../utilities/can-be-undefined';

export class UpdateArticleDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  @CanBeUndefined()
  title: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  @CanBeUndefined()
  text: string;
}
