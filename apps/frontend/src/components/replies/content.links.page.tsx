'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useToaster } from '@gitroom/react/toaster/toaster';
import {
  ReplyPost,
  useReplyPosts,
} from '@gitroom/frontend/components/replies/use.reply.posts';

export const ContentLinksPage = () => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const { data, isLoading, mutate } = useReplyPosts();
  const posts = Array.isArray(data) ? data : [];
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const current = posts.find((post) => post.id === selected);

  useEffect(() => {
    if (!selected && posts[0]) {
      setSelected(posts[0].id);
    }
  }, [posts, selected]);

  useEffect(() => {
    setPicked(current?.links.map((link) => link.id) || []);
  }, [current?.id]);

  const choices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (post.id === selected) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return `${post.title} ${post.channel}`.toLowerCase().includes(needle);
    });
  }, [posts, query, selected]);

  const toggle = (id: string) => {
    setPicked((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((item) => item !== id)
        : [...currentIds, id]
    );
  };

  const save = async () => {
    if (!selected) {
      return;
    }
    setSaving(true);
    const response = await fetch('/replies/links', {
      method: 'PUT',
      body: JSON.stringify({ postId: selected, relatedIds: picked }),
    });
    setSaving(false);
    if (!response.ok) {
      toaster.show(t('content_links_save_failed', 'Could not save links'), 'warning');
      return;
    }
    const next = posts.map((post) => {
      if (post.id === selected) {
        return {
          ...post,
          links: picked.map((id) => {
            const related = posts.find((item) => item.id === id);
            return {
              id,
              title: related?.title || '',
              releaseURL: related?.releaseURL || '',
              channel: related?.channel || '',
            };
          }),
        };
      }
      const without = post.links.filter((link) => link.id !== selected);
      if (!picked.includes(post.id)) {
        return { ...post, links: without };
      }
      if (without.some((link) => link.id === selected)) {
        return post;
      }
      return {
        ...post,
        links: [
          ...without,
          {
            id: selected,
            title: current?.title || '',
            releaseURL: current?.releaseURL || '',
            channel: current?.channel || '',
          },
        ],
      };
    });
    mutate(next, { revalidate: false });
    toaster.show(t('settings_updated', 'Settings updated'), 'success');
  };

  return (
    <div className="flex flex-1 flex-col gap-[16px] p-[20px] mobile:p-[12px]">
      <div>
        <h3 className="text-[20px] font-[600]">
          {t('content_links', 'Content links')}
        </h3>
        <div className="text-[13px] text-textItemBlur mt-[4px] max-w-[720px]">
          {t(
            'content_links_help',
            'Connect a post to other posts on any channel. A short can point at a long video, and one post can be linked to as many others as you need. Comment replies use these links when someone asks where to watch the rest.'
          )}
        </div>
      </div>
      {isLoading && (
        <div className="text-[13px] text-textItemBlur">{t('loading', 'Loading')}</div>
      )}
      {!isLoading && !posts.length && (
        <div className="text-[13px] text-textItemBlur">
          {t(
            'comment_replies_empty',
            'Published posts from your channels will show up here.'
          )}
        </div>
      )}
      {!!posts.length && (
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-[16px]">
          <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] max-h-[640px] overflow-y-auto">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelected(post.id)}
                className={`w-full text-left px-[14px] py-[12px] border-b border-newTableBorder last:border-b-0 ${
                  post.id === selected ? 'bg-boxFocused' : ''
                }`}
              >
                <div className="text-[14px] truncate">
                  {post.title || t('untitled', 'Untitled')}
                </div>
                <div className="text-[12px] text-textItemBlur truncate">
                  {post.channel}
                  {post.links.length
                    ? ` · ${post.links.length} ${t('content_links_count', 'linked')}`
                    : ''}
                </div>
              </button>
            ))}
          </div>
          <div className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[14px] flex flex-col gap-[12px]">
            <div className="text-[14px] font-[600]">
              {current?.title || t('untitled', 'Untitled')}
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('content_links_search', 'Search posts to link')}
              className="h-[40px] rounded-[8px] border border-newTableBorder bg-newBgColorInner px-[12px] text-[14px] outline-none"
            />
            <div className="flex flex-col max-h-[420px] overflow-y-auto">
              {choices.map((post: ReplyPost) => (
                <label
                  key={post.id}
                  className="flex items-start gap-[8px] py-[8px] border-b border-newTableBorder last:border-b-0 text-[13px]"
                >
                  <input
                    type="checkbox"
                    className="mt-[3px]"
                    checked={picked.includes(post.id)}
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
            <button
              type="button"
              disabled={saving || !selected}
              onClick={save}
              className="self-start h-[36px] px-[14px] rounded-[8px] bg-btnPrimary text-white text-[13px] font-[600] disabled:opacity-60"
            >
              {t('save', 'Save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
