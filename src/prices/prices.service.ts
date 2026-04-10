import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { I18nService } from '../i18n/i18n.service.js';
import { CreatePriceDto } from './dto/create-price.dto.js';
import { UpdatePriceDto } from './dto/update-price.dto.js';

@Injectable()
export class PricesService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  async getAssetCurrency(userId: string, code: string): Promise<string | null> {
    const asset = await this.prisma.asset.findUnique({
      where: { userId_code: { userId, code } },
      select: { currency: true },
    });
    return asset?.currency || null;
  }

  async findAll(userId: string, type?: string) {
    const where: any = { userId };
    if (type) where.type = type;

    return this.prisma.price.findMany({ where });
  }

  async createOrUpdate(userId: string, dto: CreatePriceDto) {
    const existing = await this.prisma.price.findUnique({
      where: { userId_code: { userId, code: dto.code } },
    });

    if (existing) {
      const updated = await this.prisma.price.update({
        where: { id: existing.id },
        data: {
          icon: dto.icon,
          type: dto.type,
          price: dto.price,
          ...(dto.currency && { currency: dto.currency }),
        },
      });
      return { data: updated, status: 200 };
    }

    const created = await this.prisma.price.create({
      data: {
        userId,
        code: dto.code,
        icon: dto.icon,
        type: dto.type,
        price: dto.price,
        currency: dto.currency || 'VND',
      },
    });
    return { data: created, status: 201 };
  }

  async updateByCode(userId: string, code: string, dto: UpdatePriceDto) {
    const existing = await this.prisma.price.findUnique({
      where: { userId_code: { userId, code } },
    });

    if (!existing) {
      throw new NotFoundException(this.i18n.t('PRICE_NOT_FOUND', { code }));
    }

    return this.prisma.price.update({
      where: { id: existing.id },
      data: { price: dto.price },
    });
  }
}
