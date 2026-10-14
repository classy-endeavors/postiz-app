import { humanizePostError } from './humanize.post.error';

describe('humanizePostError', () => {
  it('returns plain strings unchanged', () => {
    expect(humanizePostError('Simple failure')).toBe('Simple failure');
  });

  it('extracts TikTok audit message from Temporal JSON blob', () => {
    const blob = {
      cause: {
        failure: {
          message:
            'TikTok only allows private posts until this app passes its audit: set your TikTok account to Private and choose "Only me" in the post settings',
          source: 'TypeScriptSDK',
          applicationFailureInfo: { type: 'bad_body', nonRetryable: true },
        },
        type: 'bad_body',
        nonRetryable: true,
      },
      failure: { message: 'Activity task failed' },
      activityType: 'postSocialPending',
    };

    expect(humanizePostError(JSON.stringify(blob))).toBe(
      'TikTok only allows private posts until this app passes its audit: set your TikTok account to Private and choose "Only me" in the post settings'
    );
  });

  it('maps Instagram container ERROR to a readable message', () => {
    const blob = {
      cause: {
        failure: { message: 'ERROR' },
        details: [
          {
            identifier: 'instagram',
            json: '{"status_code":"ERROR","status":"ERROR"}',
            body: '{}',
          },
        ],
      },
    };

    expect(humanizePostError(blob)).toMatch(/could not process the media/i);
  });

  it('falls back for empty input', () => {
    expect(humanizePostError(null)).toBe(
      'An error occurred while publishing this post'
    );
  });
});
