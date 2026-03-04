import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddBanEntryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  heroId!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
