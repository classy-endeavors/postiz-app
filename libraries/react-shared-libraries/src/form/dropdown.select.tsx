'use client';

import {
  FC,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { clsx } from 'clsx';
import { TranslatedLabel } from '../translation/translated-label';

export type DropdownSelectOption = {
  value: string;
  label: string;
};

type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

export const DropdownSelect: FC<{
  label?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  options: DropdownSelectOption[];
  onChange?: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  translationKey?: string;
  translationParams?: Record<string, string | number>;
}> = ({
  label = '',
  name,
  value,
  placeholder = 'Select…',
  options,
  onChange,
  className,
  buttonClassName,
  disabled,
  translationKey,
  translationParams,
}) => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPosition | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const gap = 4;
    const preferredMaxHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
    const spaceAbove = rect.top - gap - 8;
    const openUp = spaceBelow < 140 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(preferredMaxHeight, openUp ? spaceAbove : spaceBelow)
    );

    setPos({
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  const toggle = useCallback(() => {
    if (disabled) {
      return;
    }
    if (open) {
      close();
      return;
    }
    setOpen(true);
    requestAnimationFrame(() => updatePosition());
  }, [disabled, open, close, updatePosition]);

  const selectOption = useCallback(
    (next: string) => {
      onChange?.(next);
      close();
    },
    [onChange, close]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    const onReposition = () => updatePosition();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, close, updatePosition]);

  return (
    <div
      ref={rootRef}
      className={clsx('flex flex-col relative', label ? 'gap-[6px]' : '', className)}
    >
      {!!label && (
        <div className="text-[14px]">
          <TranslatedLabel
            label={label}
            translationKey={translationKey}
            translationParams={translationParams}
          />
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        name={name}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggle}
        className={clsx(
          'w-full h-[42px] bg-newBgColorInner ps-[16px] pe-[12px] outline-none border rounded-[8px] text-[14px] flex items-center gap-[8px] text-start transition-colors',
          open ? 'border-btnPrimary' : 'border-newTableBorder',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-newOutline',
          buttonClassName
        )}
      >
        <span
          className={clsx(
            'flex-1 min-w-0 truncate',
            !selected && 'text-textItemBlur'
          )}
        >
          {selected?.label || placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={clsx(
            'shrink-0 text-textItemBlur transition-transform',
            open && 'rotate-180'
          )}
        >
          <path
            d="M13.354 6.35378L8.35403 11.3538C8.30759 11.4003 8.25245 11.4372 8.19175 11.4623C8.13105 11.4875 8.06599 11.5004 8.00028 11.5004C7.93457 11.5004 7.86951 11.4875 7.80881 11.4623C7.74811 11.4372 7.69296 11.4003 7.64653 11.3538L2.64653 6.35378C2.55271 6.25996 2.5 6.13272 2.5 6.00003C2.5 5.86735 2.55271 5.7401 2.64653 5.64628C2.74035 5.55246 2.8676 5.49976 3.00028 5.49976C3.13296 5.49976 3.26021 5.55246 3.35403 5.64628L8.00028 10.2932L12.6465 5.64628C12.693 5.59983 12.7481 5.56298 12.8088 5.53784C12.8695 5.5127 12.9346 5.49976 13.0003 5.49976C13.066 5.49976 13.131 5.5127 13.1917 5.53784C13.2524 5.56298 13.3076 5.59983 13.354 5.64628C13.4005 5.69274 13.4373 5.74789 13.4625 5.80859C13.4876 5.86928 13.5006 5.93434 13.5006 6.00003C13.5006 6.06573 13.4876 6.13079 13.4625 6.19148C13.4373 6.25218 13.4005 6.30733 13.354 6.35378Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {open && pos && (
        <div
          id={listId}
          role="listbox"
          aria-label={label || placeholder}
          style={{
            position: 'fixed',
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            width: pos.width,
            maxHeight: pos.maxHeight,
            zIndex: 500,
          }}
          className="overflow-y-auto rounded-[8px] border-[1.5px] border-newOutline bg-newBgColorInner shadow-hard flex flex-col py-[4px]"
        >
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => selectOption(option.value)}
                className={clsx(
                  'w-full text-start px-[16px] py-[10px] text-[14px] outline-none transition-colors',
                  isActive
                    ? 'bg-boxFocused text-textItemFocused font-[600]'
                    : 'text-newTextColor hover:bg-boxHover'
                )}
              >
                {option.label}
              </button>
            );
          })}
          {!options.length && (
            <div className="px-[16px] py-[10px] text-[14px] text-textItemBlur">
              {placeholder}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
