import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CoinsRepository {
  constructor(private _coins: PrismaRepository<'coinTransaction'>) {}

  async getBalance(organizationId: string) {
    const load = await this._coins.model.coinTransaction.aggregate({
      where: {
        organizationId,
      },
      _sum: {
        amount: true,
      },
    });

    return load._sum.amount || 0;
  }

  getLastTransaction(organizationId: string, type: string) {
    return this._coins.model.coinTransaction.findFirst({
      where: {
        organizationId,
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });
  }

  getTransactions(organizationId: string) {
    return this._coins.model.coinTransaction.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });
  }

  addTransaction(
    organizationId: string,
    amount: number,
    type: string,
    description?: string
  ) {
    return this._coins.model.coinTransaction.create({
      data: {
        organizationId,
        amount,
        type,
        description,
      },
      select: {
        id: true,
      },
    });
  }

  // The caller picks the id, so recording the same thing twice is one row
  addTransactionOnce(
    id: string,
    organizationId: string,
    amount: number,
    type: string,
    description?: string,
    createdAt?: Date
  ) {
    return this._coins.model.coinTransaction.upsert({
      where: {
        id,
      },
      create: {
        id,
        organizationId,
        amount,
        type,
        description,
        ...(createdAt ? { createdAt } : {}),
      },
      update: {},
      select: {
        id: true,
      },
    });
  }

  removeTransaction(organizationId: string, id: string) {
    return this._coins.model.coinTransaction.deleteMany({
      where: {
        id,
        organizationId,
      },
    });
  }
}
