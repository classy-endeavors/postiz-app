'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useReplyPosts } from '@gitroom/frontend/components/replies/use.reply.posts';

export const CommentsPage = () => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const { data, isLoading, mutate } = useReplyPosts();
  const [query, setQuery] = useState('');
  const posts = Array.isArray(data) ? data : [];
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return posts;
    }
    return posts.filter((post) =>
      `${post.title} ${post.channel}`.toLowerCase().includes(needle)
    );
  }, [posts, query]);
  const allOn = visible.length > 0 && visible.every((post) => post.enabled);

  const save = async (ids: string[], enabled: boolean) => {
    const next = posts.map((post) =>
      ids.includes(post.id) ? { ...post, enabled } : post
    );
    mutate(next, { revalidate: false });
    const response = await fetch('/replies/posts', {
      method: 'PUT',
      body: JSON.stringify({ ids, enabled }),
    });
    if (!response.ok) {
      mutate();
      toaster.show(
        t('comment_replies_save_failed', 'Could not update comment replies'),
        'warning'
      );
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-[16px] p-[20px] mobile:p-[12px]">
      <div>
        <h3 className="text-[20px] font-[600]">
          {t('comment_replies', 'Comment replies')}
        </h3>
        <div className="text-[13px] text-textItemBlur mt-[4px] max-w-[720px]">
          {t(
            'comment_replies_page_help',
            'Turn replies on for the posts you want answered. A reply uses the post and anything you linked to it, and costs 1 coin when it is posted. Reconnect YouTube, Instagram, and Facebook Page so comment permission is included.'
          )}
        </div>
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('comment_replies_search', 'Search posts')}
        className="h-[40px] max-w-[360px] rounded-[8px] border border-newTableBorder bg-newBgColorInner px-[12px] text-[14px] outline-none"
      />
      <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[40px_1fr_180px_140px] gap-[8px] px-[12px] h-[44px] items-center text-[12px] text-textItemBlur border-b border-newTableBorder">
            <input
              type="checkbox"
              checked={allOn}
              disabled={!visible.length}
              onChange={(event) =>
                save(
                  visible.map((post) => post.id),
                  event.target.checked
                )
              }
            />
            <div>{t('post', 'Post')}</div>
            <div>{t('channel', 'Channel')}</div>
            <div>{t('date', 'Date')}</div>
          </div>
          {isLoading && (
            <div className="p-[16px] text-[13px] text-textItemBlur">
              {t('loading', 'Loading')}
            </div>
          )}
          {!isLoading && !visible.length && (
            <div className="p-[16px] text-[13px] text-textItemBlur">
              {t(
                'comment_replies_empty',
                'Published posts from your channels will show up here.'
              )}
            </div>
          )}
          {visible.map((post) => (
            <div
              key={post.id}
              className="grid grid-cols-[40px_1fr_180px_140px] gap-[8px] px-[12px] min-h-[52px] items-center border-b border-newTableBorder last:border-b-0"
            >
              <input
                type="checkbox"
                checked={post.enabled}
                onChange={(event) => save([post.id], event.target.checked)}
              />
              <div className="min-w-0">
                <div className="text-[14px] truncate">
                  {post.title || t('untitled', 'Untitled')}
                </div>
                {!!post.links.length && (
                  <div className="text-[12px] text-textItemBlur truncate">
                    {t('comment_replies_linked', 'Linked')}:{' '}
                    {post.links.map((link) => link.title || link.channel).join(', ')}
                  </div>
                )}
              </div>
              <div className="text-[13px] truncate">{post.channel}</div>
              <div className="text-[13px] text-textItemBlur">
                {dayjs(post.publishDate).format('MMM D, YYYY')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
