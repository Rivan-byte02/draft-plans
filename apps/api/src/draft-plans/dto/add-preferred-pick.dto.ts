import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;

export class AddPreferredPickDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  heroId!: number;

  @IsOptional()
  @IsString()
  role?: string;

  @IsIn(PRIORITIES)
  priority!: (typeof PRIORITIES)[number];

  @IsOptional()
  @IsString()
  note?: string;
}
