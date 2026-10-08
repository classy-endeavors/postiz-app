'use client';

import React, { FC, useCallback, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useClickOutside } from '@mantine/hooks';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useLogout } from '@gitroom/frontend/components/layout/logout.component';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export type PersonalResponse = {
  id: string;
  name: string | null;
  bio: string | null;
  picture: { id: string; path: string } | null;
};

export const usePersonal = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/user/personal')).json();
  }, []);

  return useSWR<PersonalResponse>('personal', load, {
    revalidateOnFocus: false,
  });
};

export const ProfileAvatar: FC<{
  name?: string | null;
  email?: string;
  picture?: string;
  size: number;
}> = ({ name, email, picture, size }) => {
  if (picture) {
    return (
      <img
        src={picture}
        alt=""
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="rounded-full bg-btnPrimary text-white font-[700] flex items-center justify-center uppercase"
    >
      {(name || email || '?').trim().charAt(0)}
    </div>
  );
};

export const ProfileMenu: FC = () => {
  const t = useT();
  const user = useUser();
  const logout = useLogout();
  const { data } = usePersonal();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const name = data?.name || user?.name;

  return (
    <div ref={ref} className="relative flex items-center">
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-full hover:opacity-80 transition-opacity"
        data-tooltip-id="tooltip"
        data-tooltip-content={t('profile', 'Profile')}
      >
        <ProfileAvatar
          name={name}
          email={user?.email}
          picture={data?.picture?.path}
          size={32}
        />
      </div>
      {open && (
        <div className="absolute top-[calc(100%+12px)] end-0 w-[260px] p-[12px] bg-newBgColorInner shadow-menu flex flex-col gap-[4px] z-[100] rounded-[8px] border border-tableBorder text-newTextColor">
          <div className="flex items-center gap-[10px] px-[8px] pb-[10px] mb-[4px] border-b border-tableBorder">
            <ProfileAvatar
              name={name}
              email={user?.email}
              picture={data?.picture?.path}
              size={40}
            />
            <div className="flex flex-col min-w-0">
              <div className="text-[14px] font-[600] truncate">
                {name || t('no_name_yet', 'No name yet')}
              </div>
              <div className="text-[12px] text-textItemBlur truncate">
                {user?.email}
              </div>
            </div>
          </div>
          <Link
            href="/settings?tab=profile"
            onClick={() => setOpen(false)}
            className="px-[8px] py-[8px] rounded-[6px] hover:bg-boxHover text-[14px]"
          >
            {t('my_profile', 'My Profile')}
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="px-[8px] py-[8px] rounded-[6px] hover:bg-boxHover text-[14px]"
          >
            {t('settings', 'Settings')}
          </Link>
          <div
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="cursor-pointer px-[8px] py-[8px] rounded-[6px] hover:bg-boxHover text-[14px] text-red-400"
          >
            {t('logout', 'Log out')}
          </div>
        </div>
      )}
    </div>
  );
};
