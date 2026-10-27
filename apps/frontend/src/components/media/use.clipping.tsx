'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export type ClippingStatusResponse = {
  id: string;
  status: string;
  error?: string | null;
  title?: string | null;
  duration?: number | null;
  billableMinutes?: number | null;
  estimatedMinutes?: number | null;
  clips: Array<{
    id: string;
    title: string;
    content: string;
    channelContents?: Record<string, string> | null;
    start: number;
    end: number;
    status: string;
    error?: string | null;
    path?: string | null;
    thumbnail?: string | null;
  }>;
};

export const useClippingStatus = (id?: string | null) => {
  const fetch = useFetch();

  return useSWR<ClippingStatusResponse>(
    id ? `/clipping/${id}` : null,
    async (path: string) => (await (await fetch(path)).json()) as ClippingStatusResponse,
    {
      refreshInterval: (data) =>
        data &&
        ['suggestions_ready', 'completed', 'failed', 'cancelled'].includes(
          data.status
        )
          ? 0
          : 3000,
    }
  );
};

export const useClippingActions = () => {
  const fetch = useFetch();

  const suggest = useCallback(
    async (body: {
      mediaId?: string;
      url?: string;
      integrations: string[];
      clips?: number;
      fit?: 'blur' | 'crop';
    }) => {
      const res = await fetch('/clipping/suggest', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Could not start repurpose');
      }
      return res.json() as Promise<{
        id: string;
        estimatedMinutes: number | null;
      }>;
    },
    [fetch]
  );

  const confirm = useCallback(
    async (
      id: string,
      body: {
        clipIds: string[];
        captions?: {
          clipId: string;
          integrationId: string;
          content: string;
        }[];
      }
    ) => {
      const res = await fetch(`/clipping/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Could not confirm');
      }
      return res.json();
    },
    [fetch]
  );

  const cancel = useCallback(
    async (id: string) => {
      const res = await fetch(`/clipping/${id}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Could not cancel');
      }
      return res.json();
    },
    [fetch]
  );

  return { suggest, confirm, cancel };
};
