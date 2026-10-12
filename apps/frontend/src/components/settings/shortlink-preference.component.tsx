'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { DropdownSelect } from '@gitroom/react/form/dropdown.select';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

type ShortLinkPreference = 'ASK' | 'YES' | 'NO';

interface ShortlinkPreferenceResponse {
  shortlink: ShortLinkPreference;
}

export const useShortlinkPreference = () => {
  const fetch = useFetch();

  const load = useCallback(async () => {
    return (await fetch('/settings/shortlink')).json();
  }, []);

  return useSWR<ShortlinkPreferenceResponse>('shortlink-preference', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
};

const ShortlinkPreferenceComponent = () => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const { data, isLoading, mutate } = useShortlinkPreference();

  const [localValue, setLocalValue] = useState<ShortLinkPreference>('ASK');

  const shortlinkOptions = [
    { value: 'ASK', label: t('shortlink_ask', 'Ask every time') },
    { value: 'YES', label: t('shortlink_yes', 'Always shortlink') },
    { value: 'NO', label: t('shortlink_no', 'Never shortlink') },
  ];

  // Sync local state with fetched data
  useEffect(() => {
    if (data?.shortlink) {
      setLocalValue(data.shortlink);
    }
  }, [data]);

  const handleChange = useCallback(
    async (next: string) => {
      const newValue = next as ShortLinkPreference;

      // Update local state immediately
      setLocalValue(newValue);

      await fetch('/settings/shortlink', {
        method: 'POST',
        body: JSON.stringify({ shortlink: newValue }),
      });

      mutate({ shortlink: newValue });
      toaster.show(t('settings_updated', 'Settings updated'), 'success');
    },
    [fetch, mutate, toaster, t]
  );

  if (isLoading) {
    return (
      <div className="my-[16px] mt-[16px] bg-sixth border-fifth border rounded-[4px] p-[24px]">
        <div className="animate-pulse">{t('loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="my-[16px] mt-[16px] bg-sixth border-fifth border rounded-[4px] p-[24px] flex flex-col gap-[24px]">
      <div className="mt-[4px] font-heading font-[700] text-[16px]">
        {t('shortlink_settings', 'Shortlink Settings')}
      </div>
      <div className="flex items-center justify-between gap-[24px] phone:flex-col phone:items-stretch">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="text-[14px]">
            {t('shortlink_preference', 'Shortlink Preference')}
          </div>
          <div className="text-[12px] text-customColor18">
            {t(
              'shortlink_preference_description',
              'Control how URLs in your posts are handled. Shortlinks provide click statistics.'
            )}
          </div>
        </div>
        <div className="w-[200px] phone:w-full shrink-0">
          <DropdownSelect
            name="shortlink"
            value={localValue}
            onChange={handleChange}
            options={shortlinkOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default ShortlinkPreferenceComponent;

