import { IsOptional, IsString } from 'class-validator';

export class UpdateBanEntryDto {
  @IsOptional()
  @IsString()
  note?: string;
}
