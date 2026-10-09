import {
  IsDefined,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export type CoinsHistoryFilter = 'all' | 'spent' | 'added';

export class CoinsHistoryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 0;

  @IsOptional()
  @IsIn(['all', 'spent', 'added'])
  filter?: CoinsHistoryFilter = 'all';
}

export class RequestCoinsDto {
  @IsInt()
  @Min(1)
  @Max(100000)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class ApproveCoinsDto {
  @IsString()
  @IsDefined()
  requestId: string;

  @IsString()
  @IsDefined()
  organizationId: string;

  @IsString()
  @IsDefined()
  userId: string;

  @IsInt()
  @Min(1)
  @Max(100000)
  @Transform(({ value }) => parseInt(value, 10))
  amount: number;

  @IsString()
  @IsDefined()
  code: string;
}

export class GrantCoinsDto {
  @IsString()
  @IsDefined()
  organizationId: string;

  @IsInt()
  @Min(-100000)
  @Max(100000)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
