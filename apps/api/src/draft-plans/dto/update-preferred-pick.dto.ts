import { IsIn, IsOptional, IsString } from 'class-validator';

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;

export class UpdatePreferredPickDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];

  @IsOptional()
  @IsString()
  note?: string;
}
