import { MediaDto } from '@gitroom/nestjs-libraries/dtos/media/media.dto';
import {
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserDetailDto {
  @IsString()
  @MinLength(3)
  fullname: string;

  @IsString()
  @IsOptional()
  bio: string;

  @IsOptional()
  @Type(() => MediaDto)
  @ValidateNested()
  picture: MediaDto;
}
