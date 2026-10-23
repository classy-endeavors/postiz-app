'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export type FeedPreviewItem = {
  id: string;
  postId?: string;
  group?: string;
  source: 'postiz' | 'platform';
  releaseId?: string | null;
  thumbnailUrl: string;
  caption?: string;
  publishDate: string;
  state: string;
  isReel: boolean;
  isScheduled: boolean;
  canReorder: boolean;
  permalink?: string;
};

export type FeedPreviewResponse = {
  integration: {
    id: string;
    name: string;
    picture?: string | null;
    providerIdentifier: string;
    profile?: string | null;
  };
  items: FeedPreviewItem[];
};

export const useFeedPreview = (integrationId: string | null) => {
  const fetch = useFetch();

  const load = useCallback(async () => {
    if (!integrationId) {
      return null;
    }
    const response = await fetch(
      `/posts/feed-preview?integration=${encodeURIComponent(integrationId)}`
    );
    if (!response.ok) {
      throw new Error('Failed to load feed preview');
    }
    return (await response.json()) as FeedPreviewResponse;
  }, [fetch, integrationId]);

  return useSWR(
    integrationId ? `/posts/feed-preview-${integrationId}` : null,
    load,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
    }
  );
};
