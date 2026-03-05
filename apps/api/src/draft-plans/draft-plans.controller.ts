import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { AuthUser } from '@draft-plans/shared';
import { CurrentUser } from '../auth/current-user.decorator';
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
  listDraftPlans(@CurrentUser() currentUser: AuthUser) {
    return this.draftPlansService.listDraftPlans(currentUser.id);
  }

  @Post()
  createDraftPlan(@CurrentUser() currentUser: AuthUser, @Body() dto: CreateDraftPlanDto) {
    return this.draftPlansService.createDraftPlan(currentUser.id, dto);
  }

  @Delete(':id')
  deleteDraftPlan(@CurrentUser() currentUser: AuthUser, @Param('id') id: string) {
    return this.draftPlansService.deleteDraftPlan(currentUser.id, id);
  }

  @Get(':id')
  getDraftPlan(@CurrentUser() currentUser: AuthUser, @Param('id') id: string) {
    return this.draftPlansService.getDraftPlan(currentUser.id, id);
  }

  @Post(':id/bans')
  addBanEntry(
    @CurrentUser() currentUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddBanEntryDto,
  ) {
    return this.draftPlansService.addBanEntry(currentUser.id, id, dto);
  }

  @Patch(':planId/bans/:entryId')
  updateBanEntry(
    @CurrentUser() currentUser: AuthUser,
    @Param('planId') planId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateBanEntryDto,
  ) {
    return this.draftPlansService.updateBanEntry(currentUser.id, planId, entryId, dto);
  }

  @Delete(':planId/bans/:entryId')
  deleteBanEntry(
    @CurrentUser() currentUser: AuthUser,
    @Param('planId') planId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.draftPlansService.deleteBanEntry(currentUser.id, planId, entryId);
  }

  @Post(':id/preferred-picks')
  addPreferredPick(
    @CurrentUser() currentUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddPreferredPickDto,
  ) {
    return this.draftPlansService.addPreferredPick(currentUser.id, id, dto);
  }

  @Patch(':planId/preferred-picks/:entryId')
  updatePreferredPick(
    @CurrentUser() currentUser: AuthUser,
    @Param('planId') planId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdatePreferredPickDto,
  ) {
    return this.draftPlansService.updatePreferredPick(currentUser.id, planId, entryId, dto);
  }

  @Delete(':planId/preferred-picks/:entryId')
  deletePreferredPick(
    @CurrentUser() currentUser: AuthUser,
    @Param('planId') planId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.draftPlansService.deletePreferredPick(currentUser.id, planId, entryId);
  }
}
