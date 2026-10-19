import { Body, Controller, Get, Put } from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { CommentRepliesService } from '@gitroom/nestjs-libraries/database/prisma/comment-replies/comment.replies.service';
import {
  SetContentLinksDto,
  SetReplyEnabledDto,
} from '@gitroom/nestjs-libraries/dtos/comment-replies/reply.profile.dto';

@Controller('/replies')
export class RepliesController {
  constructor(private _commentRepliesService: CommentRepliesService) {}

  @Get('/posts')
  listPosts(@GetOrgFromRequest() org: Organization) {
    return this._commentRepliesService.listPosts(org.id);
  }

  @Put('/posts')
  setEnabled(
    @GetOrgFromRequest() org: Organization,
    @Body() body: SetReplyEnabledDto
  ) {
    return this._commentRepliesService.setEnabled(org.id, body.ids, body.enabled);
  }

  @Put('/links')
  setLinks(
    @GetOrgFromRequest() org: Organization,
    @Body() body: SetContentLinksDto
  ) {
    return this._commentRepliesService.replaceLinks(org.id, [body.postId], body.relatedIds);
  }
}
