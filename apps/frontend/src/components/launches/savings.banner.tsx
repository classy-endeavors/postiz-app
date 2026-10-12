'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';

interface SavingsResponse {
  posts: number;
  channels: number;
  since: string | null;
  minutes: number;
  dollars: number;
  hourlyRate: number;
  minutesPer: {
    post: number;
    images: number;
    video: number;
    title: number;
    comment: number;
  };
}

interface UpgradeRequest {
  id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  reviewedAt: string | null;
}

interface UpgradeResponse {
  canUpgrade: boolean;
  requests: UpgradeRequest[];
}

const useSavings = () => {
  const fetch = useFetch();
  const load = useCallback(async (path: string) => {
    return (await (await fetch(path)).json()) as SavingsResponse;
  }, []);
  return useSWR('/posts/savings', load, {
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
  });
};

const useUpgrade = () => {
  const fetch = useFetch();
  const load = useCallback(async (path: string) => {
    return (await (await fetch(path)).json()) as UpgradeResponse;
  }, []);
  return useSWR('/upgrades', load, {
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
  });
};

// Counts up from the previous value, so a new post visibly adds to the total
const useCountUp = (value: number) => {
  const [shown, setShown] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    const from = current.current;
    const started = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / 1200);
      const eased = 1 - Math.pow(1 - progress, 3);
      current.current = Math.round(from + (value - from) * eased);
      setShown(current.current);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
};

const statusStyle: Record<UpgradeRequest['status'], string> = {
  pending: 'bg-newButter text-black',
  approved: 'bg-statusPublishedBg text-statusPublished',
  declined: 'bg-boxHover text-newTextColor',
};

