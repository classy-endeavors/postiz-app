import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { CommentRepliesService } from '@gitroom/nestjs-libraries/database/prisma/comment-replies/comment.replies.service';

const signatureMatches = (raw: Buffer, header: string | undefined, secret: string) => {
  if (!header || !secret) {
    return false;
  }
  const expected = Buffer.from(
    `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`
  );
  const received = Buffer.from(header);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
};

@Controller('/public/instagram/webhook')
export class InstagramWebhookController {
  constructor(private _commentRepliesService: CommentRepliesService) {}

  @Get()
  verify(@Query() query: Record<string, any>, @Res() res: Response) {
    const mode = query['hub.mode'] || query.hub?.mode;
    const token = query['hub.verify_token'] || query.hub?.verify_token;
    const challenge = query['hub.challenge'] || query.hub?.challenge;
    if (
      mode === 'subscribe' &&
      token &&
      token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
    ) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('forbidden');
  }

  @Post()
  @HttpCode(200)
  receive(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    const raw = req.rawBody;
    const header = req.header('x-hub-signature-256');
    const secrets = [
      process.env.FACEBOOK_APP_SECRET,
      process.env.INSTAGRAM_APP_SECRET,
    ].filter((secret): secret is string => !!secret);
    const signed =
      !!raw &&
      secrets.some((secret) => signatureMatches(raw, header, secret));
    if (!signed) {
      return res.status(403).send('forbidden');
    }

    this._commentRepliesService
      .handleInstagramWebhook(req.body)
      .catch((err) => console.error('instagram comment webhook failed', err));
    return res.status(200).json({ ok: true });
  }
}
