import {
  IsDefined,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  currentPassword?: string;

  @IsString()
  @IsDefined()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
