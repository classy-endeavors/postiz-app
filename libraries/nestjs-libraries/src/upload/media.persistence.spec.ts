import {
  isCloudBucketUrl,
  isPresignedUrl,
  resolveMediaObjectKey,
  sanitizeMediaForPersistence,
  sanitizeMediaListForPersistence,
  stripPresignedQuery,
} from './s3.client.config';

describe('media persistence (no signed URLs in DB)', () => {
  const signed =
    'https://aizyntra-media.s3.us-east-1.amazonaws.com/abc.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=x&X-Amz-Signature=deadbeef';
  const canonical =
    'https://aizyntra-media.s3.us-east-1.amazonaws.com/abc.mp4';

  it('strips signatures from path, url, and thumbnail', () => {
    const cleaned = sanitizeMediaForPersistence({
      id: 'm1',
      name: 'abc.mp4',
      path: signed,
      url: signed,
      thumbnail: signed.replace('.mp4', '.jpg'),
    });

    expect(cleaned.path).toBe(canonical);
    expect(cleaned.url).toBe(canonical);
    expect(cleaned.thumbnail).toBe(
      'https://aizyntra-media.s3.us-east-1.amazonaws.com/abc.jpg'
    );
    expect(isPresignedUrl(cleaned.path!)).toBe(false);
  });

  it('sanitizes Post.image-style arrays before stringify', () => {
    const list = sanitizeMediaListForPersistence([
      { id: '1', path: signed },
      { id: '2', path: canonical },
    ]);
    const json = JSON.stringify(list);
    expect(json).not.toMatch(/X-Amz-Signature/i);
    expect(JSON.parse(json)[0].path).toBe(canonical);
  });

  it('leaves local relative paths alone', () => {
    expect(stripPresignedQuery('/uploads/2026/10/01/a.png')).toBe(
      '/uploads/2026/10/01/a.png'
    );
  });
});

describe('publish-time signing contract', () => {
  const bucketUrl = 'https://aizyntra-media.s3.us-east-1.amazonaws.com';

  it('fresh sign is independent of stored Post.image path', async () => {
    // Simulates postSocial → updateMedia: DB holds canonical path; return value is signed.
    const stored = {
      id: 'media-1',
      name: 'abc.mp4',
      path: canonicalUrl('abc.mp4'),
    };
    const signDownloadUrl = jest
      .fn()
      .mockResolvedValueOnce(signedUrl('abc.mp4', 'sig-1'))
      .mockResolvedValueOnce(signedUrl('abc.mp4', 'sig-2'));

    const firstPublish = await signDownloadUrl(stored.name);
    const retryPublish = await signDownloadUrl(stored.name);

    expect(firstPublish).not.toBe(stored.path);
    expect(retryPublish).not.toBe(firstPublish);
    expect(isPresignedUrl(firstPublish)).toBe(true);
    expect(stripPresignedQuery(firstPublish)).toBe(stored.path);
    expect(signDownloadUrl).toHaveBeenCalledTimes(2);
    expect(signDownloadUrl).toHaveBeenCalledWith('abc.mp4');
  });

  it('signs when Post.image omits name (Instagram/LinkedIn/TikTok/YouTube path)', async () => {
    // Production failure shape: composer persisted id+path only
    const postImage = {
      id: '3595a8a1-3f59-4e99-b5a1-917f0843c4ea',
      path: canonicalUrl('30cs6eVCjS80Wv14erEA.mp4'),
      alt: null,
      thumbnail: null,
      thumbnailTimestamp: null,
    };
    const mediaRowName = '30cs6eVCjS80Wv14erEA.mp4';
    const lookupMediaName = jest.fn(async () => mediaRowName);
    const signDownloadUrl = jest
      .fn()
      .mockResolvedValue(signedUrl(mediaRowName, 'publish-sig'));

    const key = resolveMediaObjectKey({
      name: postImage.name as string | undefined,
      mediaName: await lookupMediaName(postImage.id),
      path: postImage.path,
      bucketUrl,
    });
    expect(key).toBe(mediaRowName);

    const signed = await signDownloadUrl(key!);
    const forProviders = { ...postImage, name: key, path: signed, url: signed };

    expect(isPresignedUrl(forProviders.path)).toBe(true);
    expect(signDownloadUrl).toHaveBeenCalledWith(mediaRowName);

    // DB write path stays canonical
    const persisted = sanitizeMediaListForPersistence([
      { ...forProviders, path: stripPresignedQuery(forProviders.path) },
    ]);
    expect(persisted[0].path).toBe(canonicalUrl(mediaRowName));
    expect(JSON.stringify(persisted)).not.toMatch(/X-Amz-/i);
  });

  it('parses object key from canonical URL when Media.name lookup is unavailable', async () => {
    const path = canonicalUrl('only-from-url.mp4');
    const key = resolveMediaObjectKey({
      name: null,
      mediaName: null,
      path,
      bucketUrl,
    });
    expect(key).toBe('only-from-url.mp4');
    const signed = signedUrl(key!, 'url-key');
    expect(stripPresignedQuery(signed)).toBe(path);
  });

  it('does not treat legacy local /uploads URLs as cloud objects to sign', () => {
    const localPath =
      'https://dashboard.aizyntra.com/uploads/2026/10/13/a.mp4';
    expect(isCloudBucketUrl(localPath, bucketUrl)).toBe(false);
  });
});

