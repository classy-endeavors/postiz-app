import {
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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
