import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SetTargetsDto } from './dto/set-targets.dto.js';

@Injectable()
export class AllocationService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const [transactions, prices, targets] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({ where: { userId } }),
      this.prisma.price.findMany({ where: { userId } }),
      this.prisma.allocationTarget.findMany({ where: { userId } }),
    ]);

    const priceMap = new Map<string, number>();
    prices.forEach((p) => priceMap.set(p.code, p.price));

    const targetMap = new Map<string, number>();
    targets.forEach((t) => targetMap.set(t.assetType, t.targetPercent));

    const assetHoldings = new Map<string, { qty: number; type: string }>();
    transactions.forEach((t) => {
      const code = t.assetCode;
      if (!assetHoldings.has(code)) {
        assetHoldings.set(code, { qty: 0, type: t.assetType });
      }
      const h = assetHoldings.get(code)!;
      if (t.action === 'MUA') h.qty += t.quantity;
      else h.qty -= t.quantity;
    });

    const typeValues = new Map<string, number>();
    let totalValue = 0;

    assetHoldings.forEach((h, code) => {
      if (h.qty <= 0) return;
      const price = priceMap.get(code) || 0;
      const value = h.qty * price;
      typeValues.set(h.type, (typeValues.get(h.type) || 0) + value);
      totalValue += value;
    });

    const nameMap: Record<string, string> = {
      metal: 'Metal',
      crypto: 'Crypto',
      stock: 'Stock',
    };

    const result: any[] = [];
    for (const assetType of ['metal', 'crypto', 'stock']) {
      const value = typeValues.get(assetType) || 0;
      const actualPercent = totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : 0;
      const targetPercent = targetMap.get(assetType) || 0;

      let status = 'on-target';
      if (actualPercent > targetPercent + 2) status = 'overweight';
      else if (actualPercent < targetPercent - 2) status = 'underweight';

      result.push({
        assetType,
        name: nameMap[assetType] || assetType,
        value: Math.round(value),
        actualPercent,
        targetPercent,
        status,
      });
    }

    return result;
  }

  async setTargets(userId: string, dto: SetTargetsDto) {
    const total = dto.targets.reduce((sum, t) => sum + t.targetPercent, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException(
        `Target percentages must sum to 100. Current total: ${total}`,
      );
    }

    for (const target of dto.targets) {
      await this.prisma.allocationTarget.upsert({
        where: {
          userId_assetType: { userId, assetType: target.assetType },
        },
        update: { targetPercent: target.targetPercent },
        create: {
          userId,
          assetType: target.assetType,
          targetPercent: target.targetPercent,
        },
      });
    }

    return { success: true, total };
  }

  async getRecommendation(userId: string) {
    const current = await this.getCurrent(userId);
    const totalValue = current.reduce((sum: number, c: any) => sum + c.value, 0);

    const actions: any[] = [];

    current.forEach((c: any) => {
      if (c.targetPercent === 0) return;
      const targetValue = (c.targetPercent / 100) * totalValue;
      const diff = c.value - targetValue;

      if (Math.abs(diff) > totalValue * 0.02) {
        if (diff > 0) {
          actions.push({
            assetType: c.assetType,
            action: 'sell',
            amount: Math.round(Math.abs(diff)),
            description: `Sell ~${Math.round(Math.abs(diff) / 1000000)}M VND of ${c.name}`,
          });
        } else {
          actions.push({
            assetType: c.assetType,
            action: 'buy',
            amount: Math.round(Math.abs(diff)),
            description: `Buy ~${Math.round(Math.abs(diff) / 1000000)}M VND of ${c.name}`,
          });
        }
      }
    });

    return {
      actions,
      summary: actions.length > 0
        ? 'Portfolio has deviated from strategic targets. Rebalancing recommended.'
        : 'Portfolio is well-balanced. No rebalancing needed.',
    };
  }
}
