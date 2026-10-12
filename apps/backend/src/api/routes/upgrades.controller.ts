import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization, User } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { UpgradesService } from '@gitroom/nestjs-libraries/database/prisma/upgrades/upgrades.service';
import { RequestUpgradeDto } from '@gitroom/nestjs-libraries/dtos/upgrades/upgrades.dto';

@ApiTags('Upgrades')
@Controller('/upgrades')
export class UpgradesController {
  constructor(private _upgradesService: UpgradesService) {}

  @Get('/')
  getUpgrade(@GetOrgFromRequest() org: Organization) {
    return this._upgradesService.getUpgrade(org.id);
  }

  @Post('/request')
  requestUpgrade(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: RequestUpgradeDto
  ) {
    return this._upgradesService.requestUpgrade(org, user, body);
  }
}
