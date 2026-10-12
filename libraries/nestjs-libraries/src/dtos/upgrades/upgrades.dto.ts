import { IsDefined, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestUpgradeDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class ReviewUpgradeDto {
  @IsString()
  @IsDefined()
  requestId: string;

  @IsIn(['approve', 'decline'])
  action: 'approve' | 'decline';

  @IsString()
  @IsDefined()
  code: string;
}
