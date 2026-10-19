import { Body, Controller, Get, Put } from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { CommentRepliesService } from '@gitroom/nestjs-libraries/database/prisma/comment-replies/comment.replies.service';
import { ReplyProfileDto } from '@gitroom/nestjs-libraries/dtos/comment-replies/reply.profile.dto';

@Controller('/replies')
export class RepliesController {
  constructor(private _commentRepliesService: CommentRepliesService) {}

  @Get('/profile')
  getProfile(@GetOrgFromRequest() org: Organization) {
    return this._commentRepliesService.getProfile(org.id);
  }

  @Put('/profile')
  saveProfile(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ReplyProfileDto
  ) {
    return this._commentRepliesService.saveProfile(org.id, body);
  }
}
