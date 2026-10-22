/**
 * Resolve remote media byte size without HEAD (GET-presigned S3 URLs reject HEAD)
 * and without buffering the whole object into memory.
 */

export function parseContentRangeTotal(header: string | null): number | null {
  if (!header) {
    return null;
  }
  // e.g. "bytes 0-0/3876814" or "bytes 0-1023/3876814"
  const match = /\/(\d+)\s*$/.exec(header);
  if (!match) {
    return null;
  }
  const total = Number(match[1]);
  return Number.isFinite(total) && total > 0 ? total : null;
}

async function discardBody(response: Response): Promise<void> {
  const body = response.body as
    | { cancel?: () => Promise<void> | void; getReader?: () => { cancel: () => Promise<void> } }
    | null
    | undefined;
  if (!body) {
    return;
  }
  try {
    if (typeof body.cancel === 'function') {
      await body.cancel();
      return;
    }
    if (typeof body.getReader === 'function') {
      await body.getReader().cancel();
      return;
    }
  } catch {
    // ignore cancel races
  }
  try {
    // Range responses are tiny; safe fallback when cancel is unavailable
    await response.arrayBuffer();
  } catch {
    // ignore
  }
}

/**
 * Prefer Range GET (works with GetObject-presigned URLs). Fall back to a full
 * GET's Content-Length while cancelling the body so the file is not buffered.
 */
export async function fetchRemoteMediaByteSize(
  path: string,
  options?: {
    fetchImpl?: typeof fetch;
    dispatcher?: unknown;
  }
): Promise<number | null> {
  const fetchImpl = options?.fetchImpl || fetch;
  const common = {
    method: 'GET' as const,
    headers: { 'accept-encoding': 'identity' },
    ...(options?.dispatcher ? { dispatcher: options.dispatcher } : {}),
  };

  const ranged = await fetchImpl(path, {
    ...common,
    headers: {
      ...common.headers,
      Range: 'bytes=0-0',
    },
  } as any);

  try {
    if (ranged.status === 206) {
      const fromRange = parseContentRangeTotal(
        ranged.headers.get('content-range')
      );
      if (fromRange) {
        return fromRange;
      }
    }

    // Server ignored Range and returned the full object
    if (ranged.status === 200) {
      const length = Number(ranged.headers.get('content-length'));
      if (Number.isFinite(length) && length > 0) {
        return length;
      }
    }
  } finally {
    await discardBody(ranged);
  }

  // Last resort: plain GET for Content-Length only (still cancel the body)
  const full = await fetchImpl(path, common as any);
  try {
    if (!full.ok) {
      return null;
    }
    const length = Number(full.headers.get('content-length'));
    if (Number.isFinite(length) && length > 0) {
      return length;
    }
    return null;
  } finally {
    await discardBody(full);
  }
}
