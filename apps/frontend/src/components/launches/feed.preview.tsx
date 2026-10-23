'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useDrag, useDrop } from 'react-dnd';
import useCookie from 'react-use-cookie';
import dayjs from 'dayjs';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import {
  FeedPreviewItem,
  useFeedPreview,
} from '@gitroom/frontend/components/launches/helpers/use.feed.preview';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { ExistingDataContextProvider } from '@gitroom/frontend/components/launches/helpers/use.existing.data';
import { AddEditModal } from '@gitroom/frontend/components/new-launch/add.edit.modal';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';

const FEED_DND_TYPE = 'feed-preview-item';

const FeedCell: FC<{
  item: FeedPreviewItem;
  onSwap: (sourceId: string, targetId: string) => void;
  onOpen: (item: FeedPreviewItem) => void;
}> = ({ item, onSwap, onOpen }) => {
  const t = useT();
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: FEED_DND_TYPE,
      canDrag: item.canReorder,
      item: { id: item.id },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item.canReorder, item.id]
  );

  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: FEED_DND_TYPE,
      canDrop: () => item.canReorder,
      drop: (dragged: { id: string }) => {
        if (dragged.id !== item.id) {
          onSwap(dragged.id, item.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
    }),
    [item.canReorder, item.id, onSwap]
  );

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      dragRef(node);
      dropRef(node);
    },
    [dragRef, dropRef]
  );

  const caption = stripHtmlValidation(
    'none',
    item.caption || '',
    false,
    true,
    false
  );

  return (
    <div
      ref={setRefs}
      onClick={() => onOpen(item)}
      className={clsx(
        'relative aspect-square rounded-[4px] overflow-hidden bg-newBgColorInner border border-newOutline group cursor-pointer',
        item.canReorder && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
        isOver && 'ring-2 ring-newTextColor'
      )}
      title={caption}
    >
      {item.thumbnailUrl ? (
        <img
          src={item.thumbnailUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[12px] text-textItemBlur px-[8px] text-center">
          {caption || t('no_media', 'No media')}
        </div>
      )}

      {item.isScheduled && (
        <div className="absolute top-[6px] start-[6px] px-[6px] py-[2px] rounded-[6px] bg-black/70 text-white text-[10px] font-[700] uppercase tracking-wide">
          {t('scheduled', 'Scheduled')}
        </div>
      )}

      {item.isReel && (
        <div className="absolute top-[6px] end-[6px] text-white drop-shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M5 3h10a2 2 0 0 1 2 2v2.17l3.41-1.7A1 1 0 0 1 22 6.38v11.24a1 1 0 0 1-1.59.81L17 16.83V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          </svg>
        </div>
      )}

      {item.canReorder && (
        <div className="absolute bottom-[6px] end-[6px] opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
          </svg>
        </div>
      )}

      {item.isScheduled && (
        <div className="absolute bottom-[6px] start-[6px] px-[5px] py-[1px] rounded-[4px] bg-black/60 text-white text-[9px] font-[600]">
          {newDayjs(item.publishDate).format('MMM D, HH:mm')}
        </div>
      )}
    </div>
  );
};

