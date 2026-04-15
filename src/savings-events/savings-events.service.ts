import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { I18nService } from '../i18n/i18n.service.js';
import { CreateSavingsEventDto, SavingsEventType } from './dto/create-savings-event.dto.js';
import { calculateSavingsValue } from '../common/helpers/savings.helper.js';

export interface SavingsBalanceSummary {
  balance: number;
  principal: number;
  interestEarned: number;
  accruedInterest: number;
  depositCount: number;
  withdrawCount: number;
  firstDepositDate: Date | null;
}

const POSITIVE_TYPES: SavingsEventType[] = ['DEPOSIT', 'INTEREST'];

@Injectable()
export class SavingsEventsService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  private signedAmount(type: string, amount: number): number {
    return POSITIVE_TYPES.includes(type as SavingsEventType) ? amount : -amount;
  }

  async findByAsset(userId: string, assetCode: string) {
    const events = await this.prisma.savingsEvent.findMany({
      where: { userId, assetCode },
      orderBy: { date: 'asc' },
    });
    return events.map((event) => ({
      id: event.id,
      type: event.type,
      amount: event.amount,
      date: event.date.toISOString().slice(0, 10),
      note: event.note,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  async computeBalance(
    userId: string,
    assetCode: string,
    asset?: { interestRate: number | null; termMonths: number | null },
  ): Promise<SavingsBalanceSummary> {
    const events = await this.prisma.savingsEvent.findMany({
      where: { userId, assetCode },
      orderBy: { date: 'asc' },
    });

    let balance = 0;
    let principal = 0;
    let interestEarned = 0;
    let depositCount = 0;
    let withdrawCount = 0;
    let firstDepositDate: Date | null = null;

    for (const event of events) {
      balance += this.signedAmount(event.type, event.amount);
      if (event.type === 'DEPOSIT') {
        principal += event.amount;
        depositCount++;
        if (!firstDepositDate || event.date < firstDepositDate) {
          firstDepositDate = event.date;
        }
      } else if (event.type === 'INTEREST') {
        interestEarned += event.amount;
      } else if (event.type === 'WITHDRAW') {
        withdrawCount++;
      }
    }

    let accruedInterest = 0;
    const rate = asset?.interestRate ?? 0;
    const term = asset?.termMonths ?? 0;
    if (rate > 0 && term > 0 && principal > 0 && firstDepositDate) {
      const projectedValue = calculateSavingsValue(principal, rate, term, firstDepositDate);
      accruedInterest = Math.max(0, projectedValue - principal);
      if (interestEarned === 0 && accruedInterest > 0) {
        interestEarned = accruedInterest;
        balance += accruedInterest;
      }
    }

    return {
      balance,
      principal,
      interestEarned,
      accruedInterest,
      depositCount,
      withdrawCount,
      firstDepositDate,
    };
  }

  async computeBalancesByAsset(userId: string, assetCodes?: string[]): Promise<Map<string, number>> {
    const where: any = { userId };
    if (assetCodes && assetCodes.length > 0) where.assetCode = { in: assetCodes };

    const events = await this.prisma.savingsEvent.findMany({ where });
    const map = new Map<string, number>();
    for (const event of events) {
      const current = map.get(event.assetCode) || 0;
      map.set(event.assetCode, current + this.signedAmount(event.type, event.amount));
    }
    return map;
  }

  async create(userId: string, dto: CreateSavingsEventDto) {
    const asset = await this.prisma.asset.findUnique({
      where: { userId_code: { userId, code: dto.assetCode } },
    });
    if (!asset) {
      throw new NotFoundException(this.i18n.t('ASSET_NOT_FOUND', { code: dto.assetCode }));
    }
    if (asset.type !== 'savings') {
      throw new BadRequestException('Asset is not a savings account');
    }

    if (dto.type === 'WITHDRAW' || dto.type === 'FEE' || dto.type === 'MATURITY') {
      const { balance } = await this.computeBalance(userId, dto.assetCode);
      if (balance < dto.amount) {
        throw new BadRequestException(this.i18n.t('INSUFFICIENT_BALANCE', { balance }));
      }
    }

    const created = await this.prisma.savingsEvent.create({
      data: {
        userId,
        assetCode: dto.assetCode,
        type: dto.type,
        amount: dto.amount,
        date: new Date(dto.date),
        note: dto.note || null,
      },
    });

    return {
      id: created.id,
      type: created.type,
      amount: created.amount,
      date: created.date.toISOString().slice(0, 10),
      note: created.note,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async createInternal(
    userId: string,
    assetCode: string,
    type: SavingsEventType,
    amount: number,
    date: Date,
    note?: string,
  ) {
    return this.prisma.savingsEvent.create({
      data: { userId, assetCode, type, amount, date, note: note || null },
    });
  }

  async delete(userId: string, id: string) {
    const event = await this.prisma.savingsEvent.findFirst({
      where: { id, userId },
    });
    if (!event) {
      throw new NotFoundException(this.i18n.t('SAVINGS_EVENT_NOT_FOUND'));
    }
    await this.prisma.savingsEvent.delete({ where: { id } });
    return { success: true };
  }
}
