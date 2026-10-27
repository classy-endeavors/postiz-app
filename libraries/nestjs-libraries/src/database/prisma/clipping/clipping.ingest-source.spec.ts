import { resolveClippingIngestSource } from './clipping.ingest-source';

describe('resolveClippingIngestSource', () => {
  const signDownloadUrl = jest.fn(async (key: string) => {
    return `https://cdn.example.com/${key}?X-Amz-Signature=fresh`;
  });

  beforeEach(() => {
    signDownloadUrl.mockClear();
    process.env.FRONTEND_URL = 'http://localhost:4200';
    process.env.CLOUDFLARE_BUCKET_URL = 'https://cdn.example.com';
  });

  it('uses oxylabs for YouTube when mediaId is absent', async () => {
    const source = await resolveClippingIngestSource({
      url: 'https://www.youtube.com/watch?v=abc',
      storage: { signDownloadUrl } as any,
    });

    expect(source).toEqual({
      url: 'https://www.youtube.com/watch?v=abc',
      via: 'oxylabs',
    });
    expect(signDownloadUrl).not.toHaveBeenCalled();
  });

  it('signs a fresh S3/R2 URL at call time for cloud media', async () => {
    const source = await resolveClippingIngestSource({
      url: 'https://cdn.example.com/old.mp4?X-Amz-Signature=expired',
      mediaId: 'media-1',
      media: {
        name: 'video.mp4',
        path: 'https://cdn.example.com/video.mp4',
      },
      storage: { signDownloadUrl } as any,
      bucketUrl: 'https://cdn.example.com',
    });

    expect(source.via).toBe('direct');
    expect(source.url).toContain('X-Amz-Signature=fresh');
    expect(signDownloadUrl).toHaveBeenCalledWith('video.mp4');
  });

  it('builds a local FRONTEND_URL path without signing', async () => {
    const source = await resolveClippingIngestSource({
      url: '/uploads/a.mp4',
      mediaId: 'media-1',
      media: {
        name: 'a.mp4',
        path: '/uploads/2026/01/01/a.mp4',
      },
      storage: {} as any,
      bucketUrl: 'https://cdn.example.com',
    });

    expect(source).toEqual({
      url: 'http://localhost:4200/uploads/2026/01/01/a.mp4',
      via: 'direct',
    });
  });
});
