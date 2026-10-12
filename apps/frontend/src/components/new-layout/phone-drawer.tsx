'use client';

import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';
import clsx from 'clsx';

export const usePhoneDrawer = (defaultOpen = false) => {
  const [open, setOpen] = useState(defaultOpen);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useHotkeys(
    'Escape',
    () => {
      if (open) {
        setOpen(false);
      }
    },
    [open]
  );

  return { open, setOpen, close, toggle };
};

export const PhoneDrawerToggle: FC<{
  open: boolean;
  onClick: () => void;
  controls: string;
  label: string;
  className?: string;
}> = ({ open, onClick, controls, label, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      className={clsx(
        'phone:inline-flex hidden items-center justify-center gap-[6px] h-[36px] px-[12px] rounded-[8px] border-[1.5px] border-newOutline bg-newBgColorInner text-newTextColor text-[13px] font-[600] outline-none',
        className
      )}
    >
      {label}
    </button>
  );
};

export const PhoneDrawer: FC<{
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: 'start' | 'end';
  title: string;
  id?: string;
  className?: string;
  hideHeader?: boolean;
}> = ({
  open,
  onClose,
  children,
  side = 'start',
  title,
  id,
  className,
  hideHeader = false,
}) => {
  const autoId = useId();
  const drawerId = id || autoId;

  if (!open) {
    return null;
  }

  return (
    <div className="phone:block hidden fixed inset-0 z-[400]">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/40 border-0 cursor-pointer"
        onClick={onClose}
      />
      <div
        id={drawerId}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'absolute top-0 bottom-0 w-[280px] max-w-[85vw] bg-newBgColorInner border-[1.5px] border-newOutline shadow-hard flex flex-col overflow-hidden',
          side === 'start'
            ? 'start-0 border-s-0 rounded-e-[16px]'
            : 'end-0 border-e-0 rounded-s-[16px]',
          className
        )}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between gap-[12px] px-[16px] py-[12px] border-b border-newOutline shrink-0">
            <div className="text-[16px] font-[600] truncate">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-[32px] h-[32px] rounded-[8px] bg-btnSimple text-btnText flex items-center justify-center outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M11 3L3 11M3 3L11 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto scrollbar scrollbar-thumb-fifth scrollbar-track-newBgColor">
          {children}
        </div>
      </div>
    </div>
  );
};

/** Panel classes when transforming an existing sidebar into a phone drawer in-place. */
export const phoneSidebarDrawerClass = (
  open: boolean,
  side: 'start' | 'end' = 'start'
) =>
  clsx(
    'phone:fixed phone:z-[400] phone:inset-y-0 phone:!w-[280px] phone:max-w-[85vw] phone:transition-transform phone:duration-200 phone:bg-newBgColorInner phone:border-[1.5px] phone:border-newOutline phone:shadow-hard',
    side === 'start'
      ? 'phone:start-0 phone:rounded-e-[16px]'
      : 'phone:end-0 phone:rounded-s-[16px]',
    open
      ? 'phone:translate-x-0'
      : side === 'start'
      ? 'phone:-translate-x-full phone:pointer-events-none'
      : 'phone:translate-x-full phone:pointer-events-none'
  );

export const PhoneDrawerBackdrop: FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Close menu"
      className="phone:block hidden fixed inset-0 z-[399] bg-black/40 border-0 cursor-pointer"
      onClick={onClose}
    />
  );
};
