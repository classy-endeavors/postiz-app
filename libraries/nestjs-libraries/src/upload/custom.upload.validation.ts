import { BadRequestException } from '@nestjs/common';
import { pipeline, Readable, Transform } from 'stream';
import { IUploadProvider } from './upload.interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fileTypeStream } = require('file-type');

// What users may put in the media library, whether by multipart upload or
// from a remote URL; narrower than what storage itself accepts, no audio
export const UPLOAD_ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'video/mp4',
]);

export function getMaxSize(mimeType: string): number {
  if (mimeType.startsWith('image/')) {
    return 10 * 1024 * 1024; // 10 MB
  } else if (mimeType.startsWith('video/')) {
    return 1024 * 1024 * 1024; // 1 GB
  } else {
    throw new BadRequestException('Unsupported file type.');
  }
}

// Google Drive /file/d/<id>/view (and open?id=) URLs serve an HTML viewer.
// Agents and users paste those share links; rewrite to the public download
// endpoint so upload-from-URL gets the real file bytes.
export function googleDriveFileId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host !== 'drive.google.com' && host !== 'docs.google.com') {
      return null;
    }
    const fromPath = parsed.pathname.match(/\/(?:file\/d|uc\/d)\/([^/]+)/);
    if (fromPath?.[1]) {
      return fromPath[1];
    }
    return parsed.searchParams.get('id');
  } catch {
    return null;
  }
}

export function resolveRemoteUploadUrl(url: string): string {
  const id = googleDriveFileId(url);
  if (!id) {
    return url;
  }
  // confirm=t skips the large-file virus-scan interstitial for public files
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
    id
  )}&confirm=t`;
}

export function googleDriveConfirmDownload(
  resolvedUrl: string,
  html: string,
  response: globalThis.Response
): { url: string; headers?: Record<string, string> } | null {
  const id = googleDriveFileId(resolvedUrl);
  if (!id) {
    return null;
  }

  const confirm =
    html.match(/confirm=([0-9A-Za-z_-]+)/)?.[1] ||
    html.match(/name="confirm"\s+value="([^"]+)"/)?.[1] ||
    't';

  const cookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
  const cookieHeader = cookies
    .map((entry) => entry.split(';')[0])
    .filter(Boolean)
    .join('; ');

  return {
    url: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
      id
    )}&confirm=${encodeURIComponent(confirm)}`,
    ...(cookieHeader ? { headers: { cookie: cookieHeader } } : {}),
  };
}

// Passes bytes through and fails once they exceed maxSize, so a body with a
// missing or lying Content-Length cannot be streamed into storage unbounded
export function maxSizeStream(maxSize: number) {
  let total = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      total += chunk.length;
      if (total > maxSize) {
        return callback(new BadRequestException('File is too large.'));
      }
      callback(null, chunk);
    },
  });
}

// Sniffs the real type from the first bytes, applies the per-type size cap
// and streams the rest into storage, so only the sniffing prefix and a few
// upload parts are ever in memory. Rejections are BadRequestException with
// the same messages the old buffer validation used. `declaredSize` is the
// Content-Length when the sender gave one; it may be absent or wrong, so the
// stream cap is what really enforces the limit
export async function uploadStreamToStorage(
  storage: IUploadProvider,
  webStream: ReadableStream,
  declaredSize = 0
) {
  let sniffed: ReadableStream & { fileType?: { mime: string; ext: string } };
  try {
    sniffed = await fileTypeStream(webStream);
  } catch (err) {
    throw new BadRequestException('Failed to read file', { cause: err });
  }
  const detected = sniffed.fileType;
  if (!detected || !UPLOAD_ALLOWED_MIME.has(detected.mime)) {
    await sniffed.cancel();
    throw new BadRequestException('Unsupported file type.');
  }

  const maxSize = getMaxSize(detected.mime);
  if (declaredSize > maxSize) {
    await sniffed.cancel();
    throw new BadRequestException('File is too large.');
  }

  // pipeline (not pipe) so failing the cap also tears down the source
  const body = pipeline(
    Readable.fromWeb(sniffed as any),
    maxSizeStream(maxSize),
    () => {}
  );

  try {
    const uploaded = await storage.uploadStream(
      body,
      detected.mime,
      detected.ext
    );
    return { ...uploaded, ext: detected.ext };
  } catch (err) {
    // The size cap rejects mid-upload with its own BadRequestException
    body.destroy();
    throw err;
  }
}
