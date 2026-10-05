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
  transactions: {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
  }[];
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
    globalMutate('/coins/balance');
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
        <div className="flex-1 min-w-[320px] flex flex-col gap-[20px]">
          <RequestCoins onSent={reload} />
          {!!user?.isSuperAdmin && <GrantCoins onGranted={reload} />}
        </div>
        <div className="flex-1 min-w-[320px] bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[12px]">
          <div className="text-[16px] font-heading font-[700]">
            {t('coins_history', 'History')}
          </div>
          {!data.transactions.length && (
            <div className="text-[14px] text-textItemBlur">
              {t('no_coin_activity', 'No coin activity yet.')}
            </div>
          )}
          <div className="flex flex-col">
            {data.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-[10px] border-b border-newTableBorder last:border-b-0"
              >
                <div>
                  <div className="text-[14px]">{transaction.description}</div>
                  <div className="text-[12px] text-textItemBlur">
                    {dayjs(transaction.createdAt).format('MMM D, YYYY HH:mm')}
                  </div>
                </div>
                <div
                  className={clsx(
                    'text-[14px] font-[700]',
                    transaction.amount > 0
                      ? 'text-statusPublished'
                      : 'text-newTextColor'
                  )}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
