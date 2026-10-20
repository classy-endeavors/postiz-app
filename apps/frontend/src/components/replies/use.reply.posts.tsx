'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export interface ReplyPostLink {
  id: string;
  title: string;
  releaseURL: string;
  channel: string;
}

export interface ReplyPost {
  id: string;
  title: string;
  releaseURL: string;
  publishDate: string;
  channel: string;
  provider: string;
  enabled: boolean;
  links: ReplyPostLink[];
}

export const useReplyPosts = () => {
  const fetch = useFetch();
  const load = useCallback(async (): Promise<ReplyPost[]> => {
    const response = await fetch('/replies/posts');
    if (!response.ok) {
      return [];
    }
    const result = await response.json();
    return Array.isArray(result) ? result : [];
  }, [fetch]);

  return useSWR<ReplyPost[]>('reply-posts', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
};
