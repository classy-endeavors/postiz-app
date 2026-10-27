'use client';

import {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useAddProvider } from '@gitroom/frontend/components/launches/add.provider.component';
import { useCreatePost } from '@gitroom/frontend/components/launches/new.post';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import { expandPostsList } from '@gitroom/helpers/utils/posts.list.minify';

export const HELP_DOCS_HREF = '/features';

const storageKey = (orgId: string, part: string) =>
  `getting-started:${orgId}:${part}`;

export const markGettingStartedAgentTried = (orgId?: string) => {
  if (typeof window === 'undefined' || !orgId) {
    return;
  }
  localStorage.setItem(storageKey(orgId, 'agent'), '1');
};

export const HelpDocsLink: FC<{
  className?: string;
  label?: string;
}> = ({ className, label }) => {
  const t = useT();
  return (
    <Link
      href={HELP_DOCS_HREF}
      target="_blank"
      rel="noreferrer"
      className={clsx(
        'inline-flex items-center gap-[6px] text-[13px] font-[600] text-btnPrimary hover:underline',
        className
      )}
    >
      {label || t('help_and_docs', 'Help & docs')}
    </Link>
  );
};

const useHasMedia = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await (await fetch('/media?page=1')).json()) as {
      pages: number;
      results: unknown[];
    };
  }, [fetch]);
  return useSWR('getting-started-media', load, {
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
  });
};

const useHasPosts = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return expandPostsList(
      await (await fetch('/posts/list?page=0&limit=1&state=all')).json()
    ) as {
      total?: number;
      posts?: unknown[];
    };
  }, [fetch]);
  return useSWR('getting-started-posts', load, {
    revalidateOnFocus: true,
    revalidateOnReconnect: false,
  });
};

type StepId = 'channel' | 'media' | 'post' | 'agent';

const RING_R = 14;
const RING_C = 2 * Math.PI * RING_R;

