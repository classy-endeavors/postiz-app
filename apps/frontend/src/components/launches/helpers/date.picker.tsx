import {
  FC,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { Calendar } from '@mantine/dates';
import { useClickOutside } from '@mantine/hooks';
import { Button } from '@gitroom/react/form/button';
import { isUSCitizen } from './isuscitizen.utils';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import {
  CalendarIcon,
  DropdownArrowIcon,
} from '@gitroom/frontend/components/ui/icons';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const TimePartSelect: FC<{
  value: number;
  options: number[];
  label: string;
  onChange: (value: number) => void;
}> = ({ value, options, label, onChange }) => {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef('');
  const typedTimer = useRef<number>();
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const max = options[options.length - 1];

  useEffect(() => {
    if (!open) {
      return;
    }

    listRef.current
      ?.querySelector<HTMLElement>('[data-selected="true"]')
      ?.scrollIntoView({ block: 'center' });
  }, [open, value]);

  useEffect(() => {
    return () => window.clearTimeout(typedTimer.current);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const currentIndex = options.indexOf(value);
      const nextIndex =
        (currentIndex + direction + options.length) % options.length;
      onChange(options[nextIndex]);
      setOpen(true);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((prev) => !prev);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (!/^\d$/.test(event.key)) {
      return;
    }

    event.preventDefault();
    const nextTyped = `${typed.current}${event.key}`.slice(-2);
    typed.current = nextTyped;
    window.clearTimeout(typedTimer.current);
    typedTimer.current = window.setTimeout(() => {
      typed.current = '';
    }, 800);

    const parsed = Number(nextTyped);
    if (parsed > max) {
      typed.current = event.key;
      const single = Number(event.key);
      if (single <= max) {
        onChange(single);
      }
      return;
    }

    onChange(parsed);
    setOpen(true);
    if (nextTyped.length === 2 || parsed * 10 > max) {
      typed.current = '';
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onKeyDown}
        className="w-full h-[40px] px-[10px] bg-newBgColorInner border border-newTextColor/10 text-textColor rounded-[8px] outline-none cursor-pointer flex items-center justify-between gap-[6px] text-[14px] font-[600]"
      >
        <span>{String(value).padStart(2, '0')}</span>
        <DropdownArrowIcon
          size={16}
          rotated={open}
          className="text-newTextItemBlur"
        />
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute z-[20] bottom-[calc(100%+6px)] left-0 w-full max-h-[160px] overflow-y-auto overscroll-contain rounded-[8px] border border-tableBorder bg-newBgColorInner menu-shadow py-[4px] scrollbar scrollbar-thumb-tableBorder scrollbar-track-transparent"
        >
          {options.map((option) => {
            const selected = option === value;
            return (
              <button
                key={option}
                type="button"
                data-selected={selected}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={clsx(
                  'w-full h-[32px] px-[12px] text-start text-[13px] font-[600] cursor-pointer',
                  selected
                    ? 'bg-[#FF5227] text-white'
                    : 'text-textColor hover:bg-newBgColor'
                )}
              >
                {String(option).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const DatePicker: FC<{
  date: dayjs.Dayjs;
  onChange: (day: dayjs.Dayjs) => void;
}> = (props) => {
  const { date, onChange } = props;
  const [open, setOpen] = useState(false);
  const t = useT();

  const changeShow = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const ref = useClickOutside<HTMLDivElement>(() => {
    setOpen(false);
  });

  const changeDate = useCallback(
    (day: Date) => {
      onChange(
        newDayjs(
          newDayjs(day).format('YYYY-MM-DD') + ' ' + date.format('HH:mm:ss')
        )
      );
    },
    [date, onChange]
  );

  const changeTimePart = useCallback(
    (part: 'hour' | 'minute', value: number) => {
      const next =
        part === 'hour' ? date.hour(value) : date.minute(value);
      onChange(next.second(0));
    },
    [date, onChange]
  );

  return (
    <div
      className="px-[16px] border border-newTextColor/10 rounded-[8px] justify-center flex gap-[8px] items-center relative h-[44px] text-[15px] font-[600] ml-[7px] flex-1"
      ref={ref}
    >
      <div
        className="cursor-pointer select-none flex gap-[8px] items-center flex-1 justify-center"
        onClick={changeShow}
      >
        <div>
          <CalendarIcon />
        </div>
        <div>
          {date.format(
            isUSCitizen() ? 'MM/DD/YYYY hh:mm A' : 'DD/MM/YYYY HH:mm'
          )}
        </div>
      </div>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="animate-fadeIn absolute bottom-[100%] mb-[16px] start-[50%] -translate-x-[50%] bg-sixth border border-tableBorder text-textColor rounded-[16px] z-[300] p-[16px] flex flex-col"
        >
          <Calendar
            onChange={changeDate}
            value={date.toDate()}
            dayClassName={(day, modifiers) => {
              if (modifiers.weekend) {
                return '!text-customColor28';
              }
              if (modifiers.outside) {
                return '!text-gray';
              }
              if (modifiers.selected) {
                return '!text-white !bg-seventh !outline-none';
              }
              return '!text-textColor';
            }}
            classNames={{
              day: 'hover:bg-seventh',
              calendarHeaderControl: 'text-textColor hover:bg-third',
              calendarHeaderLevel: 'text-textColor hover:bg-third',
            }}
          />
          <div className="flex flex-col gap-[8px] pt-[12px]">
            <div className="text-textColor text-[14px] font-[600]">
              {t('pick_time', 'Pick time')}
            </div>
            <div className="flex gap-[8px] items-center">
              <TimePartSelect
                value={date.hour()}
                options={HOURS}
                label={t('hours', 'Hours')}
                onChange={(value) => changeTimePart('hour', value)}
              />
              <span className="text-textColor font-[600]">:</span>
              <TimePartSelect
                value={date.minute()}
                options={MINUTES}
                label={t('minutes', 'Minutes')}
                onChange={(value) => changeTimePart('minute', value)}
              />
            </div>
          </div>
          <Button className="mt-[12px]" onClick={changeShow}>
            {t('close', 'Close')}
          </Button>
        </div>
      )}
    </div>
  );
};
