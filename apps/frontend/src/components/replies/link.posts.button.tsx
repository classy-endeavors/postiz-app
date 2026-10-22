'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useClickOutside } from '@mantine/hooks';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useReplyPosts } from '@gitroom/frontend/components/replies/use.reply.posts';

export const LinkPostsButton = ({
  value,
  onChange,
  currentIds,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  currentIds: string[];
}) => {
  const t = useT();
  const { data } = useReplyPosts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const seeded = useRef(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const posts = Array.isArray(data) ? data : [];

  useEffect(() => {
    if (seeded.current || !posts.length || !currentIds.length) {
      return;
    }
    const current = posts.find((post) => currentIds.includes(post.id));
    seeded.current = true;
    if (current) {
      onChange(current.links.map((link) => link.id));
    }
  }, [posts, currentIds]);

  const choices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (currentIds.includes(post.id)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return `${post.title} ${post.channel}`.toLowerCase().includes(needle);
    });
  }, [posts, query, currentIds]);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id]
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="h-[40px] px-[12px] rounded-[8px] border border-newTableBorder bg-newBgColorInner text-[13px] font-[600]"
      >
        {value.length
          ? `${t('link_posts', 'Link existing content')} (${value.length})`
          : t('link_posts', 'Link existing content')}
      </button>
      {open && (
        <div className="absolute bottom-[46px] left-0 z-[30] w-[320px] max-h-[320px] overflow-hidden flex flex-col bg-newBgColorInner border border-newTableBorder rounded-[12px] shadow-hard">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('content_links_search', 'Search posts to link')}
            className="h-[40px] border-b border-newTableBorder px-[12px] text-[13px] outline-none bg-transparent"
          />
          <div className="overflow-y-auto">
            {!choices.length && (
              <div className="p-[12px] text-[12px] text-textItemBlur">
                {t(
                  'comment_replies_empty',
                  'Published posts from your channels will show up here.'
                )}
              </div>
            )}
            {choices.map((post) => (
              <label
                key={post.id}
                className="flex items-start gap-[8px] px-[12px] py-[8px] text-[13px] border-b border-newTableBorder last:border-b-0"
              >
                <input
                  type="checkbox"
                  className="mt-[3px]"
                  checked={value.includes(post.id)}
                  onChange={() => toggle(post.id)}
                />
                <span className="min-w-0">
                  <span className="block truncate">
                    {post.title || t('untitled', 'Untitled')}
                  </span>
                  <span className="block text-[12px] text-textItemBlur truncate">
                    {post.channel}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