const UpgradeModal: FC<{ close: () => void }> = ({ close }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const { data, mutate } = useUpgrade();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const statuses: Record<UpgradeRequest['status'], string> = {
    pending: t('upgrade_status_pending', 'Pending review'),
    approved: t('upgrade_status_approved', 'Approved'),
    declined: t('upgrade_status_declined', 'Declined'),
  };
  const pending = data?.requests.find((r) => r.status === 'pending');

  const send = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/upgrades/request', {
      method: 'POST',
      body: JSON.stringify({ message: message || undefined }),
    });
    setLoading(false);
    if (!response.ok) {
      const { message: error } = await response.json().catch(() => ({}));
      toaster.show(
        typeof error === 'string'
          ? error
          : t('upgrade_request_failed', 'Could not send the request'),
        'warning'
      );
      return;
    }
    toaster.show(
      t(
        'upgrade_request_sent',
        'Request sent, the AI Zyntra team will get back to you soon'
      ),
      'success'
    );
    setMessage('');
    mutate();
  }, [message]);

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="text-[14px] text-textItemBlur">
        {t(
          'upgrade_description',
          'Tell us what you need and the AI Zyntra team will set up the right plan for you. You will get a notification as soon as your request is reviewed.'
        )}
      </div>
      {!data?.canUpgrade ? (
        <div className="rounded-[12px] bg-statusPublishedBg text-statusPublished px-[16px] py-[12px] text-[14px] font-[600]">
          {t('upgrade_already', 'Your account is already upgraded.')}
        </div>
      ) : pending ? (
        <div className="rounded-[12px] bg-newButter text-black px-[16px] py-[12px] text-[14px]">
          {t(
            'upgrade_pending_notice',
            'Your request from {{date}} is waiting for review. We will notify you here when it is approved.',
            { date: dayjs(pending.createdAt).format('MMM D, YYYY') }
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          <Input
            label={t('message_optional', 'Message (optional)')}
            name="upgradeMessage"
            disableForm={true}
            removeError={true}
            maxLength={500}
            placeholder={t(
              'upgrade_request_placeholder',
              'How many channels and posts do you need? Anything else we should know?'
            )}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-[8px]">
            <Button className="rounded-[8px]" loading={loading} onClick={send}>
              {t('send_upgrade_request', 'Request upgrade')}
            </Button>
            <Button secondary className="rounded-[8px]" onClick={close}>
              {t('cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      )}
      {!!data?.requests.length && (
        <div className="flex flex-col gap-[8px]">
          <div className="text-[14px] font-[700]">
            {t('your_upgrade_requests', 'Your requests')}
          </div>
          {data.requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between gap-[12px] px-[12px] py-[10px] rounded-[10px] border border-newTableBorder text-[14px]"
            >
              <div className="min-w-0">
                <div>{dayjs(request.createdAt).format('MMM D, YYYY h:mm A')}</div>
                {!!request.message && (
                  <div className="text-[12px] text-textItemBlur truncate">
                    {request.message}
                  </div>
                )}
              </div>
              <span
                className={clsx(
                  'shrink-0 inline-flex px-[10px] py-[2px] rounded-full text-[12px] font-[600]',
                  statusStyle[request.status]
                )}
              >
                {statuses[request.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SavingsBanner: FC = () => {
  const t = useT();
  const modals = useModals();
  const { data } = useSavings();
  const { data: upgrade } = useUpgrade();
  const dollars = useCountUp(data?.dollars || 0);
  const minutes = useCountUp(data?.minutes || 0);

  const openUpgrade = useCallback(() => {
    modals.openModal({
      title: t('upgrade_your_account', 'Upgrade your account'),
      children: (close) => <UpgradeModal close={close} />,
    });
  }, []);

  if (!data) {
    return null;
  }

  const clock = [
    { value: Math.floor(minutes / 1440), label: t('days_short', 'd') },
    { value: Math.floor((minutes % 1440) / 60), label: t('hours_short', 'h') },
    { value: minutes % 60, label: t('minutes_short', 'm') },
  ];
  const pending = upgrade?.requests.some((r) => r.status === 'pending');
  const explanation = t(
    'savings_explanation',
    'Estimated from your published posts, counted once per channel: {{post}} min to post by hand, +{{images}} min with images, +{{video}} min with video, +{{title}} min with a title, +{{comment}} min per comment or thread item, valued at ${{rate}}/hour.',
    { ...data.minutesPer, rate: data.hourlyRate }
  );

  return (
    <div className="flex items-center gap-[24px] mobile:flex-wrap mobile:justify-between mobile:gap-[10px] px-[22px] py-[16px] mobile:p-[12px] rounded-[20px] mobile:rounded-[14px] border-[1.5px] border-newOutline bg-btnPrimary text-white shadow-hard">
      <div className="flex items-center gap-[14px] min-w-0">
        <div className="w-[48px] h-[48px] shrink-0 rounded-full bg-white/15 flex items-center justify-center mobile:hidden">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-[6px] text-[13px] font-[600] text-white/85">
            {t('saved_with_zyntra', 'Saved with AI Zyntra')}
            <span
              className="cursor-help"
              data-tooltip-id="tooltip"
              data-tooltip-content={explanation}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <div className="text-[34px] mobile:text-[26px] font-heading font-[800] leading-[1.1]">
            ${dollars.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="w-[1px] self-stretch bg-white/25 mobile:hidden" />

      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center gap-[6px] text-[13px] font-[600] text-white/85">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {t('time_saved', 'Time saved')}
        </div>
        <div className="flex items-end gap-[6px]">
          {clock.map((unit) => (
            <div key={unit.label} className="flex items-end gap-[2px]">
              <span className="min-w-[44px] mobile:min-w-[34px] text-center rounded-[8px] bg-white/15 px-[8px] mobile:px-[5px] py-[2px] text-[22px] mobile:text-[18px] font-heading font-[800] tabular-nums">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="text-[13px] text-white/85 pb-[4px]">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 text-[13px] mobile:basis-full mobile:text-[12px] text-white/85">
        {data.posts
          ? t(
              'savings_summary',
              '{{posts}} posts published on {{channels}} channels since {{date}}',
              {
                posts: data.posts.toLocaleString(),
                channels: data.channels,
                date: dayjs(data.since).format('MMM D, YYYY'),
              }
            )
          : t(
              'savings_empty',
              'Publish your first post and watch your savings grow'
            )}
      </div>

      {!!upgrade?.canUpgrade && (
        <button
          type="button"
          onClick={openUpgrade}
          className={clsx(
            'shrink-0 h-[40px] mobile:h-[36px] mobile:basis-full px-[18px] rounded-[10px] text-[14px] font-[700] transition-opacity hover:opacity-90',
            pending
              ? 'bg-white/15 text-white border border-white/40'
              : 'bg-white text-btnPrimary'
          )}
        >
          {pending
            ? t('upgrade_requested', 'Upgrade requested')
            : t('upgrade_to_save_more', 'Upgrade to save more')}
        </button>
      )}
    </div>
  );
};
