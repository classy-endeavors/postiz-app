import { Injectable } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { CommentRepliesService } from '@gitroom/nestjs-libraries/database/prisma/comment-replies/comment.replies.service';

@Injectable()
@Activity()
export class CommentReplyActivity {
  constructor(private _commentRepliesService: CommentRepliesService) {}

  @ActivityMethod()
  async pollYoutubeComments() {
    await this._commentRepliesService.pollYoutube();
  }
}
