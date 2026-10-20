import {
  FC,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
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
import {
  getTimezoneAbbreviation,
  newDayjs,
} from '@gitroom/frontend/components/layout/set.timezone';
import {
  CalendarIcon,
  DropdownArrowIcon,
} from '@gitroom/frontend/components/ui/icons';

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const clampToFuture = (value: dayjs.Dayjs) => {
  const now = newDayjs().second(0).millisecond(0);
  if (value.isBefore(now)) {
    return now.add(1, 'minute');
  }
  return value.second(0).millisecond(0);
};

const TimePartSelect: FC<{
  value: number;
  options: number[];
  label: string;
  disabledOptions?: number[];
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}> = ({
  value,
  options,
  label,
  disabledOptions = [],
  formatValue = (v) => String(v).padStart(2, '0'),
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef('');
  const typedTimer = useRef<number | undefined>(undefined);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const disabledSet = useMemo(() => new Set(disabledOptions), [disabledOptions]);
  const enabledOptions = useMemo(
    () => options.filter((option) => !disabledSet.has(option)),
    [options, disabledSet]
  );
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
      if (!enabledOptions.length) {
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const currentIndex = Math.max(0, enabledOptions.indexOf(value));
      const nextIndex =
        (currentIndex + direction + enabledOptions.length) %
        enabledOptions.length;
      onChange(enabledOptions[nextIndex]);
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
      if (single <= max && !disabledSet.has(single)) {
        onChange(single);
      }
      return;
    }

    if (!disabledSet.has(parsed) && options.includes(parsed)) {
      onChange(parsed);
      setOpen(true);
      if (nextTyped.length === 2 || parsed * 10 > max) {
        typed.current = '';
        setOpen(false);
      }
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
        <span>{formatValue(value)}</span>
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
            const disabled = disabledSet.has(option);
            return (
              <button
                key={option}
                type="button"
                data-selected={selected}
                disabled={disabled}
                onClick={() => {
                  if (disabled) {
                    return;
                  }
                  onChange(option);
                  setOpen(false);
                }}
                className={clsx(
                  'w-full h-[32px] px-[12px] text-start text-[13px] font-[600]',
                  disabled
                    ? 'opacity-30 cursor-not-allowed text-textColor'
                    : selected
                    ? 'bg-[#FF5227] text-white cursor-pointer'
                    : 'text-textColor hover:bg-newBgColor cursor-pointer'
                )}
              >
                {formatValue(option)}
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
  const use12Hour = isUSCitizen();
  const timezoneLabel = getTimezoneAbbreviation();
  const todayKey = newDayjs().format('YYYY-MM-DD');
  const nowHour = newDayjs().hour();
  const nowMinute = newDayjs().minute();
  const isToday = date.format('YYYY-MM-DD') === todayKey;
  const minDate = newDayjs().startOf('day').toDate();

  const hour12 = date.hour() % 12 || 12;
  const isAm = date.hour() < 12;

  const disabledHours24 = useMemo(() => {
    if (!isToday) {
      return [];
    }
    return HOURS_24.filter((hour) => hour < nowHour);
  }, [isToday, nowHour]);

  const disabledHours12 = useMemo(() => {
    if (!isToday) {
      return [];
    }
    return HOURS_12.filter((displayHour) => {
      const as24 = (displayHour % 12) + (isAm ? 0 : 12);
      return as24 < nowHour;
    });
  }, [isToday, isAm, nowHour]);

  const disabledMinutes = useMemo(() => {
    if (!isToday || date.hour() !== nowHour) {
      return [];
    }
    return MINUTES.filter((minute) => minute < nowMinute);
  }, [isToday, date, nowHour, nowMinute]);

  const changeShow = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const ref = useClickOutside<HTMLDivElement>(() => {
    setOpen(false);
  });

  const changeDate = useCallback(
    (day: Date) => {
      const next = clampToFuture(
        newDayjs(
          newDayjs(day).format('YYYY-MM-DD') + ' ' + date.format('HH:mm:ss')
        )
      );
      onChange(next);
    },
    [date, onChange]
  );

  const changeTimePart = useCallback(
    (part: 'hour' | 'minute', value: number) => {
      const next =
        part === 'hour' ? date.hour(value) : date.minute(value);
      onChange(clampToFuture(next));
    },
    [date, onChange]
  );

  const changeHour12 = useCallback(
    (displayHour: number) => {
      const hour24 = (displayHour % 12) + (isAm ? 0 : 12);
      onChange(clampToFuture(date.hour(hour24)));
    },
    [date, isAm, onChange]
  );

  const changeMeridiem = useCallback(
    (nextIsAm: boolean) => {
      const hour24 = (hour12 % 12) + (nextIsAm ? 0 : 12);
      onChange(clampToFuture(date.hour(hour24)));
    },
    [date, hour12, onChange]
  );

  const displayFormat = use12Hour
    ? 'MM/DD/YYYY hh:mm A'
    : 'DD/MM/YYYY HH:mm';

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
        <div className="whitespace-nowrap">
          {date.format(displayFormat)}{' '}
          <span className="text-newTextColor/60 font-[500]">
            {timezoneLabel}
          </span>
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
            minDate={minDate}
            excludeDate={(day) =>
              newDayjs(day).isBefore(newDayjs().startOf('day'))
            }
            dayClassName={(day, modifiers) => {
              if (modifiers.disabled) {
                return '!text-gray opacity-40 pointer-events-none';
              }
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
            <div className="flex items-center justify-between gap-[8px]">
              <div className="text-textColor text-[14px] font-[600]">
                {t('pick_time', 'Pick time')}
              </div>
              <div className="text-[12px] text-newTextColor/60 font-[500]">
                {timezoneLabel}
              </div>
            </div>
            <div className="flex gap-[8px] items-center">
              {use12Hour ? (
                <>
                  <TimePartSelect
                    value={hour12}
                    options={HOURS_12}
                    disabledOptions={disabledHours12}
                    label={t('hours', 'Hours')}
                    formatValue={(v) => String(v)}
                    onChange={changeHour12}
                  />
                  <span className="text-textColor font-[600]">:</span>
                  <TimePartSelect
                    value={date.minute()}
                    options={MINUTES}
                    disabledOptions={disabledMinutes}
                    label={t('minutes', 'Minutes')}
                    onChange={(value) => changeTimePart('minute', value)}
                  />
                  <div className="flex h-[40px] rounded-[8px] border border-newTextColor/10 overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => changeMeridiem(true)}
                      className={clsx(
                        'px-[10px] text-[13px] font-[600]',
                        isAm
                          ? 'bg-[#FF5227] text-white'
                          : 'bg-newBgColorInner text-textColor'
                      )}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => changeMeridiem(false)}
                      className={clsx(
                        'px-[10px] text-[13px] font-[600]',
                        !isAm
                          ? 'bg-[#FF5227] text-white'
                          : 'bg-newBgColorInner text-textColor'
                      )}
                    >
                      PM
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <TimePartSelect
                    value={date.hour()}
                    options={HOURS_24}
                    disabledOptions={disabledHours24}
                    label={t('hours', 'Hours')}
                    onChange={(value) => changeTimePart('hour', value)}
                  />
                  <span className="text-textColor font-[600]">:</span>
                  <TimePartSelect
                    value={date.minute()}
                    options={MINUTES}
                    disabledOptions={disabledMinutes}
                    label={t('minutes', 'Minutes')}
                    onChange={(value) => changeTimePart('minute', value)}
                  />
                </>
              )}
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