export const FeedPreview: FC = () => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const modals = useModals();
  const { integrations, reloadCalendarView, customer } = useCalendar();
  const feedChannels = useMemo(
    () =>
      integrations.filter(
        (i) =>
          i.feedPreview &&
          !i.disabled &&
          (!customer || customer === 'all' || i.customer?.id === customer)
      ),
    [integrations, customer]
  );

  const [savedIntegration, setSavedIntegration] = useCookie(
    'feed-preview-integration',
    ''
  );
  const [integrationId, setIntegrationId] = useState(
    savedIntegration || feedChannels[0]?.id || ''
  );

  useEffect(() => {
    if (
      integrationId &&
      feedChannels.some((channel) => channel.id === integrationId)
    ) {
      return;
    }
    const next = feedChannels[0]?.id || '';
    setIntegrationId(next);
    if (next) {
      setSavedIntegration(next);
    }
  }, [feedChannels, integrationId, setSavedIntegration]);

  const { data, isLoading, mutate, error } = useFeedPreview(
    integrationId || null
  );

  const onSelectChannel = useCallback(
    (id: string) => {
      setIntegrationId(id);
      setSavedIntegration(id);
    },
    [setSavedIntegration]
  );

  const onSwap = useCallback(
    async (sourceId: string, targetId: string) => {
      try {
        const response = await fetch('/posts/feed-preview/swap', {
          method: 'PUT',
          body: JSON.stringify({ sourceId, targetId }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.message || 'Could not reorder posts');
        }
        await mutate();
        reloadCalendarView();
        toaster.show(t('feed_preview_reordered', 'Schedule updated'), 'success');
      } catch (e: any) {
        toaster.show(
          e?.message || t('feed_preview_reorder_failed', 'Reorder failed'),
          'warning'
        );
      }
    },
    [fetch, mutate, reloadCalendarView, t, toaster]
  );

  const onOpen = useCallback(
    async (item: FeedPreviewItem) => {
      if (!item.group) {
        if (item.permalink) {
          window.open(item.permalink, '_blank');
        }
        return;
      }

      const data = await (await fetch(`/posts/group/${item.group}`)).json();
      if (!data?.posts?.length) {
        toaster.show(t('post_not_found', 'Post not found'), 'warning');
        return;
      }

      const publishDate = dayjs.utc(data.posts[0].publishDate).local();
      modals.openModal({
        id: 'add-edit-modal',
        closeOnClickOutside: false,
        removeLayout: true,
        closeOnEscape: false,
        withCloseButton: false,
        askClose: true,
        fullScreen: true,
        classNames: {
          modal: 'w-[100%] max-w-[1400px] text-textColor',
        },
        children: (
          <ExistingDataContextProvider value={data}>
            <AddEditModal
              allIntegrations={integrations.map((p) => ({ ...p }))}
              mutate={() => {
                mutate();
                reloadCalendarView();
              }}
              integrations={integrations
                .slice(0)
                .filter((f) => f.id === data.integration)
                .map((p) => ({
                  ...p,
                  picture: data.integrationPicture,
                }))}
              date={publishDate}
            />
          </ExistingDataContextProvider>
        ),
        size: '80%',
        title: ``,
      });
    },
    [fetch, integrations, modals, mutate, reloadCalendarView, t, toaster]
  );

  if (!feedChannels.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-textItemBlur text-[14px] p-[24px]">
        {t(
          'feed_preview_no_channels',
          'Connect a channel that supports feed preview to plan your grid.'
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-[16px] min-h-0">
      <div className="flex flex-wrap items-center gap-[10px]">
        <div className="text-[13px] font-heading font-[700] text-textItemBlur">
          {t('feed_preview_channel', 'Channel')}
        </div>
        <div className="flex flex-wrap gap-[6px]">
          {feedChannels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelectChannel(channel.id)}
              className={clsx(
                'flex items-center gap-[8px] h-[34px] px-[10px] rounded-[10px] border-[1.5px] text-[13px] font-heading font-[700] transition-transform hover:-translate-y-[1px]',
                integrationId === channel.id
                  ? 'border-newTextColor bg-newTextColor text-newBgColorInner'
                  : 'border-newOutline bg-newBgColorInner text-newTextColor shadow-hardSm'
              )}
            >
              <img
                src={channel.picture || '/no-picture.jpg'}
                alt=""
                className="w-[18px] h-[18px] rounded-full object-cover"
              />
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[12px] text-textItemBlur">
        {t(
          'feed_preview_hint',
          'Drag scheduled posts to swap their times. Published posts stay fixed.'
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-textItemBlur text-[14px]">
          {t('loading', 'Loading...')}
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-textItemBlur text-[14px]">
          {t(
            'feed_preview_load_failed',
            'Could not load feed preview. Try reconnecting the channel.'
          )}
        </div>
      ) : !data?.items?.length ? (
        <div className="flex-1 flex items-center justify-center text-textItemBlur text-[14px]">
          {t(
            'feed_preview_empty',
            'No posts yet. Schedule posts to preview your grid.'
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pe-[4px] scrollbar scrollbar-thumb-tableBorder scrollbar-track-transparent">
          <div className="grid grid-cols-3 gap-[2px] max-w-[720px]">
            {data.items.map((item) => (
              <FeedCell
                key={item.id}
                item={item}
                onSwap={onSwap}
                onOpen={onOpen}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
