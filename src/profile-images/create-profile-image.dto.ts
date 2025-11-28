import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateProfileImageDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
