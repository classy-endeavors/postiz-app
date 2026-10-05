'use client';

import { FC, useCallback, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useUser } from '@gitroom/frontend/components/layout/user.context';

interface CoinsResponse {
  balance: number;
  monthly: number;
  costs: { message: number; image: number; post: number };
  thisMonth: { spent: number; added: number };
}

type HistoryFilter = 'all' | 'spent' | 'added';

// Charges made before prompts were recorded only have the generic label
const prompts = ['message', 'image'];
const defaults: Record<string, string> = {
  message: 'AI agent message',
  image: 'AI image generation',
};

interface CoinsHistoryResponse {
  transactions: {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
    balanceAfter: number | null;
  }[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const useCoins = () => {
  const fetch = useFetch();
  const load = useCallback(async (path: string) => {
    return (await (await fetch(path)).json()) as CoinsResponse;
  }, []);
  return useSWR('/coins', load, {
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
  });
};

const useCoinsHistory = (page: number, filter: HistoryFilter) => {
  const fetch = useFetch();
  const load = useCallback(async (path: string) => {
    return (await (await fetch(path)).json()) as CoinsHistoryResponse;
  }, []);
  return useSWR(`/coins/history?page=${page}&filter=${filter}`, load, {
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
    keepPreviousData: true,
  });
};

const CoinsHistory: FC = () => {
  const t = useT();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const { data } = useCoinsHistory(page, filter);

  const activities: Record<string, string> = {
    message: t('coins_activity_message', 'AI message'),
    image: t('coins_activity_image', 'AI image'),
    post: t('coins_activity_post', 'Post'),
    monthly_grant: t('coins_activity_monthly', 'Monthly coins'),
    admin_grant: t('coins_activity_added', 'Added by team'),
  };
  const filters: { value: HistoryFilter; label: string }[] = [
    { value: 'all', label: t('all', 'All') },
    { value: 'spent', label: t('coins_spent', 'Spent') },
    { value: 'added', label: t('coins_added', 'Added') },
  ];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const showBalance = filter === 'all';
  const columns = showBalance
    ? 'grid-cols-[150px_130px_1fr_80px_90px]'
    : 'grid-cols-[150px_130px_1fr_80px]';

  return (
    <div className="flex-[2] min-w-[320px] bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[12px]">
      <div className="flex items-center justify-between gap-[12px] flex-wrap">
        <div>
          <div className="text-[16px] font-heading font-[700]">
            {t('coins_history', 'Coin history')}
          </div>
          <div className="text-[13px] text-textItemBlur mt-[2px]">
            {t(
              'coins_history_description',
              'Every coin you spent or received, newest first.'
            )}
          </div>
        </div>
        <div className="flex p-[3px] rounded-[8px] border border-newTableBorder">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setPage(0);
                setFilter(item.value);
              }}
              className={clsx(
                'px-[12px] h-[30px] rounded-[6px] text-[13px] font-[600] transition-colors',
                filter === item.value
                  ? 'bg-boxFocused text-textItemFocused'
                  : 'text-textItemBlur hover:bg-boxHover'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div
            className={clsx(
              'grid gap-[12px] px-[12px] py-[8px] text-[12px] uppercase text-textItemBlur border-b border-newTableBorder',
              columns
            )}
          >
            <div>{t('date_and_time', 'Date & time')}</div>
            <div>{t('activity', 'Activity')}</div>
            <div>{t('details', 'Details')}</div>
            <div className="text-end">{t('coins', 'Coins')}</div>
            {showBalance && (
              <div className="text-end">{t('balance', 'Balance')}</div>
            )}
          </div>
          {!!data && !data.transactions.length && (
            <div className="px-[12px] py-[20px] text-[14px] text-textItemBlur">
              {t('no_coin_activity', 'No coin activity yet.')}
            </div>
          )}
          {data?.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className={clsx(
                'grid gap-[12px] px-[12px] py-[10px] text-[14px] items-center border-b border-newTableBorder last:border-b-0',
                columns
              )}
            >
              <div>
                <div>{dayjs(transaction.createdAt).format('MMM D, YYYY')}</div>
                <div className="text-[12px] text-textItemBlur">
                  {dayjs(transaction.createdAt).format('h:mm A')}
                </div>
              </div>
              <div>
                <span
                  className={clsx(
                    'inline-flex px-[10px] py-[2px] rounded-full text-[12px] font-[600]',
                    transaction.amount > 0
                      ? 'bg-statusPublishedBg text-statusPublished'
                      : 'bg-boxHover text-newTextColor'
                  )}
                >
                  {activities[transaction.type] || transaction.type}
                </span>
              </div>
              <div
                className="text-textItemBlur break-words line-clamp-2"
                title={transaction.description || undefined}
              >
                {prompts.includes(transaction.type) &&
                transaction.description !== defaults[transaction.type]
                  ? `“${transaction.description}”`
                  : transaction.description}
              </div>
              <div
                className={clsx(
                  'text-end font-[700]',
                  transaction.amount > 0
                    ? 'text-statusPublished'
                    : 'text-newTextColor'
                )}
              >
                {transaction.amount > 0 ? '+' : ''}
                {transaction.amount}
              </div>
              {showBalance && (
                <div className="text-end text-textItemBlur">
                  {transaction.balanceAfter}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!!data && data.total > data.limit && (
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-textItemBlur">
            {t('page_of', 'Page {{page}} of {{total}}', {
              page: page + 1,
              total: totalPages,
            })}
          </div>
          <div className="flex gap-[8px]">
            <Button
              secondary
              className="rounded-[8px]"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              {t('previous', 'Previous')}
            </Button>
            <Button
              className="rounded-[8px]"
              disabled={!data.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('next', 'Next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const RequestCoins: FC<{ onSent: () => void }> = ({ onSent }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [amount, setAmount] = useState('100');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const send = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/coins/request', {
      method: 'POST',
      body: JSON.stringify({ amount: +amount, message: message || undefined }),
    });
    setLoading(false);
    if (!response.ok) {
      const { message: error } = await response.json().catch(() => ({}));
      toaster.show(
        typeof error === 'string'
          ? error
          : t('coins_request_failed', 'Could not send the request'),
        'warning'
      );
      return;
    }
    toaster.show(
      t(
        'coins_request_sent',
        'Request sent, the AI Zyntra team will top up your coins soon'
      ),
      'success'
    );
    setMessage('');
    onSent();
  }, [amount, message]);

  return (
    <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[12px]">
      <div>
        <div className="text-[16px] font-heading font-[700]">
          {t('request_more_coins', 'Request more coins')}
        </div>
        <div className="text-[13px] text-textItemBlur mt-[2px]">
          {t(
            'request_more_coins_description',
            'Tell us how many coins you need and we will add them to your account.'
          )}
        </div>
      </div>
      <div className="flex gap-[8px] flex-wrap">
        {['100', '250', '500', '1000'].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={clsx(
              'px-[14px] h-[34px] rounded-[8px] border-[1.5px] text-[13px] font-[600] transition-colors',
              amount === preset
                ? 'border-btnPrimary bg-boxFocused text-textItemFocused'
                : 'border-newTableBorder hover:bg-boxHover'
            )}
          >
            {preset}
          </button>
        ))}
      </div>
      <Input
        label={t('amount', 'Amount')}
        name="amount"
        type="number"
        min={1}
        disableForm={true}
        removeError={true}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        label={t('message_optional', 'Message (optional)')}
        name="message"
        disableForm={true}
        removeError={true}
        maxLength={500}
        placeholder={t(
          'coins_request_placeholder',
          'What will you use the coins for?'
        )}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex">
        <Button
          className="rounded-[8px]"
          loading={loading}
          disabled={!(+amount >= 1)}
          onClick={send}
        >
          {t('send_request', 'Send request')}
        </Button>
      </div>
    </div>
  );
};

const GrantCoins: FC<{ onGranted: () => void }> = ({ onGranted }) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [organizationId, setOrganizationId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const grant = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/coins/grant', {
      method: 'POST',
      body: JSON.stringify({ organizationId, amount: +amount }),
    });
    setLoading(false);
    if (!response.ok) {
      toaster.show(t('coins_grant_failed', 'Could not add the coins'), 'warning');
      return;
    }
    toaster.show(t('coins_granted', 'Coins added'), 'success');
    setOrganizationId('');
    setAmount('');
    onGranted();
  }, [organizationId, amount]);

