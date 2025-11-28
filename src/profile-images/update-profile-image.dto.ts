import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateProfileImageDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
