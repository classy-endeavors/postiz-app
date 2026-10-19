'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface ReplyProfile {
  enabled: boolean;
  website: string;
  fullVideoUrl: string;
  notes: string;
}

const empty: ReplyProfile = {
  enabled: false,
  website: '',
  fullVideoUrl: '',
  notes: '',
};

export const useReplyProfile = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/replies/profile')).json();
  }, []);

  return useSWR<ReplyProfile>('reply-profile', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
};

export const ReplySettings = () => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const { data, isLoading, mutate } = useReplyProfile();
  const [profile, setProfile] = useState<ReplyProfile>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setProfile({
        enabled: !!data.enabled,
        website: data.website || '',
        fullVideoUrl: data.fullVideoUrl || '',
        notes: data.notes || '',
      });
    }
  }, [data]);

  const save = useCallback(async () => {
    setSaving(true);
    const response = await fetch('/replies/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    setSaving(false);
    if (response.status !== 200) {
      toaster.show(t('reply_save_failed', 'Could not save comment replies'), 'warning');
      return;
    }
    await mutate(profile, { revalidate: false });
    toaster.show(t('settings_updated', 'Settings updated'), 'success');
  }, [profile]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[16px] mt-[24px] border border-newTableBorder rounded-[12px] p-[16px]">
      <div className="flex flex-col gap-[4px]">
        <h4 className="text-[16px] font-[600]">
          {t('comment_replies', 'Comment replies')}
        </h4>
        <div className="text-[13px] text-textItemBlur">
          {t(
            'comment_replies_help',
            'When someone comments on a YouTube or Instagram post published from here, reply only if the facts below answer them. A link is never invented. Each posted reply uses 1 coin. YouTube is checked every 10 minutes. Reconnect those channels after this is turned on so comment permission is included.'
          )}
        </div>
      </div>
      <label className="flex items-center gap-[8px] text-[14px]">
        <input
          type="checkbox"
          checked={profile.enabled}
          onChange={(event) =>
            setProfile({ ...profile, enabled: event.target.checked })
          }
        />
        {t('comment_replies_enabled', 'Reply to comments')}
      </label>
      <label className="flex flex-col gap-[6px] text-[13px]">
        {t('comment_replies_website', 'Website')}
        <input
          className="h-[40px] rounded-[8px] border border-newTableBorder bg-newBgColorInner px-[12px] text-[14px] outline-none"
          value={profile.website}
          maxLength={300}
          onChange={(event) =>
            setProfile({ ...profile, website: event.target.value })
          }
        />
      </label>
      <label className="flex flex-col gap-[6px] text-[13px]">
        {t('comment_replies_full_video', 'Full video link')}
        <input
          className="h-[40px] rounded-[8px] border border-newTableBorder bg-newBgColorInner px-[12px] text-[14px] outline-none"
          value={profile.fullVideoUrl}
          maxLength={300}
          onChange={(event) =>
            setProfile({ ...profile, fullVideoUrl: event.target.value })
          }
        />
      </label>
      <label className="flex flex-col gap-[6px] text-[13px]">
        {t('comment_replies_notes', 'Other facts people ask for')}
        <textarea
          className="min-h-[120px] rounded-[8px] border border-newTableBorder bg-newBgColorInner p-[12px] text-[14px] outline-none"
          value={profile.notes}
          maxLength={2000}
          onChange={(event) =>
            setProfile({ ...profile, notes: event.target.value })
          }
        />
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="self-start h-[36px] px-[14px] rounded-[8px] bg-btnPrimary text-white text-[13px] font-[600] disabled:opacity-60"
      >
        {t('save', 'Save')}
      </button>
    </div>
  );
};
