import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePhoneNumberDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
