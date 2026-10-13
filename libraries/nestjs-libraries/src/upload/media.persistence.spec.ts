import {
  isPresignedUrl,
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
});

function canonicalUrl(key: string) {
  return `https://aizyntra-media.s3.us-east-1.amazonaws.com/${key}`;
}

function signedUrl(key: string, sig: string) {
  return `${canonicalUrl(key)}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=${sig}`;
}
