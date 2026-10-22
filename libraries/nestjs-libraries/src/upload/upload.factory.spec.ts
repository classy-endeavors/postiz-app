jest.mock('./local.storage', () => ({
  LocalStorage: jest.fn().mockImplementation(() => ({
    kind: 'local',
  })),
}));

jest.mock('./cloudflare.storage', () => ({
  CloudflareStorage: jest.fn().mockImplementation(() => ({
    publicUrl: (name: string) =>
      `https://aizyntra-media.s3.us-east-1.amazonaws.com/${name}`,
    signDownloadUrl: jest.fn(),
  })),
}));

import { UploadFactory } from './upload.factory';
import { LocalStorage } from './local.storage';
import { CloudflareStorage } from './cloudflare.storage';

describe('UploadFactory', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    jest.clearAllMocks();
  });

  it('creates local storage by default', () => {
    process.env.STORAGE_PROVIDER = 'local';
    process.env.UPLOAD_DIRECTORY = '/tmp/uploads';
    UploadFactory.createStorage();
    expect(LocalStorage).toHaveBeenCalledWith('/tmp/uploads');
  });

  it('throws on invalid provider (no silent local fallback)', () => {
    process.env.STORAGE_PROVIDER = 's3';
    expect(() => UploadFactory.createStorage()).toThrow(/Invalid storage type/);
  });

  it('throws when cloudflare env is incomplete', () => {
    process.env.STORAGE_PROVIDER = 'cloudflare';
    delete process.env.CLOUDFLARE_BUCKETNAME;
    delete process.env.CLOUDFLARE_REGION;
    delete process.env.CLOUDFLARE_BUCKET_URL;
    delete process.env.CLOUDFLARE_ENDPOINT;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    expect(() => UploadFactory.createStorage()).toThrow(/CLOUDFLARE_BUCKETNAME/);
    expect(CloudflareStorage).not.toHaveBeenCalled();
  });

  it('constructs cloudflare storage for Amazon S3 with empty keys', () => {
    process.env.STORAGE_PROVIDER = 'cloudflare';
    process.env.CLOUDFLARE_ACCOUNT_ID = '';
    process.env.CLOUDFLARE_ACCESS_KEY = '';
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY = '';
    process.env.CLOUDFLARE_BUCKETNAME = 'aizyntra-media';
    process.env.CLOUDFLARE_BUCKET_URL =
      'https://aizyntra-media.s3.us-east-1.amazonaws.com';
    process.env.CLOUDFLARE_REGION = 'us-east-1';
    process.env.CLOUDFLARE_ENDPOINT = 'https://s3.us-east-1.amazonaws.com';

    const storage = UploadFactory.createStorage();
    expect(CloudflareStorage).toHaveBeenCalled();
    expect(storage.publicUrl?.('file.mp4')).toBe(
      'https://aizyntra-media.s3.us-east-1.amazonaws.com/file.mp4'
    );
    expect(typeof storage.signDownloadUrl).toBe('function');
  });
});
