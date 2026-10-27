describe('clipping draft caption resolution', () => {
  const resolveContent = (
    clip: {
      content: string;
      channelContents?: Record<string, string> | null;
    },
    integrationId: string
  ) => {
    const channelContents =
      clip.channelContents &&
      typeof clip.channelContents === 'object' &&
      !Array.isArray(clip.channelContents)
        ? clip.channelContents
        : null;
    return channelContents?.[integrationId] || clip.content;
  };

  it('uses per-channel caption when present', () => {
    expect(
      resolveContent(
        {
          content: 'shared',
          channelContents: { a: 'for-a', b: 'for-b' },
        },
        'a'
      )
    ).toBe('for-a');
  });

  it('falls back to shared content for one-shot clips', () => {
    expect(
      resolveContent({ content: 'shared', channelContents: null }, 'a')
    ).toBe('shared');
  });

  it('falls back when channel missing from map', () => {
    expect(
      resolveContent(
        { content: 'shared', channelContents: { a: 'for-a' } },
        'b'
      )
    ).toBe('shared');
  });
});
