import {
  buildS3ClientConfig,
  isCloudBucketUrl,
  isPresignedUrl,
  objectKeyFromBucketUrl,
  resolveMediaObjectKey,
  stripPresignedQuery,
  validateCloudStorageEnv,
} from './s3.client.config';

describe('s3.client.config', () => {
  const valid = {
    accountId: '',
    accessKey: '',
    secretKey: '',
    region: 'us-east-1',
    bucketName: 'aizyntra-media',
    bucketUrl: 'https://aizyntra-media.s3.us-east-1.amazonaws.com',
    endpoint: 'https://s3.us-east-1.amazonaws.com',
  };

  it('rejects incomplete cloud config', () => {
    expect(() => validateCloudStorageEnv({ ...valid, bucketName: '' })).toThrow(
      /CLOUDFLARE_BUCKETNAME/
    );
    expect(() =>
      validateCloudStorageEnv({
        ...valid,
        endpoint: '',
        accountId: '',
      })
    ).toThrow(/CLOUDFLARE_ENDPOINT or CLOUDFLARE_ACCOUNT_ID/);
  });

  it('allows empty keys for instance-role credentials', () => {
    const cfg = buildS3ClientConfig(valid);
    expect(cfg.credentials).toBeUndefined();
    expect(cfg.region).toBe('us-east-1');
    expect(cfg.endpoint).toBe('https://s3.us-east-1.amazonaws.com');
  });

  it('requires both static keys together', () => {
    expect(() =>
      buildS3ClientConfig({ ...valid, accessKey: 'AKIA', secretKey: '' })
    ).toThrow(/both be set/);
  });

  it('includes static credentials when both keys are set', () => {
    const cfg = buildS3ClientConfig({
      ...valid,
      accessKey: 'AKIAEXAMPLE',
      secretKey: 'secret',
    });
    expect(cfg.credentials).toEqual({
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'secret',
    });
  });

  it('strips presigned query strings and detects them', () => {
    const signed =
      'https://aizyntra-media.s3.us-east-1.amazonaws.com/abc.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=deadbeef';
    expect(isPresignedUrl(signed)).toBe(true);
    expect(stripPresignedQuery(signed)).toBe(
      'https://aizyntra-media.s3.us-east-1.amazonaws.com/abc.mp4'
    );
    expect(isPresignedUrl(stripPresignedQuery(signed))).toBe(false);
  });

  it('extracts object keys from bucket URLs', () => {
    expect(
      objectKeyFromBucketUrl(
        'https://aizyntra-media.s3.us-east-1.amazonaws.com/abc.mp4?X-Amz-Signature=x',
        'https://aizyntra-media.s3.us-east-1.amazonaws.com'
      )
    ).toBe('abc.mp4');
    expect(objectKeyFromBucketUrl('abc.mp4', '')).toBe('abc.mp4');
  });

  it('isCloudBucketUrl distinguishes private S3 from legacy local uploads', () => {
    const bucketUrl = 'https://aizyntra-media.s3.us-east-1.amazonaws.com';
    expect(
      isCloudBucketUrl(`${bucketUrl}/abc.mp4`, bucketUrl)
    ).toBe(true);
    expect(
      isCloudBucketUrl(
        `${bucketUrl}/abc.mp4?X-Amz-Signature=deadbeef`,
        bucketUrl
      )
    ).toBe(true);
    expect(
      isCloudBucketUrl(
        'https://dashboard.aizyntra.com/uploads/2026/10/08/abc.png',
        bucketUrl
      )
    ).toBe(false);
    expect(isCloudBucketUrl('/uploads/abc.png', bucketUrl)).toBe(false);
    expect(isCloudBucketUrl(`${bucketUrl}/abc.mp4`, '')).toBe(false);
  });

  it('resolveMediaObjectKey prefers name, then Media.name, then URL', () => {
    const bucketUrl = 'https://aizyntra-media.s3.us-east-1.amazonaws.com';
    const path = `${bucketUrl}/from-url.mp4`;

    expect(
      resolveMediaObjectKey({
        name: 'explicit.mp4',
        mediaName: 'media-row.mp4',
        path,
        bucketUrl,
      })
    ).toBe('explicit.mp4');

    expect(
      resolveMediaObjectKey({
        name: null,
        mediaName: 'media-row.mp4',
        path,
        bucketUrl,
      })
    ).toBe('media-row.mp4');

    expect(
      resolveMediaObjectKey({
        name: null,
        mediaName: null,
        path,
        bucketUrl,
      })
    ).toBe('from-url.mp4');

    expect(
      resolveMediaObjectKey({
        name: null,
        mediaName: null,
        path: `${path}?X-Amz-Signature=deadbeef`,
        bucketUrl,
      })
    ).toBe('from-url.mp4');
  });
});
