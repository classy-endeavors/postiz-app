'use client';

import React, { FC, useCallback, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Input } from '@gitroom/react/form/input';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useLogoutNow } from '@gitroom/frontend/components/layout/logout.component';
import { capitalize } from 'lodash';

interface PasswordStatus {
  hasPassword: boolean;
  provider: string;
  email: string;
}

const usePasswordStatus = () => {
  const fetch = useFetch();
  const load = useCallback(async (path: string) => {
    return (await (await fetch(path)).json()) as PasswordStatus;
  }, []);
  return useSWR('/user/password', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
};

const PasswordModal: FC<{ status: PasswordStatus; close: () => void }> = ({
  status,
  close,
}) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const logoutNow = useLogoutNow();
  const { mutate } = useSWRConfig();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const tooShort = !!password && password.length < 8;
  const mismatch = !!repeatPassword && password !== repeatPassword;
  const canSave =
    password.length >= 8 &&
    password === repeatPassword &&
    (!status.hasPassword || !!currentPassword);

  const save = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/user/password', {
      method: 'POST',
      body: JSON.stringify({
        password,
        ...(status.hasPassword ? { currentPassword } : {}),
      }),
    });
    setLoading(false);
    if (!response.ok) {
      const { message } = await response.json().catch(() => ({}));
      toaster.show(
        typeof message === 'string'
          ? message
          : t('password_update_failed', 'Could not save the password'),
        'warning'
      );
      return;
    }
    setSaved(true);
    mutate('/user/password');
  }, [password, currentPassword, status.hasPassword]);

  if (saved) {
    return (
      <div className="flex flex-col gap-[20px]">
        <div className="rounded-[12px] bg-statusPublishedBg text-statusPublished px-[16px] py-[12px] text-[14px] font-[600]">
          {status.hasPassword
            ? t('password_changed', 'Your password was changed.')
            : t('password_set', 'Your password was set.')}
        </div>
        <div className="text-[14px] text-textItemBlur">
          {t(
            'password_logout_notice',
            'Please log out and log in again with {{email}} and your new password.',
            { email: status.email }
          )}
        </div>
        <div className="flex gap-[8px]">
          <Button className="rounded-[8px]" onClick={logoutNow}>
            {t('logout_now', 'Log out now')}
          </Button>
          <Button secondary className="rounded-[8px]" onClick={close}>
            {t('later', 'Later')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="text-[14px] text-textItemBlur">
        {status.hasPassword
          ? t(
              'change_password_description',
              'Enter your current password, then choose a new one with at least 8 characters.'
            )
          : t(
              'set_password_description',
              'You log in with {{provider}}. Set a password to also log in with {{email}} and this password.',
              { provider: capitalize(status.provider), email: status.email }
            )}
      </div>
      <div className="flex flex-col">
        {status.hasPassword && (
          <Input
            label={t('current_password', 'Current password')}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            disableForm={true}
            removeError={true}
            maxLength={64}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        )}
        <Input
          label={t('new_password', 'New password')}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          disableForm={true}
          removeError={true}
          maxLength={64}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label={t('repeat_new_password', 'Repeat new password')}
          name="repeatNewPassword"
          type="password"
          autoComplete="new-password"
          disableForm={true}
          removeError={true}
          maxLength={64}
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
        />
        {(tooShort || mismatch) && (
          <div className="text-red-400 text-[12px]">
            {tooShort
              ? t('password_too_short', 'Use at least 8 characters')
              : t('passwords_do_not_match', 'Passwords do not match')}
          </div>
        )}
      </div>
      <div className="flex gap-[8px]">
        <Button
          className="rounded-[8px]"
          loading={loading}
          disabled={!canSave}
          onClick={save}
        >
          {status.hasPassword
            ? t('change_password', 'Change password')
            : t('set_password', 'Set password')}
        </Button>
        <Button secondary className="rounded-[8px]" onClick={close}>
          {t('cancel', 'Cancel')}
        </Button>
      </div>
    </div>
  );
};

export const PasswordSettings: FC = () => {
  const t = useT();
  const modals = useModals();
  const { data } = usePasswordStatus();

  const open = useCallback(() => {
    if (!data) {
      return;
    }
    modals.openModal({
      title: data.hasPassword
        ? t('change_password', 'Change password')
        : t('set_password', 'Set password'),
      children: (close) => <PasswordModal status={data} close={close} />,
    });
  }, [data]);

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[12px] max-w-[560px] pt-[24px] border-t border-newTableBorder">
      <div className="flex flex-col gap-[4px]">
        <h3 className="text-[20px]">{t('password', 'Password')}</h3>
        <div className="text-[14px] text-textItemBlur">
          {data.hasPassword
            ? t(
                'password_section_description',
                'Change the password you use to log in.'
              )
            : t(
                'password_section_provider_description',
                'You log in with {{provider}}. You can also set a password to log in with your email.',
                { provider: capitalize(data.provider) }
              )}
        </div>
      </div>
      <div>
        <Button type="button" onClick={open}>
          {data.hasPassword
            ? t('change_password', 'Change password')
            : t('set_password', 'Set password')}
        </Button>
      </div>
    </div>
  );
};
