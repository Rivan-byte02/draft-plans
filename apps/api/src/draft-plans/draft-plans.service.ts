import type {
  DraftPlanDetails,
  DraftPlanSummary,
} from '@draft-plans/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DraftPlanEntryType,
  DraftPlanPriority,
  Prisma,
} from '@prisma/client';
import {
  toDraftPlanDetails,
  toDraftPlanSummary,
} from '../common/mappers/draft-plan.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { AddBanEntryDto } from './dto/add-ban-entry.dto';
import { AddPreferredPickDto } from './dto/add-preferred-pick.dto';
import { CreateDraftPlanDto } from './dto/create-draft-plan.dto';
import { UpdateBanEntryDto } from './dto/update-ban-entry.dto';
import { UpdatePreferredPickDto } from './dto/update-preferred-pick.dto';

@Injectable()
export class DraftPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async listDraftPlans(ownerId: string): Promise<DraftPlanSummary[]> {
    const plans = await this.prisma.draftPlan.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      include: {
        entries: {
          where: {
            deletedAt: null,
          },
          select: { type: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return plans.map(toDraftPlanSummary);
  }

  async createDraftPlan(ownerId: string, dto: CreateDraftPlanDto): Promise<DraftPlanDetails> {
    const plan = await this.prisma.draftPlan.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
      },
    });

    return this.getDraftPlan(ownerId, plan.id);
  }

  async deleteDraftPlan(ownerId: string, id: string) {
    await this.assertPlanExists(ownerId, id);

    const deletedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.draftPlan.updateMany({
        where: {
          id,
          ownerId,
          deletedAt: null,
        },
        data: { deletedAt },
      }),
      this.prisma.draftPlanHeroEntry.updateMany({
        where: {
          draftPlanId: id,
          deletedAt: null,
        },
        data: { deletedAt },
      }),
    ]);

    return {
      id,
      deletedAt: deletedAt.toISOString(),
    };
  }

  async getDraftPlan(ownerId: string, id: string): Promise<DraftPlanDetails> {
    const plan = await this.prisma.draftPlan.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
      include: {
        entries: {
          where: {
            deletedAt: null,
          },
          include: { hero: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Draft plan not found');
    }

    return toDraftPlanDetails(plan);
  }

  async addBanEntry(ownerId: string, planId: string, dto: AddBanEntryDto) {
    await this.assertPlanExists(ownerId, planId);
    await this.assertHeroExists(dto.heroId);

    try {
      await this.prisma.draftPlanHeroEntry.create({
        data: {
          draftPlanId: planId,
          heroId: dto.heroId,
          type: DraftPlanEntryType.BAN,
          note: dto.note,
        },
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }

    return this.getDraftPlan(ownerId, planId);
  }

  async updateBanEntry(
    ownerId: string,
    planId: string,
    entryId: string,
    dto: UpdateBanEntryDto,
  ) {
    await this.findEntry(ownerId, planId, entryId, DraftPlanEntryType.BAN);

    await this.prisma.draftPlanHeroEntry.update({
      where: { id: entryId },
      data: {
        note: dto.note,
      },
    });

    return this.getDraftPlan(ownerId, planId);
  }

  async deleteBanEntry(ownerId: string, planId: string, entryId: string) {
    await this.findEntry(ownerId, planId, entryId, DraftPlanEntryType.BAN);

    await this.prisma.draftPlanHeroEntry.update({
      where: { id: entryId },
      data: {
        deletedAt: new Date(),
      },
    });

    return this.getDraftPlan(ownerId, planId);
  }

  async addPreferredPick(ownerId: string, planId: string, dto: AddPreferredPickDto) {
    await this.assertPlanExists(ownerId, planId);
    await this.assertHeroExists(dto.heroId);

    try {
      await this.prisma.draftPlanHeroEntry.create({
        data: {
          draftPlanId: planId,
          heroId: dto.heroId,
          type: DraftPlanEntryType.PREFERRED,
          role: dto.role,
          priority: dto.priority as DraftPlanPriority,
          note: dto.note,
        },
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }

    return this.getDraftPlan(ownerId, planId);
  }

  async updatePreferredPick(
    ownerId: string,
    planId: string,
    entryId: string,
    dto: UpdatePreferredPickDto,
  ) {
    await this.findEntry(ownerId, planId, entryId, DraftPlanEntryType.PREFERRED);

    await this.prisma.draftPlanHeroEntry.update({
      where: { id: entryId },
      data: {
        role: dto.role,
        priority: dto.priority as DraftPlanPriority | undefined,
        note: dto.note,
      },
    });

    return this.getDraftPlan(ownerId, planId);
  }

  async deletePreferredPick(ownerId: string, planId: string, entryId: string) {
    await this.findEntry(ownerId, planId, entryId, DraftPlanEntryType.PREFERRED);

    await this.prisma.draftPlanHeroEntry.update({
      where: { id: entryId },
      data: {
        deletedAt: new Date(),
      },
    });

    return this.getDraftPlan(ownerId, planId);
  }

  private async assertPlanExists(ownerId: string, id: string) {
    const plan = await this.prisma.draftPlan.findFirst({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!plan) {
      throw new NotFoundException('Draft plan not found');
    }
  }

  private async assertHeroExists(id: number) {
    const hero = await this.prisma.hero.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!hero) {
      throw new NotFoundException('Hero not found. Sync heroes from OpenDota first.');
    }
  }

  private async findEntry(
    ownerId: string,
    planId: string,
    entryId: string,
    type: DraftPlanEntryType,
  ) {
    const entry = await this.prisma.draftPlanHeroEntry.findFirst({
      where: {
        id: entryId,
        draftPlanId: planId,
        type,
        deletedAt: null,
        draftPlan: {
          ownerId,
          deletedAt: null,
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Draft plan entry not found');
    }

    return entry;
  }

  private handleKnownErrors(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Hero already exists in this draft plan section');
    }

    throw error;
  }
}
