import {
  isCloudBucketUrl,
  resolveMediaObjectKey,
  stripPresignedQuery,
} from '@gitroom/nestjs-libraries/upload/s3.client.config';
import { IUploadProvider } from '@gitroom/nestjs-libraries/upload/upload.interface';

export type ClippingIngestSource = {
  url: string;
  via: 'direct' | 'oxylabs';
};

/**
 * Build a fresh ingest URL. Signed S3/R2 links expire (~3h), so call this at
 * analyse/fetch time — never treat a previously signed URL as durable.
 */
export async function resolveClippingIngestSource(input: {
  url: string;
  mediaId?: string | null;
  media?: { name: string; path: string } | null;
  storage: IUploadProvider;
  bucketUrl?: string | null;
}): Promise<ClippingIngestSource> {
  if (!input.mediaId || !input.media) {
    return { url: input.url, via: 'oxylabs' };
  }

  const bucketUrl =
    input.bucketUrl ??
    process.env.CLOUDFLARE_BUCKET_URL ??
    process.env.BUCKET_URL ??
    '';
  const path = stripPresignedQuery(input.media.path);
  const key = resolveMediaObjectKey({
    mediaName: input.media.name,
    path,
    bucketUrl,
  });

  if (
    key &&
    input.storage.signDownloadUrl &&
    isCloudBucketUrl(path, bucketUrl)
  ) {
    return {
      url: await input.storage.signDownloadUrl(key),
      via: 'direct',
    };
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return { url: path, via: 'direct' };
  }

  const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const relative = path.startsWith('/') ? path : `/uploads/${path}`;
  return {
    url: base ? `${base}${relative}` : relative,
    via: 'direct',
  };
}
