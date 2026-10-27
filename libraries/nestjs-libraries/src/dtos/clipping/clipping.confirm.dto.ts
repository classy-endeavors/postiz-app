import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClippingCaptionOverrideDto {
  @IsString()
  clipId: string;

  @IsString()
  integrationId: string;

  @IsString()
  content: string;
}

export class ClippingConfirmDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  clipIds: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ClippingCaptionOverrideDto)
  captions?: ClippingCaptionOverrideDto[];
}
