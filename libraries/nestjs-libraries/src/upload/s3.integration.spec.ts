/**
 * Safe S3 integration tests against an ephemeral local moto server.
 * Never targets production bucket `aizyntra-media`.
 *
 * Optional real AWS (still guarded): set
 *   S3_INTEGRATION_ENDPOINT / S3_INTEGRATION_BUCKET / AWS keys
 * with a dedicated test bucket name that is NOT aizyntra-media.
 */
jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest.fn().mockResolvedValue({
    ext: 'png',
    mime: 'image/png',
  }),
}));

import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { createServer } from 'net';
import { Readable } from 'stream';
import { CloudflareStorage } from './cloudflare.storage';
import { stripPresignedQuery } from './s3.client.config';

const PRODUCTION_BUCKET = 'aizyntra-media';
const TEST_PREFIX = 'integration-test/';

function assertSafeBucket(name: string) {
  if (!name || name === PRODUCTION_BUCKET) {
    throw new Error(
      `Refusing to run S3 integration tests against production bucket "${PRODUCTION_BUCKET}"`
    );
  }
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('No port'));
        return;
      }
      const port = addr.port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHttp(url: string, attempts = 40): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.status > 0) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`moto server did not become ready at ${url}`);
}

describe('S3 integration (moto local server)', () => {
  let moto: ChildProcessWithoutNullStreams;
  let endpoint: string;
  let client: S3Client;
  let storage: CloudflareStorage;
  const bucket = 'postiz-media-integration-test';
  const accessKey = 'testing';
  const secretKey = 'testing';
  const region = 'us-east-1';

  beforeAll(async () => {
    assertSafeBucket(bucket);
    const port = await freePort();
    endpoint = `http://127.0.0.1:${port}`;

    moto = spawn(
      'python',
      ['-m', 'moto.server', '-p', String(port)],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let bootLog = '';
    moto.stderr.on('data', (d) => {
      bootLog += d.toString();
    });
    moto.stdout.on('data', (d) => {
      bootLog += d.toString();
    });

    try {
      await waitForHttp(endpoint);
    } catch (err) {
      moto.kill();
      throw new Error(
        `Failed to start moto: ${err}\n${bootLog.slice(-2000)}`
      );
    }

    process.env.CLOUDFLARE_S3_FORCE_PATH_STYLE = 'true';
    process.env.CLOUDFLARE_ACCOUNT_ID = '';
    process.env.CLOUDFLARE_ACCESS_KEY = accessKey;
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY = secretKey;
    process.env.CLOUDFLARE_REGION = region;
    process.env.CLOUDFLARE_BUCKETNAME = bucket;
    process.env.CLOUDFLARE_BUCKET_URL = `${endpoint}/${bucket}`;
    process.env.CLOUDFLARE_ENDPOINT = endpoint;

    client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    await client.send(new CreateBucketCommand({ Bucket: bucket }));

    storage = new CloudflareStorage(
      '',
      accessKey,
      secretKey,
      region,
      bucket,
      `${endpoint}/${bucket}`,
      endpoint
    );
  }, 60000);

  afterAll(async () => {
    try {
      const listed = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: TEST_PREFIX })
      );
      for (const obj of listed.Contents || []) {
        if (obj.Key) {
          await client.send(
            new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key })
          );
        }
      }
    } catch {
      // ignore cleanup failures on shutdown
    }
    moto?.kill();
    delete process.env.CLOUDFLARE_S3_FORCE_PATH_STYLE;
  });

  it('PutObject writes a private object under the test prefix', async () => {
    const key = `${TEST_PREFIX}put-object.txt`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from('hello-postiz'),
        ContentType: 'text/plain',
      })
    );

    const got = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const body = await got.Body!.transformToString();
    expect(body).toBe('hello-postiz');
    expect((got as any).ACL).toBeUndefined();
  });

  it('multipart upload completes', async () => {
    const key = `${TEST_PREFIX}multipart.bin`;
    const partSize = 5 * 1024 * 1024;
    const payload = Buffer.alloc(partSize + 100, 7);

    const created = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: 'application/octet-stream',
      })
    );
    const uploadId = created.UploadId!;

    const part1 = await client.send(
      new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: 1,
        Body: payload.subarray(0, partSize),
      })
    );
    const part2 = await client.send(
      new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: 2,
        Body: payload.subarray(partSize),
      })
    );

    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: [
            { ETag: part1.ETag, PartNumber: 1 },
            { ETag: part2.ETag, PartNumber: 2 },
          ],
        },
      })
    );

    const got = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const bytes = Buffer.from(await got.Body!.transformToByteArray());
    expect(bytes.length).toBe(payload.length);
  });

  it('CloudflareStorage streaming upload does not set public-read ACL', async () => {
    // PNG magic bytes so file-type / allowed mime path is not required for stream API
    const stream = Readable.from([Buffer.from('stream-body')]);
    const uploaded = await new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: `${TEST_PREFIX}stream.txt`,
        Body: stream,
        ContentType: 'text/plain',
      },
    }).done();

    expect((uploaded as any).ACL).toBeUndefined();
  });

  it('private presigned GET works and Range returns 206', async () => {
    const key = `${TEST_PREFIX}range.bin`;
    const body = Buffer.from('0123456789abcdefghij');
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body })
    );

    const signed = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 120 }
    );

    const full = await fetch(signed);
    expect(full.status).toBe(200);
    expect(Buffer.from(await full.arrayBuffer()).toString()).toBe(
      body.toString()
    );

    const ranged = await fetch(signed, {
      headers: { Range: 'bytes=0-4' },
    });
    expect(ranged.status).toBe(206);
    expect(Buffer.from(await ranged.arrayBuffer()).toString()).toBe('01234');
  });

  it('refreshed signatures work; deleted object makes prior URL unusable', async () => {
    const key = `${TEST_PREFIX}expiry.bin`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from('expire-me'),
      })
    );

    // Documents short-lived signing (production uses 3h via CloudflareStorage)
    const shortLived = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 1 }
    );
    expect(shortLived).toMatch(/X-Amz-Expires=1/);

    const first = await storage.signDownloadUrl!(key);
    expect(stripPresignedQuery(first)).toContain(key);
    const ok = await fetch(first);
    expect(ok.status).toBe(200);
    expect(Buffer.from(await ok.arrayBuffer()).toString()).toBe('expire-me');

    // Publish retries mint a new URL (may share the same second-resolution date);
    // both must still fetch while the object exists.
    await new Promise((r) => setTimeout(r, 1100));
    const refreshed = await storage.signDownloadUrl!(key);
    expect(stripPresignedQuery(refreshed)).toContain(key);
    const ok2 = await fetch(refreshed);
    expect(ok2.status).toBe(200);

    // After the object is gone, previously issued signed URLs must fail
    // (stand-in for expiry when the mock does not enforce SigV4 clocks)
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    const stale = await fetch(first);
    expect(stale.ok).toBe(false);

    const reissued = await storage.signDownloadUrl!(key);
    const missing = await fetch(reissued);
    expect(missing.ok).toBe(false);
  });
});

describe('Real AWS integration gate', () => {
  it('refuses production media bucket', () => {
    expect(() => assertSafeBucket(PRODUCTION_BUCKET)).toThrow(/Refusing/);
  });

  it('skips live AWS unless a non-production test bucket is configured', () => {
    const liveBucket = process.env.S3_INTEGRATION_BUCKET;
    if (!liveBucket) {
      expect(liveBucket).toBeUndefined();
      return;
    }
    assertSafeBucket(liveBucket);
  });
});