export const GettingStartedChecklist: FC = () => {
  const t = useT();
  const user = useUser();
  const router = useRouter();
  const { data: integrations } = useIntegrationList();
  const { data: media } = useHasMedia();
  const { data: postsData } = useHasPosts();
  const addChannel = useAddProvider();
  const createPost = useCreatePost();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<StepId | null>(null);
  const [agentTried, setAgentTried] = useState(false);

  useEffect(() => {
    if (!user?.orgId) {
      return;
    }
    setDismissed(
      localStorage.getItem(storageKey(user.orgId, 'dismissed')) === '1'
    );
    setAgentTried(
      localStorage.getItem(storageKey(user.orgId, 'agent')) === '1'
    );
    setOpen(localStorage.getItem(storageKey(user.orgId, 'open')) === '1');
    setReady(true);
  }, [user?.orgId]);

  const hasChannel = (integrations?.length || 0) > 0;
  const hasMedia =
    (media?.results?.length || 0) > 0 || (media?.pages || 0) > 0;
  const hasPost =
    (postsData?.total || 0) > 0 || (postsData?.posts?.length || 0) > 0;

  const steps = useMemo(
    () => [
      {
        id: 'channel' as StepId,
        done: hasChannel,
        title: t('getting_started_connect_channel', 'Connect a channel'),
        description: t(
          'getting_started_connect_channel_desc',
          'Link Instagram, YouTube, TikTok, LinkedIn, or Facebook to publish.'
        ),
        cta: t('add_channel', 'Add Channel'),
      },
      {
        id: 'media' as StepId,
        done: hasMedia,
        title: t('getting_started_upload_media', 'Upload media'),
        description: t(
          'getting_started_upload_media_desc',
          'Add images or videos to your media library for posts.'
        ),
        cta: t('getting_started_open_media', 'Open media'),
      },
      {
        id: 'post' as StepId,
        done: hasPost,
        title: t('getting_started_schedule_post', 'Schedule your first post'),
        description: t(
          'getting_started_schedule_post_desc',
          'Create a draft or schedule something to go out on a channel.'
        ),
        cta: t('create_new_post', 'Create Post'),
      },
      {
        id: 'agent' as StepId,
        done: agentTried,
        title: t('getting_started_try_agent', 'Try the agent or MCP'),
        description: t(
          'getting_started_try_agent_desc',
          'Chat with the agent, or connect MCP so your AI tools can schedule for you.'
        ),
        cta: t('getting_started_open_agent', 'Open agent'),
      },
    ],
    [agentTried, hasChannel, hasMedia, hasPost, t]
  );

  const doneCount = steps.filter((step) => step.done).length;
  const total = steps.length;
  const allDone = doneCount === total;
  const pct = total ? (doneCount / total) * 100 : 0;
  const next = steps.find((step) => !step.done);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!active || steps.find((s) => s.id === active)?.done) {
      setActive(next?.id ?? null);
    }
  }, [active, next?.id, ready, steps]);

  const setOpenPersist = useCallback(
    (value: boolean) => {
      setOpen(value);
      if (user?.orgId) {
        localStorage.setItem(storageKey(user.orgId, 'open'), value ? '1' : '0');
      }
    },
    [user?.orgId]
  );

  const dismiss = useCallback(() => {
    if (user?.orgId) {
      localStorage.setItem(storageKey(user.orgId, 'dismissed'), '1');
    }
    setDismissed(true);
  }, [user?.orgId]);

  const runStep = useCallback(
    async (id: StepId) => {
      if (id === 'channel') {
        await addChannel();
        return;
      }
      if (id === 'media') {
        router.push('/media');
        return;
      }
      if (id === 'post') {
        if (!hasChannel) {
          await addChannel();
          return;
        }
        await createPost();
        return;
      }
      markGettingStartedAgentTried(user?.orgId);
      setAgentTried(true);
      router.push('/agents');
    },
    [addChannel, createPost, hasChannel, router, user?.orgId]
  );

  if (!ready || dismissed) {
    return null;
  }

  return (
    <div className="fixed end-[20px] bottom-[20px] mobile:end-[12px] mobile:bottom-[88px] z-[40] text-newTextColor">
      {!open ? (
        <button
          type="button"
          aria-label={t('getting_started', 'Getting started')}
          onClick={() => setOpenPersist(true)}
          className="flex items-center gap-[10px] ps-[10px] pe-[16px] py-[8px] bg-newBgColorInner text-newTextColor border-[1.5px] border-newOutline rounded-full shadow-hard hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0_0_var(--new-hard-shadow)] transition-[transform,box-shadow] text-start"
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            className="shrink-0 -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="17"
              cy="17"
              r={RING_R}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-newOutline opacity-40"
            />
            <circle
              cx="17"
              cy="17"
              r={RING_R}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-btnPrimary transition-[stroke-dashoffset] duration-500"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C - (pct / 100) * RING_C}
            />
          </svg>
          <span className="flex flex-col leading-[1.2]">
            <strong className="text-[14px] font-[700]">
              {t('getting_started', 'Getting started')}
            </strong>
            <small className="text-[12px] text-textItemBlur max-w-[190px] overflow-hidden text-ellipsis whitespace-nowrap">
              {allDone
                ? t('getting_started_complete', 'Complete')
                : t(
                    'getting_started_launcher_next',
                    '{{done}}/{{total}} · Next: {{next}}',
                    {
                      done: doneCount,
                      total,
                      next: next?.title || '',
                    }
                  )}
            </small>
          </span>
        </button>
      ) : (
        <section
          role="dialog"
          aria-label={t('getting_started', 'Getting started')}
          className="w-[min(360px,calc(100vw-24px))] max-h-[min(560px,calc(100vh-40px))] overflow-auto bg-newBgColorInner border-[1.5px] border-newOutline rounded-[20px] shadow-hard p-[16px] origin-bottom-right"
        >
          <header className="flex justify-between gap-[12px]">
            <div className="min-w-0">
              <h2 className="m-0 text-[17px] font-[800] font-heading">
                {allDone
                  ? t('getting_started_all_set', "You're all set")
                  : t('getting_started', 'Getting started')}
              </h2>
              <p className="mt-[4px] mb-0 text-[13px] text-textItemBlur leading-[1.4]">
                {allDone
                  ? t(
                      'getting_started_all_set_desc',
                      'Everything is set up.'
                    )
                  : t(
                      'getting_started_panel_subtitle',
                      '{{done}} of {{total}} done. Finish these to publish your first content.',
                      { done: doneCount, total }
                    )}
              </p>
            </div>
            <button
              type="button"
              aria-label={t('minimize', 'Minimize')}
              onClick={() => setOpenPersist(false)}
              className="shrink-0 w-[28px] h-[28px] grid place-items-center rounded-[8px] border-0 bg-transparent text-newTextColor hover:bg-boxHover cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </header>

          <div
            className="h-[6px] rounded-full bg-newOutline/30 my-[14px] mb-[12px] overflow-hidden"
            aria-hidden="true"
          >
            <span
              className="block h-full bg-btnPrimary rounded-full transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="list-none m-0 p-0 grid gap-[6px]">
            {steps.map((step) => {
              const isOpen = active === step.id && !step.done;
              return (
                <li
                  key={step.id}
                  className={clsx(
                    'border border-newTableBorder rounded-[12px] bg-newBgColorInner',
                    isOpen && 'bg-newButter border-newOutline',
                    step.done && 'opacity-90'
                  )}
                >
                  <button
                    type="button"
                    disabled={step.done}
                    aria-expanded={isOpen}
                    onClick={() =>
                      setActive((current) =>
                        current === step.id ? null : step.id
                      )
                    }
                    className={clsx(
                      'w-full flex items-center gap-[10px] px-[12px] py-[10px] bg-transparent border-0 text-inherit text-[14px] font-[600] text-start',
                      step.done ? 'cursor-default' : 'cursor-pointer'
                    )}
                  >
                    <span
                      className={clsx(
                        'shrink-0 w-[20px] h-[20px] rounded-full border-[1.5px] grid place-items-center',
                        step.done
                          ? 'bg-statusPublished border-statusPublished text-white'
                          : 'border-textItemBlur'
                      )}
                      aria-hidden="true"
                    >
                      {step.done && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12l5 5 9-10" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={clsx(
                        'flex-1',
                        step.done &&
                          'text-textItemBlur line-through font-[500]'
                      )}
                    >
                      {step.title}
                    </span>
                    {!step.done && (
                      <svg
                        className={clsx(
                          'text-textItemBlur transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    )}
                  </button>
                  {!step.done && (
                    <div
                      className={clsx(
                        'grid transition-[grid-template-rows] duration-[220ms] ease-out',
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      )}
                    >
                      <div className="overflow-hidden">
                        <div
                          className={clsx(
                            'ps-[42px] pe-[12px]',
                            isOpen ? 'pb-[12px]' : 'pb-0'
                          )}
                        >
                          <p className="m-0 mb-[10px] text-[13px] text-textItemBlur leading-[1.45]">
                            {step.description}
                          </p>
                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => runStep(step.id)}
                              className="border-0 bg-btnPrimary text-white font-[600] text-[13px] px-[14px] py-[8px] rounded-[10px] cursor-pointer hover:opacity-95"
                            >
                              {step.cta}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <footer className="flex justify-between mt-[12px] text-[13px]">
            <HelpDocsLink />
            <button
              type="button"
              onClick={dismiss}
              className="bg-transparent border-0 text-textItemBlur cursor-pointer p-0 hover:text-newTextColor"
            >
              {allDone
                ? t('close', 'Close')
                : t('dismiss', 'Dismiss')}
            </button>
          </footer>
        </section>
      )}
    </div>
  );
};
