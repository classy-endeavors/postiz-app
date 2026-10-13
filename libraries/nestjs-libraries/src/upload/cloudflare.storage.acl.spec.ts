/**
 * Ensures PutObject / multipart upload params never request public-read ACLs.
 * We intercept the AWS SDK client used by CloudflareStorage.
 */
jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
      middlewareStack: { add: jest.fn() },
    })),
  };
});

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(({ params }) => ({
    params,
    done: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest.fn().mockResolvedValue({
    ext: 'png',
    mime: 'image/png',
  }),
}));

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { CloudflareStorage } from './cloudflare.storage';

describe('CloudflareStorage private uploads', () => {
  const storage = new CloudflareStorage(
    '',
    'AKIAEXAMPLE',
    'secret',
    'us-east-1',
    'aizyntra-media',
    'https://aizyntra-media.s3.us-east-1.amazonaws.com',
    'https://s3.us-east-1.amazonaws.com'
  );

  it('uploadFile does not set ACL public-read', async () => {
    const client = (storage as any)._client;
    await storage.uploadFile({
      buffer: Buffer.from('fakepng'),
      mimetype: 'image/png',
      size: 7,
    } as Express.Multer.File);

    expect(client.send).toHaveBeenCalled();
    const cmd = client.send.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    expect(cmd.input.ACL).toBeUndefined();
    expect(cmd.input.Bucket).toBe('aizyntra-media');
  });

  it('uploadStream does not set ACL public-read', async () => {
    await storage.uploadStream(Readable.from(['data']), 'image/png', 'png');
    expect(Upload).toHaveBeenCalled();
    const call = (Upload as jest.Mock).mock.calls.at(-1)[0];
    expect(call.params.ACL).toBeUndefined();
    expect(call.params.Bucket).toBe('aizyntra-media');
  });
});