  return (
    <div className="bg-newBgColorInner border border-dashed border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[12px]">
      <div>
        <div className="text-[16px] font-heading font-[700]">
          {t('add_coins_admin', 'Add coins (admin)')}
        </div>
        <div className="text-[13px] text-textItemBlur mt-[2px]">
          {t(
            'add_coins_admin_description',
            'Use the organization ID from the Discord request. A negative amount removes coins.'
          )}
        </div>
      </div>
      <Input
        label={t('organization_id', 'Organization ID')}
        name="organizationId"
        disableForm={true}
        removeError={true}
        value={organizationId}
        onChange={(e) => setOrganizationId(e.target.value)}
      />
      <Input
        label={t('amount', 'Amount')}
        name="grantAmount"
        type="number"
        disableForm={true}
        removeError={true}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <div className="flex">
        <Button
          className="rounded-[8px]"
          loading={loading}
          disabled={!organizationId || !+amount}
          onClick={grant}
        >
          {t('add_coins', 'Add coins')}
        </Button>
      </div>
    </div>
  );
};

export const CoinsComponent: FC = () => {
  const t = useT();
  const user = useUser();
  const { mutate: globalMutate } = useSWRConfig();
  const { data, mutate } = useCoins();

  const reload = useCallback(() => {
    mutate();
    globalMutate(
      (key) => typeof key === 'string' && key.startsWith('/coins/')
    );
  }, []);

  if (!data) {
    return null;
  }

  const costs = [
    {
      label: t('coins_cost_message', 'AI agent message'),
      cost: data.costs.message,
    },
    {
      label: t('coins_cost_image', 'AI image generation'),
      cost: data.costs.image,
    },
    { label: t('coins_cost_post', 'Scheduled post'), cost: data.costs.post },
  ];

  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[20px] overflow-y-auto">
      <div className="flex gap-[20px] flex-wrap">
        <div className="flex-1 min-w-[280px] rounded-[16px] bg-btnPrimary text-white border-[1.5px] border-newOutline shadow-hard p-[24px] flex flex-col gap-[6px]">
          <div className="text-[14px] font-[600] text-white/85">
            {t('zyntra_coins_balance', 'Zyntra Coins balance')}
          </div>
          <div className="text-[48px] font-heading font-[800] leading-[1.05]">
            {data.balance.toLocaleString()}
          </div>
          <div className="text-[14px] text-white/85">
            {t(
              'coins_monthly_description',
              'You get {{monthly}} free coins every month. Unused coins carry over.',
              { monthly: data.monthly }
            )}
          </div>
          <div className="flex gap-[10px] mt-[10px] flex-wrap">
            <div className="rounded-[10px] bg-white/15 px-[12px] py-[6px] text-[13px]">
              {t('coins_spent_this_month', 'Spent this month')}:{' '}
              <span className="font-[700]">
                {data.thisMonth.spent.toLocaleString()}
              </span>
            </div>
            <div className="rounded-[10px] bg-white/15 px-[12px] py-[6px] text-[13px]">
              {t('coins_added_this_month', 'Added this month')}:{' '}
              <span className="font-[700]">
                {data.thisMonth.added.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-[280px] rounded-[16px] bg-newBgColorInner border border-newTableBorder p-[24px] flex flex-col gap-[12px]">
          <div className="text-[16px] font-heading font-[700]">
            {t('what_coins_pay_for', 'What coins pay for')}
          </div>
          {costs.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-[14px]"
            >
              <div>{item.label}</div>
              <div className="font-[700] px-[10px] py-[2px] rounded-full bg-newButter">
                {item.cost}{' '}
                {item.cost === 1
                  ? t('coin_unit', 'coin')
                  : t('coins_unit', 'coins')}
              </div>
            </div>
          ))}
          <div className="text-[12px] text-textItemBlur">
            {t(
              'coins_post_note',
              'A post is charged once per channel when it is scheduled. Editing it later is free, drafts are free.'
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-[20px] flex-wrap items-start">
        <CoinsHistory />
        <div className="flex-1 min-w-[300px] flex flex-col gap-[20px]">
          <RequestCoins onSent={reload} />
          {!!user?.isSuperAdmin && <GrantCoins onGranted={reload} />}
        </div>
      </div>
    </div>
  );
};
