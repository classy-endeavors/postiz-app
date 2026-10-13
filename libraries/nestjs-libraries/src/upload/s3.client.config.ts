import { S3ClientConfig } from '@aws-sdk/client-s3';

export type CloudStorageEnv = {
  accountId?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  bucketName?: string;
  bucketUrl?: string;
  endpoint?: string;
  /** Required for LocalStack/moto path-style addressing; leave unset for Amazon S3. */
  forcePathStyle?: boolean;
};

export function validateCloudStorageEnv(env: CloudStorageEnv): void {
  if (!env.bucketName?.trim()) {
    throw new Error('CLOUDFLARE_BUCKETNAME is required when STORAGE_PROVIDER=cloudflare');
  }
  if (!env.region?.trim()) {
    throw new Error('CLOUDFLARE_REGION is required when STORAGE_PROVIDER=cloudflare');
  }
  if (!env.bucketUrl?.trim()) {
    throw new Error('CLOUDFLARE_BUCKET_URL is required when STORAGE_PROVIDER=cloudflare');
  }
  if (!env.endpoint?.trim() && !env.accountId?.trim()) {
    throw new Error(
      'CLOUDFLARE_ENDPOINT or CLOUDFLARE_ACCOUNT_ID is required when STORAGE_PROVIDER=cloudflare'
    );
  }
}

export function resolveS3Endpoint(env: CloudStorageEnv): string {
  if (env.endpoint?.trim()) {
    return env.endpoint.trim();
  }
  return `https://${env.accountId!.trim()}.r2.cloudflarestorage.com`;
}

/** Static keys when both are set; otherwise the default AWS credential chain (e.g. instance profile). */
export function buildS3ClientConfig(env: CloudStorageEnv): S3ClientConfig {
  validateCloudStorageEnv(env);

  const accessKey = env.accessKey?.trim();
  const secretKey = env.secretKey?.trim();
  const hasStaticKeys = !!(accessKey && secretKey);

  if ((accessKey && !secretKey) || (!accessKey && secretKey)) {
    throw new Error(
      'CLOUDFLARE_ACCESS_KEY and CLOUDFLARE_SECRET_ACCESS_KEY must both be set, or both empty for instance-role credentials'
    );
  }

  return {
    endpoint: resolveS3Endpoint(env),
    region: env.region!.trim(),
    ...(hasStaticKeys
      ? {
          credentials: {
            accessKeyId: accessKey!,
            secretAccessKey: secretKey!,
          },
        }
      : {}),
    ...(env.forcePathStyle ? { forcePathStyle: true } : {}),
    requestChecksumCalculation: 'WHEN_REQUIRED',
  };
}

export function objectKeyFromBucketUrl(
  pathOrUrl: string,
  bucketUrl: string
): string | null {
  if (!pathOrUrl) {
    return null;
  }
  const base = bucketUrl.replace(/\/$/, '');
  const clean = pathOrUrl.split('?')[0];
  if (base && clean.startsWith(base)) {
    return clean.slice(base.length).replace(/^\//, '') || null;
  }
  // Bare object key (no scheme)
  if (!clean.includes('://')) {
    return clean.replace(/^\//, '') || null;
  }
  return clean.split('/').pop() || null;
}

export function isPresignedUrl(url: string): boolean {
  return /[?&]X-Amz-(Algorithm|Signature|Credential)=/i.test(url);
}

export function stripPresignedQuery(url: string): string {
  if (!url || url.indexOf('http') !== 0) {
    return url;
  }
  return url.split('?')[0];
}

/** Strip short-lived signature query params from media fields before DB write. */
export function sanitizeMediaForPersistence<
  T extends { path?: string; url?: string; thumbnail?: string }
>(media: T): T {
  if (!media) {
    return media;
  }
  return {
    ...media,
    ...(typeof media.path === 'string'
      ? { path: stripPresignedQuery(media.path) }
      : {}),
    ...(typeof media.url === 'string'
      ? { url: stripPresignedQuery(media.url) }
      : {}),
    ...(typeof media.thumbnail === 'string'
      ? { thumbnail: stripPresignedQuery(media.thumbnail) }
      : {}),
  };
}

export function sanitizeMediaListForPersistence<
  T extends { path?: string; url?: string; thumbnail?: string }
>(list: T[] | null | undefined): T[] {
  return (list || []).map((item) => sanitizeMediaForPersistence(item));
}
