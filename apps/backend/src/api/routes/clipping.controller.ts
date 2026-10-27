import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { ClippingService } from '@gitroom/nestjs-libraries/database/prisma/clipping/clipping.service';
import { ClippingDto } from '@gitroom/nestjs-libraries/dtos/clipping/clipping.dto';
import { ClippingSuggestDto } from '@gitroom/nestjs-libraries/dtos/clipping/clipping.suggest.dto';
import { ClippingConfirmDto } from '@gitroom/nestjs-libraries/dtos/clipping/clipping.confirm.dto';

@ApiTags('Clipping')
@Controller('/clipping')
export class ClippingController {
  constructor(private _clippingService: ClippingService) {}

  @Post('/')
  startClipping(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ClippingDto
  ) {
    return this._clippingService.startClipping(org, body);
  }

  @Post('/suggest')
  startSuggest(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ClippingSuggestDto
  ) {
    return this._clippingService.startSuggest(org, body);
  }

  @Post('/:id/confirm')
  confirmClipping(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: ClippingConfirmDto
  ) {
    return this._clippingService.confirmClipping(org, id, body);
  }

  @Post('/:id/cancel')
  cancelClipping(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._clippingService.cancelClipping(org, id);
  }

  @Get('/')
  getClippings(
    @GetOrgFromRequest() org: Organization,
    @Query('page') page: number
  ) {
    return this._clippingService.getClippings(org.id, page);
  }

  @Get('/:id')
  getClipping(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._clippingService.getClipping(org.id, id);
  }
}
