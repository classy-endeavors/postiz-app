import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReplyProfileDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  fullVideoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
