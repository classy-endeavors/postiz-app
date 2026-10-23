import { IsString, IsDefined } from 'class-validator';

export class GetFeedPreviewDto {
  @IsDefined()
  @IsString()
  integration: string;
}

export class SwapFeedPreviewDto {
  @IsDefined()
  @IsString()
  sourceId: string;

  @IsDefined()
  @IsString()
  targetId: string;
}