describe('Media library withSignedAccess contract', () => {
  const bucketUrl = 'https://aizyntra-media.s3.us-east-1.amazonaws.com';

  async function withSignedAccessLikeService(
    media: { name?: string; path: string; thumbnail?: string | null },
    signDownloadUrl: (key: string) => Promise<string>
  ) {
    const path = stripPresignedQuery(media.path);
    let signedPath: string | null = null;
    if (isCloudBucketUrl(path, bucketUrl)) {
      const key = resolveMediaObjectKey({
        name: media.name,
        path,
        bucketUrl,
      });
      signedPath = key ? await signDownloadUrl(key) : null;
    }
    let thumbnail = media.thumbnail || null;
    if (thumbnail && isCloudBucketUrl(thumbnail, bucketUrl)) {
      const key = resolveMediaObjectKey({
        path: thumbnail,
        bucketUrl,
      });
      thumbnail = key ? await signDownloadUrl(key) : thumbnail;
    }
    return {
      ...media,
      ...(signedPath ? { path: signedPath } : {}),
      ...(thumbnail && thumbnail !== media.thumbnail ? { thumbnail } : {}),
    };
  }

  it('leaves legacy local Media.path unchanged (files still on EC2 volume)', async () => {
    const local = {
      name: 'd3dbee66526f7a2e5b8da10d2849e9b310.png',
      path: 'https://dashboard.aizyntra.com/uploads/2026/10/08/d3dbee66526f7a2e5b8da10d2849e9b310.png',
    };
    const sign = jest.fn();
    const out = await withSignedAccessLikeService(local, sign);
    expect(sign).not.toHaveBeenCalled();
    expect(out.path).toBe(local.path);
    expect(isPresignedUrl(out.path)).toBe(false);
  });

  it('signs private S3 Media.path for library preview without persisting the signature', async () => {
    const cloud = {
      name: 'm9QAkNmxFn.mp4',
      path: `${bucketUrl}/m9QAkNmxFn.mp4`,
    };
    const sign = jest
      .fn()
      .mockResolvedValue(signedUrl('m9QAkNmxFn.mp4', 'preview'));
    const out = await withSignedAccessLikeService(cloud, sign);
    expect(sign).toHaveBeenCalledWith('m9QAkNmxFn.mp4');
    expect(isPresignedUrl(out.path)).toBe(true);
    expect(stripPresignedQuery(out.path)).toBe(cloud.path);
  });
});

function canonicalUrl(key: string) {
  return `https://aizyntra-media.s3.us-east-1.amazonaws.com/${key}`;
}

function signedUrl(key: string, sig: string) {
  return `${canonicalUrl(key)}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=${sig}`;
}
