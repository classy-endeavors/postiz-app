import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UpgradesRepository {
  constructor(private _upgrades: PrismaRepository<'upgradeRequest'>) {}

  getRequests(organizationId: string) {
    return this._upgrades.model.upgradeRequest.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
      },
    });
  }

  getRequest(id: string) {
    return this._upgrades.model.upgradeRequest.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        organizationId: true,
        status: true,
      },
    });
  }

  createRequest(organizationId: string, userId: string, message?: string) {
    return this._upgrades.model.upgradeRequest.create({
      data: {
        organizationId,
        userId,
        message,
      },
      select: {
        id: true,
      },
    });
  }

  removeRequest(organizationId: string, id: string) {
    return this._upgrades.model.upgradeRequest.deleteMany({
      where: {
        id,
        organizationId,
      },
    });
  }

  // Only a pending request changes, so opening a link twice does nothing
  reviewRequest(id: string, status: 'approved' | 'declined') {
    return this._upgrades.model.upgradeRequest.updateMany({
      where: {
        id,
        status: 'pending',
      },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });
  }
}
