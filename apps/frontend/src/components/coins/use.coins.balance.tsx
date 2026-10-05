'use client';

import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useCallback } from 'react';
import useSWR from 'swr';

export const useCoinsBalance = () => {
  const fetch = useFetch();

  const load = useCallback(async (path: string) => {
    return (await (await fetch(path)).json()).balance as number;
  }, []);

  return useSWR('/coins/balance', load, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
};
