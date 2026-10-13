'use client';

import React, { FC, useState } from 'react';
import { capitalize } from 'lodash';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { isUSCitizen } from '@gitroom/frontend/components/launches/helpers/isuscitizen.utils';

export const isDirectPublishPost = (settings?: string | null) => {
  try {
    return !!JSON.parse(settings || '{}').directPublish;
  } catch (err) {
    return false;
  }
};

export const DirectPublishDetails: FC<{
  data: {
    posts: {
      title?: string | null;
      content: string;
      publishDate: string;
      releaseURL?: string | null;
      image: { path: string }[];
    }[];
    settings: {
      __type?: string;
      privacy?: string;
      tags?: string[];
      madeForKids?: boolean;
      publishAt?: string;
    };
  };
  channel?: string;
  close: () => void;
}> = ({ data, channel, close }) => {
  const t = useT();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const post = data.posts[0];
  const { settings } = data;
  const date = newDayjs(post.publishDate)
    .local()
    .format(isUSCitizen() ? 'L h:mm A' : 'L HH:mm');
  const scheduled =
    !!settings.publishAt && newDayjs(settings.publishAt).isAfter(newDayjs());
  const thumbnail = post.image?.[0]?.path;

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex gap-[16px] mobile:flex-col">
        {!!thumbnail && !thumbnailFailed && (
          <img
            className="w-[200px] mobile:w-full aspect-video object-cover rounded-[10px] shrink-0 bg-newBgColorInner"
            src={thumbnail}
            alt={post.title || ''}
            onError={() => setThumbnailFailed(true)}
          />
        )}
        <div className="flex flex-col gap-[6px] min-w-0">
          <div className="text-[18px] font-[700] break-words">
            {post.title || post.content}
          </div>
          {!!channel && (
            <div className="flex items-center gap-[6px] text-[13px] text-textItemBlur">
              <img
                className="w-[14px] h-[14px] rounded-[3px]"
                src={`/icons/platforms/${settings.__type}.png`}
                alt={settings.__type}
              />
              {channel}
            </div>
          )}
          <div className="text-[13px] text-textItemBlur">
            {scheduled
              ? t('direct_publish_scheduled_for', 'Scheduled for')
              : t('direct_publish_published_at', 'Published at')}{' '}
            {date}
          </div>
          <div className="flex flex-wrap gap-[6px] text-[11px] font-[700]">
            {!!settings.privacy && (
              <span className="px-[9px] py-[3px] rounded-full bg-newBorder text-textItemBlur">
                {capitalize(settings.privacy)}
              </span>
            )}
            {!!settings.madeForKids && (
              <span className="px-[9px] py-[3px] rounded-full bg-newBorder text-textItemBlur">
                {t('made_for_kids', 'Made for kids')}
              </span>
            )}
          </div>
        </div>
      </div>
      {!!post.releaseURL && (
        <div className="flex flex-col gap-[4px]">
          <div className="text-[13px] font-[700]">{t('link', 'Link')}</div>
          <a
            href={post.releaseURL}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] text-textItemBlur break-all underline hover:text-textItemFocused"
          >
            {post.releaseURL}
          </a>
        </div>
      )}
      {!!post.title && !!post.content && post.content !== post.title && (
        <div className="flex flex-col gap-[4px]">
          <div className="text-[13px] font-[700]">
            {t('description', 'Description')}
          </div>
          <div className="text-[13px] text-textItemBlur whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
            {post.content}
          </div>
        </div>
      )}
      {!!settings.tags?.length && (
        <div className="flex flex-col gap-[4px]">
          <div className="text-[13px] font-[700]">{t('tags', 'Tags')}</div>
          <div className="flex flex-wrap gap-[6px]">
            {settings.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-[700] px-[9px] py-[3px] rounded-full bg-newBorder text-textItemBlur"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="text-[12px] text-textItemBlur">
        {t(
          'direct_publish_read_only',
          'Published directly from MCP. The media is not stored in AI Zyntra, so this post is read-only here, edit it on the platform.'
        )}
      </div>
      <div className="flex gap-[8px]">
        {!!post.releaseURL && (
          <Button
            className="rounded-[8px]"
            onClick={() => window.open(post.releaseURL!, '_blank')}
          >
            {t('open_post', 'Open post')}
          </Button>
        )}
        <Button secondary className="rounded-[8px]" onClick={close}>
          {t('close', 'Close')}
        </Button>
      </div>
    </div>
  );
};
