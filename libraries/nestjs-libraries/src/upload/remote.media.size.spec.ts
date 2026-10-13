import {
  fetchRemoteMediaByteSize,
  parseContentRangeTotal,
} from './remote.media.size';

describe('parseContentRangeTotal', () => {
  it('parses the total size from a Content-Range header', () => {
    expect(parseContentRangeTotal('bytes 0-0/3876814')).toBe(3876814);
    expect(parseContentRangeTotal('bytes 0-1023/2048')).toBe(2048);
  });

  it('rejects missing or unknown totals', () => {
    expect(parseContentRangeTotal(null)).toBeNull();
    expect(parseContentRangeTotal('bytes 0-0/*')).toBeNull();
    expect(parseContentRangeTotal('invalid')).toBeNull();
  });
});

describe('fetchRemoteMediaByteSize (GET vs HEAD)', () => {
  it('uses Range GET and Content-Range — never HEAD (GET-presigned S3)', async () => {
    const calls: Array<{ method?: string; headers?: Record<string, string> }> =
      [];
    const fetchImpl = jest.fn(async (_url: string, init?: any) => {
      calls.push({ method: init?.method, headers: init?.headers });
      return {
        status: 206,
        ok: true,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === 'content-range'
              ? 'bytes 0-0/3876814'
              : name.toLowerCase() === 'content-length'
              ? '1'
              : null,
        },
        body: { cancel: jest.fn(async () => undefined) },
        arrayBuffer: async () => new ArrayBuffer(1),
      } as any;
    });

    const size = await fetchRemoteMediaByteSize(
      'https://aizyntra-media.s3.us-east-1.amazonaws.com/a.mp4?X-Amz-Signature=get',
      { fetchImpl: fetchImpl as any }
    );

    expect(size).toBe(3876814);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].headers?.Range).toBe('bytes=0-0');
    expect(calls.every((c) => c.method !== 'HEAD')).toBe(true);
  });

  it('falls back to Content-Length when the server ignores Range', async () => {
    const cancel = jest.fn(async () => undefined);
    const fetchImpl = jest.fn(async () => ({
      status: 200,
      ok: true,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-length' ? '9999' : null,
      },
      body: { cancel },
      arrayBuffer: async () => new ArrayBuffer(0),
    }));

    const size = await fetchRemoteMediaByteSize('https://cdn.example/a.mp4', {
      fetchImpl: fetchImpl as any,
    });

    expect(size).toBe(9999);
    expect(cancel).toHaveBeenCalled();
  });

  it('cancels the body and returns null when size cannot be determined', async () => {
    const cancel = jest.fn(async () => undefined);
    const fetchImpl = jest.fn(async () => ({
      status: 403,
      ok: false,
      headers: { get: () => null },
      body: { cancel },
      arrayBuffer: async () => new ArrayBuffer(0),
    }));

    const size = await fetchRemoteMediaByteSize(
      'https://aizyntra-media.s3.us-east-1.amazonaws.com/missing.mp4',
      { fetchImpl: fetchImpl as any }
    );

    expect(size).toBeNull();
    expect(cancel).toHaveBeenCalled();
  });
});
