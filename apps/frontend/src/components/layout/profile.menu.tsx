'use client';

import React, { CSSProperties, FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import Link from 'next/link';
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

const MENU_WIDTH = 260;
const MENU_GAP = 8;
const VIEWPORT_PAD = 12;

function getMenuStyle(anchor: DOMRect): CSSProperties {
  const width = Math.min(MENU_WIDTH, window.innerWidth - VIEWPORT_PAD * 2);
  const right = Math.min(
    Math.max(VIEWPORT_PAD, window.innerWidth - anchor.right),
    window.innerWidth - width - VIEWPORT_PAD
  );
  const top = Math.min(
    anchor.bottom + MENU_GAP,
    window.innerHeight - VIEWPORT_PAD - 8
  );

  return {
    position: 'fixed',
    top,
    right,
    left: 'auto',
    width,
  };
}

export const ProfileMenu: FC = () => {
  const t = useT();
  const user = useUser();
  const logout = useLogout();
  const { data } = usePersonal();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const name = data?.name || user?.name;

  const syncPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return false;
    }
    const rect = trigger.getBoundingClientRect();
    const visible =
      rect.bottom > 0 &&
      rect.top < window.innerHeight &&
      rect.right > 0 &&
      rect.left < window.innerWidth;
    if (!visible) {
      setOpen(false);
      return false;
    }
    setMenuStyle(getMenuStyle(rect));
    return true;
  }, []);

  const toggle = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    if (syncPosition()) {
      setOpen(true);
    }
  }, [open, syncPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) {
        return;
      }
      if (panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onReposition = () => {
      syncPosition();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, syncPosition]);

  const menu =
    open &&
    menuStyle &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={panelRef}
        style={menuStyle}
        className="p-[12px] bg-newBgColorInner shadow-menu flex flex-col gap-[4px] z-[600] rounded-[8px] border border-tableBorder text-newTextColor"
      >
        <div className="flex items-center gap-[10px] px-[8px] pb-[10px] mb-[4px] border-b border-tableBorder min-w-0">
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
      </div>,
      document.body
    );

  return (
    <div ref={triggerRef} className="relative flex items-center shrink-0">
      <div
        onClick={toggle}
        className="cursor-pointer rounded-full hover:opacity-80 transition-opacity"
        data-tooltip-id="tooltip"
        data-tooltip-content={t('profile', 'Profile')}
        aria-label={t('profile', 'Profile')}
      >
        <ProfileAvatar
          name={name}
          email={user?.email}
          picture={data?.picture?.path}
          size={32}
        />
      </div>
      {menu}
    </div>
  );
};
