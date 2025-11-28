import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CanBeUndefined } from '../utilities/can-be-undefined';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  text: string;

  @CanBeUndefined()
  @IsNumber({}, { each: true })
  categoryIds?: number[];
}
