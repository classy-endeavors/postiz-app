/**
 * Temporal / ApplicationFailure errors are often stored as a full JSON blob.
 * Calendar UI should show a short human message, not the stack/payload dump.
 */
export function humanizePostError(
  error: unknown,
  fallback = 'An error occurred while publishing this post'
): string {
  if (error == null || error === '') {
    return fallback;
  }

  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return truncateMessage(trimmed);
    }
    try {
      return humanizePostError(JSON.parse(trimmed), fallback);
    } catch {
      return truncateMessage(trimmed);
    }
  }

  if (typeof error !== 'object') {
    return fallback;
  }

  const obj = error as Record<string, any>;

  const candidates = [
    obj?.cause?.failure?.message,
    obj?.cause?.message,
    obj?.failure?.cause?.message,
    obj?.message,
  ].filter((m): m is string => typeof m === 'string' && m.trim().length > 0);

  const meaningful = candidates.find(
    (m) =>
      m !== 'Activity task failed' &&
      m !== 'ERROR' &&
      !m.startsWith('Activity task failed')
  );
  if (meaningful) {
    return truncateMessage(meaningful);
  }

  // Provider details sometimes carry a clearer API error
  const detail =
    obj?.cause?.details?.[0] ||
    obj?.details?.[0] ||
    obj?.cause?.failure?.applicationFailureInfo?.details;
  if (detail && typeof detail === 'object') {
    if (typeof detail.json === 'string') {
      try {
        const inner = JSON.parse(detail.json);
        if (typeof inner?.error?.message === 'string') {
          return truncateMessage(inner.error.message);
        }
        if (inner?.status_code === 'ERROR' || inner?.status === 'ERROR') {
          return 'The platform could not process the media. Please try again or re-upload the file.';
        }
      } catch {
        // ignore
      }
    }
  }

  if (candidates.includes('ERROR')) {
    return 'The platform could not process the media. Please try again or re-upload the file.';
  }

  return fallback;
}

function truncateMessage(message: string, max = 400): string {
  const cleaned = message.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) {
    return cleaned;
  }
  return `${cleaned.slice(0, max - 1)}…`;
}
