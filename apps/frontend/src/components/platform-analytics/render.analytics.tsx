import { FC, useCallback, useMemo, useState } from 'react';
import { Integration } from '@prisma/client';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { ChartSocial } from '@gitroom/frontend/components/analytics/chart-social';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import clsx from 'clsx';

interface AnalyticsDataItem {
  label: string;
  data: Array<{ total: number; date: string }>;
  average?: boolean;
  format?: 'percentage' | 'duration';
  percentageChange?: number;
}

const formatTotal = (item: AnalyticsDataItem) => {
  const sum = item.data.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const value = item.average ? sum / (item.data.length || 1) : sum;
  if (item.format === 'duration') {
    const seconds = Math.round(value);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  if (item.average) {
    return value.toFixed(2) + '%';
  }
  return new Intl.NumberFormat().format(Math.round(value));
};

const StatTile: FC<{ item: AnalyticsDataItem; total: string }> = ({
  item,
  total,
}) => (
  <div className="rounded-[14px] border-[1.5px] border-newSep bg-newBgColorInner px-[16px] py-[14px] flex flex-col gap-[6px]">
    <div className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-textItemBlur">
      {item.label}
    </div>
    <div className="font-heading font-[800] text-[28px] leading-[1.1] tracking-[-0.01em]">
      {total}
    </div>
  </div>
);

const TrendIndicator: FC<{ value: number; average?: boolean }> = ({
  value,
  average,
}) => {
  if (value === 0) return null;

  const isPositive = value > 0;
  const displayValue = Math.abs(value).toFixed(1);

  return (
    <div
      className={`flex items-center gap-[4px] text-[13px] font-medium ${
        isPositive ? 'text-[#32d583]' : 'text-[#f97066]'
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className={isPositive ? '' : 'rotate-180'}
      >
        <path
          d="M6 2.5L10 7.5H2L6 2.5Z"
          fill="currentColor"
        />
      </svg>
      <span>
        {displayValue}
        {average ? 'pp' : '%'}
      </span>
    </div>
  );
};

const AnalyticsCard: FC<{
  item: AnalyticsDataItem;
  total: string | number;
  index: number;
}> = ({ item, total, index }) => {
  const colorVariants = ['purple', 'green', 'blue'] as const;
  const color = colorVariants[index % colorVariants.length];

  return (
    <div className="group relative">
      <div className="flex flex-col h-full bg-newBgColorInner border-[1.5px] border-newSep rounded-[14px] overflow-hidden transition-colors duration-200 hover:border-newOutline">
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] pt-[14px] pb-[8px]">
          <div className="flex items-center gap-[10px]">
            <div
              className={`
                w-[8px] h-[8px] rounded-full
                ${color === 'purple' ? 'bg-[#FF5227]' : ''}
                ${color === 'green' ? 'bg-[#32d583]' : ''}
                ${color === 'blue' ? 'bg-[#1d9bf0]' : ''}
              `}
            />
            <span className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-textItemBlur">
              {item.label}
            </span>
          </div>
          {item.percentageChange !== undefined && (
            <TrendIndicator value={item.percentageChange} average={item.average} />
          )}
        </div>

        <div className="flex-1 px-[12px] py-[8px]">
          <div className="h-[120px] relative">
            <ChartSocial data={item.data} color={color} key={`chart-${index}`} />
          </div>
        </div>
        <div className="px-[16px] pb-[14px]">
          <div className="font-heading font-[800] text-[30px] leading-[1.15] tracking-[-0.01em]">
            {total}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState: FC<{ onRefresh: () => void; refreshNeeded: boolean }> = ({
  onRefresh,
  refreshNeeded,
}) => {
  const t = useT();

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-[48px] px-[24px] bg-newTableHeader border border-newTableBorder rounded-[12px]">
      <div className="w-[48px] h-[48px] mb-[16px] rounded-full bg-[#FF5227]/10 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[#FF5227]"
        >
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path d="M12 8v4l2 2" />
        </svg>
      </div>
      {refreshNeeded ? (
        <p className="text-[15px] text-newTableText text-center mb-[12px]">
          {t(
            'this_channel_needs_to_be_refreshed',
            'This channel needs to be refreshed to display analytics'
          )}
        </p>
      ) : (
        <>
          <p className="font-heading text-[15px] text-newTextColor font-[700] text-center mb-[6px]">
            {t('no_analytics_data_yet', 'No analytics data for this period yet')}
          </p>
          <p className="text-[13px] text-newTableText text-center mb-[16px] max-w-[460px]">
            {t(
              'no_analytics_data_hint',
              'New channels and new videos can take up to 48 hours to show analytics. If it stays empty, reconnect the channel and approve every permission.'
            )}
          </p>
        </>
      )}
      <button
        onClick={onRefresh}
        className={clsx(
          'inline-flex items-center gap-[6px] px-[16px] py-[8px] text-[14px] font-medium rounded-[8px] transition-colors',
          refreshNeeded
            ? 'text-white bg-[#FF5227] hover:bg-[#B84123]'
            : 'text-newTextColor bg-newBgColorInner border border-newTableBorder hover:bg-boxHover'
        )}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        {refreshNeeded
          ? t('refresh_channel', 'Refresh Channel')
          : t('reconnect_channel', 'Reconnect Channel')}
      </button>
    </div>
  );
};

export const RenderAnalytics: FC<{
  integration: Integration;
  date: number;
}> = (props) => {
  const { integration, date } = props;
  const [loading, setLoading] = useState(true);
  const fetch = useFetch();

  const load = useCallback(async () => {
    setLoading(true);
    const load = (
      await fetch(`/analytics/${integration.id}?date=${date}`)
    ).json();
    setLoading(false);
    return load;
  }, [integration, date]);

  const { data } = useSWR(`/analytics-${integration?.id}-${date}`, load, {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    revalidateOnMount: true,
  });

  const refreshChannel = useCallback(
    (
        integrationData: Integration & {
          identifier: string;
        }
      ) =>
      async () => {
        const { url } = await (
          await fetch(
            `/integrations/social/${
              integrationData.identifier
            }?refresh=${integrationData.internalId}&redirectUrl=${encodeURIComponent(
              '/analytics'
            )}`,
            {
              method: 'GET',
            }
          )
        ).json();
        window.location.href = url;
      },
    []
  );

  const t = useT();

  const stats = useMemo(
    () =>
      ((data || []) as AnalyticsDataItem[]).filter((p) => p.data?.length === 1),
    [data]
  );
  const series = useMemo(
    () =>
      ((data || []) as AnalyticsDataItem[]).filter((p) => p.data?.length > 1),
    [data]
  );
  // YouTube only: lifetime channel tiles + period day-series can disagree
  // (e.g. 7-day charts at 0 while Lifetime Views is non-zero).
  const showYoutubePeriodNotice = useMemo(() => {
    if (integration.identifier !== 'youtube') {
      return false;
    }
    const hasLifetimeTotals = stats.some((item) =>
      /lifetime/i.test(item.label)
    );
    if (!series.length) {
      return hasLifetimeTotals;
    }
    return series.every((item) =>
      item.data.every((point) => Number(point.total || 0) === 0)
    );
  }, [integration.identifier, series, stats]);

  if (loading) {
    return (
      <div className="flex flex-col gap-[16px] animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[12px]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[14px] border-[1.5px] border-newSep bg-newBgColorInner px-[16px] py-[14px] flex flex-col gap-[10px]"
            >
              <div className="h-[11px] w-[72px] rounded-[4px] bg-newSep" />
              <div className="h-[28px] w-[88px] rounded-[6px] bg-newSep" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[14px] border-[1.5px] border-newSep bg-newBgColorInner overflow-hidden"
            >
              <div className="flex items-center gap-[10px] px-[16px] pt-[14px] pb-[8px]">
                <div className="w-[8px] h-[8px] rounded-full bg-newSep" />
                <div className="h-[11px] w-[90px] rounded-[4px] bg-newSep" />
              </div>
              <div className="px-[12px] py-[8px]">
                <div className="h-[120px] rounded-[8px] bg-newSep" />
              </div>
              <div className="px-[16px] pb-[14px]">
                <div className="h-[30px] w-[100px] rounded-[6px] bg-newSep" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats.length && !series.length) {
    return (
      <div className="grid grid-cols-1">
        <EmptyState
          onRefresh={refreshChannel(integration as any)}
          refreshNeeded={!!integration?.refreshNeeded}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[16px]">
      {showYoutubePeriodNotice && (
        <div className="rounded-[12px] border border-newSep bg-newTextColor/[0.03] px-[16px] py-[12px] text-[13px] text-newTextColor/80">
          {t(
            'analytics_period_empty_or_delayed',
            'No activity in this date range (or platform analytics are still catching up — YouTube can lag 48–72 hours). Channel totals above are lifetime, not limited to this period.'
          )}
        </div>
      )}
      {integration.identifier === 'tiktok' && (
        <div className="rounded-[12px] border border-newSep bg-newTextColor/[0.03] px-[16px] py-[12px] text-[13px] text-newTextColor/80">
          {t(
            'tiktok_analytics_lifetime_hint',
            'These numbers are lifetime totals for your TikTok account. Day-by-day or date-range breakdowns (like in TikTok Studio) aren’t available here yet.'
          )}
        </div>
      )}
      {!!stats.length && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[12px]">
          {stats.map((item) => (
            <StatTile key={item.label} item={item} total={formatTotal(item)} />
          ))}
        </div>
      )}
      {!!series.length && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {series.map((item, index) => (
            <AnalyticsCard
              key={item.label}
              item={item}
              total={formatTotal(item)}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};
