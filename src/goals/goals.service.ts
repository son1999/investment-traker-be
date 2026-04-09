import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { I18nService } from '../i18n/i18n.service.js';
import { PortfolioService } from '../portfolio/portfolio.service.js';
import { CreateGoalDto } from './dto/create-goal.dto.js';
import { UpdateGoalDto } from './dto/update-goal.dto.js';
import { toDateStr } from '../common/helpers/period.helper.js';

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
    private portfolioService: PortfolioService,
  ) {}

  private async calculateProgress(
    goal: { targetAmount: number; deadline: Date; linkedAssets: string[]; currentAmount: number | null },
    holdings: { assetCode: string; value: number }[],
  ) {
    let currentValue: number;

    if (goal.linkedAssets.length > 0) {
      const linkedSet = new Set(goal.linkedAssets);
      currentValue = holdings
        .filter((h) => linkedSet.has(h.assetCode))
        .reduce((sum, h) => sum + h.value, 0);
    } else {
      currentValue = goal.currentAmount || 0;
    }

    const progressPercent = goal.targetAmount > 0
      ? Math.round((currentValue / goal.targetAmount) * 10000) / 100
      : 0;

    const remainingAmount = Math.max(0, goal.targetAmount - currentValue);

    const now = new Date();
    const deadlineDate = new Date(goal.deadline);
    const daysRemaining = Math.max(0, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // On track: linear projection suggests reaching target by deadline
    const createdDate = now; // approximate
    const totalDays = Math.ceil((deadlineDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsed = Math.max(1, totalDays - daysRemaining);
    const projectedRate = currentValue / elapsed;
    const projectedFinal = projectedRate * totalDays;
    const onTrack = progressPercent >= 100 || (daysRemaining > 0 && projectedFinal >= goal.targetAmount);

    return {
      currentValue: Math.round(currentValue),
      targetAmount: goal.targetAmount,
      progressPercent: Math.min(progressPercent, 100),
      remainingAmount: Math.round(remainingAmount),
      daysRemaining,
      onTrack,
    };
  }

  async findAll(userId: string) {
    const [goals, holdings] = await Promise.all([
      this.prisma.financialGoal.findMany({
        where: { userId },
        orderBy: { deadline: 'asc' },
      }),
      this.portfolioService.getHoldings(userId),
    ]);

    return Promise.all(
      goals.map(async (goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        deadline: toDateStr(goal.deadline),
        linkedAssets: goal.linkedAssets,
        currentAmount: goal.currentAmount,
        icon: goal.icon,
        iconBg: goal.iconBg,
        progress: await this.calculateProgress(goal, holdings),
      })),
    );
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException(this.i18n.t('GOAL_NOT_FOUND'));
    }

    const holdings = await this.portfolioService.getHoldings(userId);

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: toDateStr(goal.deadline),
      linkedAssets: goal.linkedAssets,
      currentAmount: goal.currentAmount,
      icon: goal.icon,
      iconBg: goal.iconBg,
      progress: await this.calculateProgress(goal, holdings),
    };
  }

  async create(userId: string, dto: CreateGoalDto) {
    const goal = await this.prisma.financialGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        deadline: new Date(dto.deadline),
        linkedAssets: dto.linkedAssets || [],
        currentAmount: dto.currentAmount ?? null,
        icon: dto.icon || '🎯',
        iconBg: dto.iconBg || 'rgba(59,130,246,0.2)',
      },
    });

    const holdings = await this.portfolioService.getHoldings(userId);

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: toDateStr(goal.deadline),
      linkedAssets: goal.linkedAssets,
      currentAmount: goal.currentAmount,
      icon: goal.icon,
      iconBg: goal.iconBg,
      progress: await this.calculateProgress(goal, holdings),
    };
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException(this.i18n.t('GOAL_NOT_FOUND'));
    }

    const goal = await this.prisma.financialGoal.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetAmount !== undefined && { targetAmount: dto.targetAmount }),
        ...(dto.deadline !== undefined && { deadline: new Date(dto.deadline) }),
        ...(dto.linkedAssets !== undefined && { linkedAssets: dto.linkedAssets }),
        ...(dto.currentAmount !== undefined && { currentAmount: dto.currentAmount }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.iconBg !== undefined && { iconBg: dto.iconBg }),
      },
    });

    const holdings = await this.portfolioService.getHoldings(userId);

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: toDateStr(goal.deadline),
      linkedAssets: goal.linkedAssets,
      currentAmount: goal.currentAmount,
      icon: goal.icon,
      iconBg: goal.iconBg,
      progress: await this.calculateProgress(goal, holdings),
    };
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException(this.i18n.t('GOAL_NOT_FOUND'));
    }

    await this.prisma.financialGoal.delete({ where: { id } });
    return { success: true };
  }

  async getSummary(userId: string) {
    const goals = await this.findAll(userId);

    return {
      totalGoals: goals.length,
      onTrackCount: goals.filter((g) => g.progress.onTrack && g.progress.progressPercent < 100).length,
      atRiskCount: goals.filter((g) => !g.progress.onTrack && g.progress.progressPercent < 100).length,
      completedCount: goals.filter((g) => g.progress.progressPercent >= 100).length,
    };
  }
}
