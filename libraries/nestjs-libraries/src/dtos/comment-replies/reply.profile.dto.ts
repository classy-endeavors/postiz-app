import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsString,
} from 'class-validator';

export class SetReplyEnabledDto {
  @IsArray()
  @ArrayMaxSize(300)
  @IsString({ each: true })
  ids: string[];

  @IsBoolean()
  enabled: boolean;
}

export class SetContentLinksDto {
  @IsString()
  postId: string;

  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  relatedIds: string[];
}
