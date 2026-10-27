import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class ClippingSuggestDto {
  @ValidateIf((o) => !o.mediaId)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  url?: string;

  @ValidateIf((o) => !o.url)
  @IsString()
  mediaId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  integrations?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  clips?: number;

  @IsOptional()
  @IsIn(['crop', 'blur'])
  fit?: 'crop' | 'blur';
}
