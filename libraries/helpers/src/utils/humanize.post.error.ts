const GENERIC_ERROR = new Set([
  'unknown error',
  'an unknown error occurred',
  'error',
  'activity task failed',
]);

// Pull a sentence out of a provider body (Graph API, etc.) instead of
// leaving the user with "Unknown Error".
export function extractProviderErrorMessage(raw: unknown): string | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    if (
      !trimmed.startsWith('<') &&
      trimmed.length <= 400 &&
      !GENERIC_ERROR.has(trimmed.toLowerCase())
    ) {
      return trimmed;
    }
    return undefined;
  }

  const candidates = [
    parsed?.error?.error_user_msg,
    parsed?.error?.error_user_title,
    parsed?.error?.message,
    parsed?.error_message,
    parsed?.message,
    typeof parsed?.error === 'string' ? parsed.error : undefined,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const text = candidate.replace(/\s+/g, ' ').trim();
    if (!text || GENERIC_ERROR.has(text.toLowerCase())) {
      continue;
    }
    if (text.startsWith('{') || text.startsWith('[')) {
      const nested = extractProviderErrorMessage(text);
      if (nested) {
        return nested;
      }
      continue;
    }
    return text.length > 400 ? `${text.slice(0, 399)}…` : text;
  }

  return undefined;
}

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
      !GENERIC_ERROR.has(m.trim().toLowerCase()) &&
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
      const fromBody = extractProviderErrorMessage(detail.json);
      if (fromBody) {
        return truncateMessage(fromBody);
      }
      try {
        const inner = JSON.parse(detail.json);
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
