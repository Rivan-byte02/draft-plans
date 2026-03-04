import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AddBanEntryDto } from './dto/add-ban-entry.dto';
import { AddPreferredPickDto } from './dto/add-preferred-pick.dto';
import { CreateDraftPlanDto } from './dto/create-draft-plan.dto';
import { UpdateBanEntryDto } from './dto/update-ban-entry.dto';
import { UpdatePreferredPickDto } from './dto/update-preferred-pick.dto';
import { DraftPlansService } from './draft-plans.service';

@Controller('draft-plans')
export class DraftPlansController {
  constructor(private readonly draftPlansService: DraftPlansService) {}

  @Get()
  listDraftPlans() {
    return this.draftPlansService.listDraftPlans();
  }

  @Post()
  createDraftPlan(@Body() dto: CreateDraftPlanDto) {
    return this.draftPlansService.createDraftPlan(dto);
  }

  @Delete(':id')
  deleteDraftPlan(@Param('id') id: string) {
    return this.draftPlansService.deleteDraftPlan(id);
  }

  @Get(':id')
  getDraftPlan(@Param('id') id: string) {
    return this.draftPlansService.getDraftPlan(id);
  }

  @Post(':id/bans')
  addBanEntry(@Param('id') id: string, @Body() dto: AddBanEntryDto) {
    return this.draftPlansService.addBanEntry(id, dto);
  }

  @Patch(':planId/bans/:entryId')
  updateBanEntry(
    @Param('planId') planId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateBanEntryDto,
  ) {
    return this.draftPlansService.updateBanEntry(planId, entryId, dto);
  }

  @Delete(':planId/bans/:entryId')
  deleteBanEntry(@Param('planId') planId: string, @Param('entryId') entryId: string) {
    return this.draftPlansService.deleteBanEntry(planId, entryId);
  }

  @Post(':id/preferred-picks')
  addPreferredPick(@Param('id') id: string, @Body() dto: AddPreferredPickDto) {
    return this.draftPlansService.addPreferredPick(id, dto);
  }

  @Patch(':planId/preferred-picks/:entryId')
  updatePreferredPick(
    @Param('planId') planId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdatePreferredPickDto,
  ) {
    return this.draftPlansService.updatePreferredPick(planId, entryId, dto);
  }

  @Delete(':planId/preferred-picks/:entryId')
  deletePreferredPick(
    @Param('planId') planId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.draftPlansService.deletePreferredPick(planId, entryId);
  }
}
