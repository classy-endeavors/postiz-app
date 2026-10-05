import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization, User } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { CoinsService } from '@gitroom/nestjs-libraries/database/prisma/coins/coins.service';
import {
  CoinsHistoryDto,
  GrantCoinsDto,
  RequestCoinsDto,
} from '@gitroom/nestjs-libraries/dtos/coins/coins.dto';

@ApiTags('Coins')
@Controller('/coins')
export class CoinsController {
  constructor(private _coinsService: CoinsService) {}

  @Get('/')
  getCoins(@GetOrgFromRequest() org: Organization) {
    return this._coinsService.getCoins(org.id);
  }

  @Get('/history')
  getHistory(
    @GetOrgFromRequest() org: Organization,
    @Query() query: CoinsHistoryDto
  ) {
    return this._coinsService.getHistory(org.id, query);
  }

  @Get('/balance')
  async getBalance(@GetOrgFromRequest() org: Organization) {
    return { balance: await this._coinsService.getBalance(org.id) };
  }

  @Post('/request')
  requestCoins(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: RequestCoinsDto
  ) {
    return this._coinsService.requestCoins(org, user, body);
  }

  @Post('/grant')
  async grantCoins(
    @GetUserFromRequest() user: User,
    @Body() body: GrantCoinsDto
  ) {
    if (!user.isSuperAdmin) {
      throw new HttpException('Unauthorized', 400);
    }
    await this._coinsService.grantCoins(
      body.organizationId,
      body.amount,
      body.description
    );
  }
}
