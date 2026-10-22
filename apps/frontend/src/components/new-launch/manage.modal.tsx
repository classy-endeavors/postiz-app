'use client';

import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AddEditModalProps } from '@gitroom/frontend/components/new-launch/add.edit.modal';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { PicksSocialsComponent } from '@gitroom/frontend/components/new-launch/picks.socials.component';
import { EditorWrapper } from '@gitroom/frontend/components/new-launch/editor';
import { SelectCurrent } from '@gitroom/frontend/components/new-launch/select.current';
import { ShowAllProviders } from '@gitroom/frontend/components/new-launch/providers/show.all.providers';
import { useExistingData } from '@gitroom/frontend/components/launches/helpers/use.existing.data';
import { useLaunchStore } from '@gitroom/frontend/components/new-launch/store';
import { DatePicker } from '@gitroom/frontend/components/launches/helpers/date.picker';
import { useShallow } from 'zustand/react/shallow';
import { RepeatComponent } from '@gitroom/frontend/components/launches/repeat.component';
import { LinkPostsButton } from '@gitroom/frontend/components/replies/link.posts.button';
import { TagsComponent } from '@gitroom/frontend/components/launches/tags.component';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { capitalize } from 'lodash';
import { SelectCustomer } from '@gitroom/frontend/components/launches/select.customer';
import { CopilotPopup } from '@copilotkit/react-ui';
import { DummyCodeComponent } from '@gitroom/frontend/components/new-launch/dummy.code.component';
import { CreationMethodBadge } from '@gitroom/frontend/components/launches/creation.method.badge';
import {
  SettingsIcon,
  ChevronDownIcon,
  CloseIcon,
  TrashIcon,
  DropdownArrowSmallIcon,
} from '@gitroom/frontend/components/ui/icons';
import { useHasScroll } from '@gitroom/frontend/components/ui/is.scroll.hook';
import { useShortlinkPreference } from '@gitroom/frontend/components/settings/shortlink-preference.component';
import dayjs from 'dayjs';
import { Button } from '@gitroom/react/form/button';
import { useClickOutside } from '@mantine/hooks';
import { mutate as globalMutate } from 'swr';

type ComposerMedia = {
  id: string;
  path: string;
  alt?: string;
  thumbnail?: string;
  thumbnailTimestamp?: number;
};

type ComposerPostValue = {
  id?: string;
  content: string;
  delay?: number;
  media?: ComposerMedia[];
};

type ComposerChannelDraft = {
  id: string;
  identifier?: string;
  settings?: Record<string, unknown>;
  values: ComposerPostValue[];
};

type ChannelFocusTarget = 'form' | 'preview';

type ChannelIssue = {
  id: string;
  identifier: string;
  name: string;
  messages: string[];
  focus: ChannelFocusTarget;
};

type ValidPostResult = {
  id: string;
  identifier: string;
  name: string;
  emptyContent?: boolean;
  tooLong?: boolean;
  maximumCharacters?: number;
  valid?: boolean;
  settingsErrors?: string[];
  settingsError?: string;
  errors?: true | string;
};

const aggregateChannelIssues = (
  checkAllValid: ValidPostResult[],
  type: string,
  // Same shape as useT() — keep loose so callers do not fight the i18n typings.
  t: (key: string, fallback: string, params?: any) => string
): ChannelIssue[] => {
  const issues: ChannelIssue[] = [];
  for (const item of checkAllValid) {
    const messages: string[] = [];
    let focusWhere: ChannelFocusTarget = 'preview';

    if (item.emptyContent) {
      messages.push(
        t(
          'post_needs_content_or_image',
          'Your post should have at least one character or one image.'
        )
      );
    }

    if (type !== 'draft') {
      if (item.tooLong) {
        messages.push(
          t(
            'post_exceeds_character_limit',
            'Caption exceeds the {{max}} character limit',
            { max: item.maximumCharacters }
          )
        );
      }

      if (item.valid === false) {
        const settingsMessages: string[] =
          Array.isArray(item.settingsErrors) && item.settingsErrors.length
            ? item.settingsErrors
            : [
                item.settingsError ||
                  t('please_fix_your_settings', 'Please fix your settings'),
              ];
        messages.push(...settingsMessages);
        focusWhere = 'form';
      }

      if (item.errors !== true) {
        messages.push(String(item.errors));
      }
    }

    if (messages.length) {
      issues.push({
        id: item.id,
        identifier: item.identifier,
        name: item.name,
        messages: [...new Set(messages)],
        focus: focusWhere,
      });
    }
  }
  return issues;
};

export const ManageModal: FC<AddEditModalProps> = (props) => {
  const t = useT();
  const fetch = useFetch();
  const ref = useRef(null);
  const existingData = useExistingData();
  const [loading, setLoading] = useState(false);
  const [postNowOpen, setPostNowOpen] = useState(false);
  const toaster = useToaster();
  const modal = useModals();
  const [showSettings, setShowSettings] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [channelIssues, setChannelIssues] = useState<ChannelIssue[]>([]);
  const [channelIssuesExpanded, setChannelIssuesExpanded] = useState(true);
  const { data: shortlinkPreferenceData } = useShortlinkPreference();
  const postNowMenuRef = useClickOutside<HTMLDivElement>(() =>
    setPostNowOpen(false)
  );

  const { addEditSets, mutate, customClose, dummy } = props;
  const publishErrors = useMemo(() => {
    const errors = (existingData?.posts || [])
      .filter((post: { state?: string; error?: string }) => post.state === 'ERROR' && post.error)
      .map((post: { error: string }) => post.error);
    return [...new Set(errors)] as string[];
  }, [existingData]);

  const {
    selectedIntegrations,
    hide,
    date,
    setDate,
    repeater,
    setRepeater,
    tags,
    setTags,
    integrations,
    setSelectedIntegrations,
    locked,
    current,
    activateExitButton,
    setHide,
    setCurrent,
    groupScope,
    setGroupScope,
    addOrRemoveSelectedIntegration,
    addInternalValue,
    globalValues,
    internalValues,
  } = useLaunchStore(
    useShallow((state) => ({
      hide: state.hide,
      setHide: state.setHide,
      date: state.date,
      setDate: state.setDate,
      current: state.current,
      setCurrent: state.setCurrent,
      repeater: state.repeater,
      setRepeater: state.setRepeater,
      tags: state.tags,
      setTags: state.setTags,
      selectedIntegrations: state.selectedIntegrations,
      integrations: state.integrations,
      setSelectedIntegrations: state.setSelectedIntegrations,
      locked: state.locked,
      activateExitButton: state.activateExitButton,
      groupScope: state.groupScope,
      setGroupScope: state.setGroupScope,
      addOrRemoveSelectedIntegration: state.addOrRemoveSelectedIntegration,
      addInternalValue: state.addInternalValue,
      globalValues: state.global,
      internalValues: state.internal,
    }))
  );

  useEffect(() => {
    if (hide) {
      setHide(false);
    }
  }, [hide]);

  // Live per-channel validation before Add to Calendar (ZQA-016): keep the
  // checklist and tab badges in sync while editing, without focusing or toasting.
  const liveValidateGen = useRef(0);
  const runLiveValidation = useCallback(async () => {
    if (dummy || !ref.current?.getAllValues || !selectedIntegrations.length) {
      setChannelIssues([]);
      return;
    }
    const gen = ++liveValidateGen.current;
    try {
      const allValues = (await ref.current.getAllValues()) as ComposerChannelDraft[];
      if (gen !== liveValidateGen.current) {
        return;
      }
      const channels = existingData.channels || [];
      const usedIds = new Set<string>();
      const group = existingData.group || makeId(10);
      const posts = allValues.map((post) => {
        const channel = channels.find((item) => item.integration === post.id);
        return {
          integration: { id: post.id },
          group,
          settings: { ...(post.settings || {}) },
          value: post.values.map((value, index) => {
            const owned = channel?.posts?.[index]?.id as string | undefined;
            let id: string | undefined = owned || value.id;
            if (id && usedIds.has(id)) {
              id = undefined;
            }
            if (id) {
              usedIds.add(id);
            }
            return {
              ...(id ? { id } : {}),
              content: value.content,
              delay: value.delay || 0,
              image:
                (value.media || []).map(
                  ({
                    id: mediaId,
                    path,
                    alt,
                    thumbnail,
                    thumbnailTimestamp,
                  }) => ({
                    id: mediaId,
                    path,
                    alt,
                    thumbnail,
                    thumbnailTimestamp,
                  })
                ) || [],
            };
          }),
        };
      });

      // Match Add to Calendar rules (media/settings), not draft skips.
      const checkAllValid = await (
        await fetch('/posts/valid', {
          method: 'POST',
          body: JSON.stringify({ type: 'schedule', posts }),
        })
      ).json();
      if (gen !== liveValidateGen.current) {
        return;
      }
      if (!Array.isArray(checkAllValid)) {
        return;
      }
      setChannelIssues(aggregateChannelIssues(checkAllValid, 'schedule', t));
    } catch {
      // Ignore transient failures while typing; submit still validates.
    }
  }, [
    dummy,
    existingData.channels,
    existingData.group,
    fetch,
    selectedIntegrations.length,
    t,
  ]);

  useEffect(() => {
    if (dummy) {
      return;
    }
    const timer = setTimeout(() => {
      void runLiveValidation();
    }, 450);
    return () => clearTimeout(timer);
  }, [
    dummy,
    runLiveValidation,
    selectedIntegrations,
    globalValues,
    internalValues,
    current,
  ]);

  // Settings (e.g. YouTube title) live in RHF and do not update the store —
  // poll lightly so title/media rules still surface before submit.
  useEffect(() => {
    if (dummy) {
      return;
    }
    const interval = setInterval(() => {
      void runLiveValidation();
    }, 1600);
    return () => clearInterval(interval);
  }, [dummy, runLiveValidation]);

  const channelIssueMessages = useMemo(() => {
    return channelIssues.reduce(
      (all, issue) => {
        all[issue.id] = issue.messages;
        return all;
      },
      {} as Record<string, string[]>
    );
  }, [channelIssues]);

  const currentIntegrationText = useMemo(() => {
    if (current === 'global') {
      return (
        <div className="flex items-center gap-[10px]">
          <div className="relative">
            <SettingsIcon size={15} className="text-white" />
          </div>
          <div>Settings</div>
        </div>
      );
    }

    const currentIntegration = integrations.find((p) => p.id === current)!;

    return (
      <div className="flex items-center gap-[10px]">
        <div className="relative">
          <img
            src={`/icons/platforms/${currentIntegration.identifier}.png`}
            className="w-[20px] h-[20px] rounded-[4px]"
            alt={currentIntegration.identifier}
          />
          <SettingsIcon
            size={15}
            className="text-white absolute -end-[5px] -bottom-[5px]"
          />
        </div>
        <div>
          {currentIntegration.name} {t('channel_settings', 'Settings')}
        </div>
      </div>
    );
  }, [current, integrations, t]);

  const changeCustomer = useCallback(
    (customer: string) => {
      const neededIntegrations = integrations.filter(
        (p) => p?.customer?.id === customer
      );
      setSelectedIntegrations(
        neededIntegrations.map((p) => ({
          settings: {},
          selectedIntegrations: p,
        }))
      );
    },
    [integrations, setSelectedIntegrations]
  );

  const askClose = useCallback(async () => {
    if (!activateExitButton || dummy) {
      return;
    }

    if (
      await deleteDialog(
        t(
          'are_you_sure_you_want_to_close_this_modal_all_data_will_be_lost',
          'Are you sure you want to close this modal? (all data will be lost)'
        ),
        t('yes_close_it', 'Yes, close it!')
      )
    ) {
      if (customClose) {
        customClose();
        return;
      }
      modal.closeAll();
    }
  }, [activateExitButton, dummy, t, customClose, modal]);

  const deletePost = useCallback(async () => {
    setLoading(true);
    const channelCount = existingData.channels?.length || 1;
    const deleteAll = groupScope === 'group' && channelCount > 1;
    if (
      !(await deleteDialog(
        deleteAll
          ? t(
              'are_you_sure_you_want_to_delete_post_all_channels',
              'Are you sure you want to delete this post on all {{count}} channels? Coins spent to schedule it are not refunded.',
              { count: channelCount }
            )
          : t(
              'are_you_sure_you_want_to_delete_post_no_refund',
              'Are you sure you want to delete this post? Coins spent to schedule it are not refunded.'
            ),
        t('yes_delete_it', 'Yes, delete it!')
      ))
    ) {
      setLoading(false);
      return;
    }
    const onlyIntegration =
      groupScope === 'channel'
        ? selectedIntegrations[0]?.integration.id
        : '';
    const integrationQuery = onlyIntegration
      ? `?integration=${encodeURIComponent(onlyIntegration)}`
      : '';
    await fetch(`/posts/${existingData.group}${integrationQuery}`, {
      method: 'DELETE',
    });
    toaster.show(
      t('post_deleted_successfully', 'Post deleted successfully'),
      'success'
    );
    mutate();
    modal.closeAll();
    return;
  }, [existingData, groupScope, mutate, modal, selectedIntegrations, t, fetch, toaster]);

  const schedule = useCallback(
    (type: 'draft' | 'now' | 'schedule' | 'update') => async () => {
      setPostNowOpen(false);
      let republish = false;

      if (type === 'schedule' && date.isBefore(dayjs())) {
        toaster.show(
          t(
            'cannot_schedule_in_the_past',
            'Choose a future date and time to schedule this post.'
          ),
          'warning'
        );
        return;
      }

      const postState = existingData?.posts?.[0]?.state;
      const needsPublishConfirm =
        (type === 'now' || type === 'schedule') &&
        (postState === 'PUBLISHED' ||
          postState === 'ERROR' ||
          (postState === 'QUEUE' && dayjs().isAfter(date.utc())));

      // Confirm before immediate publish (mis-click on the Post now menu item
      // sits directly above Add to Calendar). Republish flow already confirms.
      if (type === 'now' && !needsPublishConfirm) {
        if (
          !(await deleteDialog(
            t(
              'are_you_sure_you_want_to_post_now',
              'This will publish your post immediately. Continue?'
            ),
            t('yes_post_now', 'Yes, post now')
          ))
        ) {
          return;
        }
      }

      if (needsPublishConfirm) {
        const channels = selectedIntegrations
          .map((p) => p.integration.name)
          .join(', ');
        const isRecurring =
          !!repeater || !!existingData?.posts?.[0]?.intervalInDays;
        const isFailed = postState === 'ERROR';

        const whatToDo = await new Promise((resolve) => {
          modal.openModal({
            title: t('what_do_you_want_to_do', 'What do you want to do?'),
            children: (
              <div className="flex flex-col">
                <div className="text-[20px] mb-[20px]">
                  {isFailed
                    ? t(
                        'post_failed_retry_warning',
                        'This post failed to publish. Retrying will try to publish it again to'
                      )
                    : t(
                        'post_already_published_republish_warning',
                        'This post was already published. Republishing will publish it again to'
                      )}{' '}
                  {channels} {t('republish_at', 'at')}{' '}
                  {date.format('DD/MM/YYYY HH:mm')}.
                  {isRecurring && (
                    <div className="mt-[10px]">
                      {t(
                        'republish_recurring_note',
                        'This is a recurring post: your changes apply to all future recurrences starting now.'
                      )}
                    </div>
                  )}
                </div>
                <div className="flex w-full gap-[10px]">
                  <div className="flex-1 flex">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => resolve('update')}
                    >
                      {t(
                        'just_update_post_details',
                        'Just update the post details'
                      )}
                    </Button>
                  </div>
                  <div className="flex-1 flex">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => resolve('republish')}
                    >
                      {isFailed
                        ? t('retry_publishing', 'Retry publishing')
                        : t('republish_the_post', 'Republish the post')}
                    </Button>
                  </div>
                </div>
              </div>
            ),
          });
        });

        if (whatToDo === 'update') {
          type = 'update';
        }

        if (whatToDo === 'republish') {
          republish = true;
        }
      }

      setLoading(true);

      // Pull the local values to build the payload, but rely on the server
      // (`/posts/valid`) for the actual validation — checkValidity now lives
      // server-side so it can't be bypassed.
      const allValues = (await ref.current.getAllValues()) as ComposerChannelDraft[];

      const integrationById = (id: string) =>
        selectedIntegrations.find((p) => p.integration.id === id);

      const group = existingData.group || makeId(10);
      const channels = existingData.channels || [];
      const usedIds = new Set<string>();

      const posts = allValues.map((post) => {
        const channel = channels.find((item) => item.integration === post.id);
        return {
          integration: {
            id: post.id,
          },
          group,
          settings: { ...(post.settings || {}) },
          value: post.values.map((value, index) => {
            const owned = channel?.posts?.[index]?.id as string | undefined;
            let id: string | undefined = owned || value.id;
            if (id && usedIds.has(id)) {
              id = undefined;
            }
            if (id) {
              usedIds.add(id);
            }
            return {
              ...(id ? { id } : {}),
              content: value.content,
              delay: value.delay || 0,
              image:
                (value.media || []).map(
                  ({ id: mediaId, path, alt, thumbnail, thumbnailTimestamp }) => ({
                    id: mediaId,
                    path,
                    alt,
                    thumbnail,
                    thumbnailTimestamp,
                  })
                ) || [],
            };
          }),
        };
      });

      if (!dummy) {
        const checkAllValid = await (
          await fetch('/posts/valid', {
            method: 'POST',
            body: JSON.stringify({ type, posts }),
          })
        ).json();

        const focusChannel = (
          id: string,
          where: ChannelFocusTarget
        ) => {
          const handle = integrationById(id)?.ref?.current as
            | Partial<Record<ChannelFocusTarget, () => void>>
            | undefined;
          handle?.[where]?.();
        };

        const issues = aggregateChannelIssues(checkAllValid, type, t);

        if (issues.length) {
          setChannelIssues(issues);
          setChannelIssuesExpanded(true);
          setLoading(false);
          const first = issues[0];
          setCurrent(first.id);
          setHide(true);
          if (first.focus === 'form') {
            setShowSettings(true);
          } else {
            setShowSettings(false);
          }
          focusChannel(first.id, first.focus);
          toaster.show(
            t(
              'fix_all_channel_issues',
              'Fix every issue listed below before scheduling.'
            ),
            'warning'
          );
          return;
        }

        setChannelIssues([]);
      }

      const shortlinkPreference = shortlinkPreferenceData?.shortlink || 'ASK';

      let shortLink = false;

      if (!dummy && shortlinkPreference !== 'NO') {
        const shortLinkUrl = await (
          await fetch('/posts/should-shortlink', {
            method: 'POST',
            body: JSON.stringify({
              messages: allValues
                // platforms that remove links won't keep shortlinks either
                .filter(
                  (p) => !integrationById(p.id)?.integration?.stripLinks
                )
                .flatMap((p) => p.values.flatMap((a) => a.content)),
            }),
          })
        ).json();

        if (shortLinkUrl.ask) {
          if (shortlinkPreference === 'YES') {
            // Automatically shortlink without asking
            shortLink = true;
          } else {
            // ASK: Show the dialog
            shortLink = await deleteDialog(
              t(
                'shortlink_urls_question',
                'Do you want to shortlink the URLs? it will let you get statistics over clicks'
              ),
              t('yes_shortlink_it', 'Yes, shortlink it!'),
              undefined,
              t('no_original_urls', 'No, original URLs')
            );
          }
        }
      }

      const data = {
        type,
        ...(republish ? { republish } : {}),
        ...(repeater ? { inter: repeater } : {}),
        tags,
        shortLink,
        date: date.utc().toISOString(),
        posts,
        links,
        applyTo: groupScope,
      };

      if (dummy) {
        modal.openModal({
          title: '',
          children: <DummyCodeComponent code={data} />,
          classNames: {
            modal: 'w-[100%] bg-transparent text-textColor',
          },
          size: '100%',
          withCloseButton: false,
          closeOnEscape: true,
          closeOnClickOutside: true,
        });

        setLoading(false);
      }

      if (!dummy) {
        if (addEditSets) {
          addEditSets(data);
        } else {
          const response = await fetch('/posts', {
            method: 'POST',
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            if (response.status !== 402) {
              const { message } = await response.json().catch(() => ({}));
              toaster.show(
                typeof message === 'string'
                  ? message
                  : t('post_save_failed', 'Could not save the post'),
                'warning'
              );
            }
            setLoading(false);
            return;
          }
        }

        if (!addEditSets) {
          mutate();
          if (type === 'schedule' || type === 'now') {
            globalMutate('/coins/balance');
          }
          toaster.show(
            !existingData.integration
              ? t('added_successfully', 'Added successfully')
              : t('updated_successfully', 'Updated successfully')
          );
        }
        if (customClose) {
          setTimeout(() => {
            customClose();
          }, 2000);
        }

        if (!addEditSets) {
          modal.closeAll();
        }
      }
    },
    [
      addEditSets,
      customClose,
      date,
      dummy,
      existingData,
      fetch,
      groupScope,
      links,
      modal,
      mutate,
      ref,
      repeater,
      selectedIntegrations,
      setCurrent,
      setHide,
      shortlinkPreferenceData,
      t,
      tags,
      toaster,
    ]
  );

  const groupedChannels = existingData.channels || [];
  const editingMany = groupedChannels.length > 1;
  const channelChoices = groupedChannels.map((channel) => ({
    id: channel.integration,
    name:
      integrations.find((item) => item.id === channel.integration)?.name ||
      t('channel', 'channel'),
  }));
  const narrowToChannel = (integrationId: string) => {
    const alreadyInternal = internalValues.some(
      (item) => item.integration.id === integrationId
    );
    if (!alreadyInternal && globalValues.length) {
      const channel = groupedChannels.find(
        (item) => item.integration === integrationId
      );
      addInternalValue(
        0,
        integrationId,
        globalValues.map((value, index) => ({
          ...value,
          id: (channel?.posts?.[index]?.id as string | undefined) || value.id,
        }))
      );
    }
    for (const selected of selectedIntegrations) {
      if (selected.integration.id !== integrationId) {
        addOrRemoveSelectedIntegration(
          selected.integration,
          selected.settings
        );
      }
    }
    setCurrent(integrationId);
    setGroupScope('channel');
  };
  const onlyChannelName =
    channelChoices.find(
      (channel) => channel.id === selectedIntegrations[0]?.integration.id
    )?.name || channelChoices[0]?.name;

  return (
    <div className="w-full h-full flex-1 p-[40px] mobile:p-0 flex relative">
      <div className="flex flex-1 bg-newBgColorInner rounded-[20px] mobile:rounded-none flex-col min-w-0">
        <div className="flex-1 flex min-h-0">
          <div className="flex flex-col flex-1 min-w-0 border-e border-newBorder mobile:border-e-0">
            <div className="bg-newBgColor h-[65px] mobile:h-[56px] rounded-s-[20px] mobile:rounded-none !rounded-b-[0] flex items-center gap-[12px] px-[20px] mobile:px-[14px] text-[20px] mobile:text-[18px] font-[600]">
              {existingData?.integration
                ? t('edit_post_title', 'Edit Post')
                : t('create_post_title', 'Create Post')}
              <CreationMethodBadge
                creationMethod={existingData?.posts?.[0]?.creationMethod}
                size="sm"
              />
              <div className="hidden mobile:block ms-auto cursor-pointer">
                <CloseIcon onClick={askClose} className="text-[#A3A3A3]" />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-[16px] min-h-0">
              <div
                className={clsx('flex-1 relative', showSettings && 'hidden')}
              >
                <div
                  id="social-content"
                  className="gap-[32px] mobile:gap-[16px] flex flex-col pe-[8px] pt-[20px] ps-[20px] mobile:pt-[12px] mobile:ps-[12px] mobile:pe-[12px] absolute top-0 left-0 w-full h-full overflow-x-hidden overflow-y-scroll scrollbar scrollbar-thumb-newColColor scrollbar-track-newBgColorInner"
                >
                  {!!publishErrors.length && (
                    <div className="rounded-[12px] border border-statusFailed bg-statusFailedBg px-[14px] py-[12px] flex flex-col gap-[6px]">
                      <div className="text-[14px] font-[700] text-statusFailed">
                        {t(
                          'post_failed_to_publish',
                          'This post failed to publish'
                        )}
                      </div>
                      {publishErrors.map((error) => (
                        <div
                          key={error}
                          className="text-[13px] text-statusFailed whitespace-pre-wrap break-words"
                        >
                          {error === 'Unknown Error'
                            ? t(
                                'post_failed_unknown',
                                'The platform rejected this post but did not say why. Update it and try again.'
                              )
                            : error}
                        </div>
                      ))}
                    </div>
                  )}
                  {editingMany && groupScope === 'group' && (
                    <div className="rounded-[12px] border border-newOutline bg-newBgColor px-[14px] py-[12px] flex flex-col gap-[10px]">
                      <div className="text-[13px] text-newTextColor">
                        {t(
                          'edit_applies_to_all_channels',
                          'Caption and time apply to all {{count}} channels: {{names}}.',
                          {
                            count: channelChoices.length,
                            names: channelChoices
                              .map((channel) => channel.name)
                              .join(', '),
                          }
                        )}
                      </div>
                      <div className="flex flex-wrap gap-[8px]">
                        {channelChoices.map((channel) => (
                          <button
                            key={channel.id}
                            type="button"
                            onClick={() => narrowToChannel(channel.id)}
                            className="h-[32px] px-[12px] rounded-[8px] border border-newOutline bg-newBgColorInner text-[12px] font-[700] text-newTextColor"
                          >
                            {t('edit_only_channel', 'Edit only {{name}}', {
                              name: channel.name,
                            })}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {editingMany && groupScope === 'channel' && (
                    <div className="rounded-[12px] border border-newOutline bg-newBgColor px-[14px] py-[12px] text-[13px] text-newTextColor">
                      {t(
                        'editing_one_channel_only',
                        'Editing {{name}} only. The other channels keep their caption and time.',
                        { name: onlyChannelName }
                      )}
                    </div>
                  )}
                  <div className="flex w-full mobile:flex-wrap mobile:gap-[8px]">
                    <div className="flex flex-1">
                      <PicksSocialsComponent toolTip={true} />
                    </div>
                    <div>
                      {!dummy && (
                        <SelectCustomer
                          onChange={changeCustomer}
                          integrations={integrations}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 gap-[6px] flex-col">
                    <div>
                      {(!existingData.integration ||
                        (editingMany && groupScope === 'group')) && (
                        <SelectCurrent
                          errorIds={channelIssues.map((issue) => issue.id)}
                          channelIssueMessages={channelIssueMessages}
                        />
                      )}
                    </div>
                    <div className="flex-1 flex min-w-0">
                      {!hide && <EditorWrapper totalPosts={1} value="" />}
                    </div>
                    <div
                      id="social-empty"
                      className={clsx(
                        'pb-[16px]'
                        // current !== 'global' && 'hidden'
                      )}
                    />
                  </div>
                </div>
              </div>
              <div
                id="wrapper-settings"
                className={clsx(
                  'pb-[20px] px-[20px] mobile:pb-[12px] mobile:px-[12px] select-none',
                  showSettings && 'flex-1 flex pt-[20px]',
                  current === 'global' && 'hidden'
                )}
              >
                <div className="flex-1 flex flex-col rounded-[12px] gap-[12px] overflow-hidden bg-newSettings">
                  <div
                    onClick={() => setShowSettings(!showSettings)}
                    className={clsx(
                      'bg-[#FF5227] rounded-[12px] flex items-center gap-[8px] cursor-pointer p-[12px]',
                      showSettings ? '!rounded-b-none' : ''
                    )}
                  >
                    <div className="flex-1 text-[14px] font-[600] text-white">
                      {currentIntegrationText}
                    </div>
                    <div>
                      <ChevronDownIcon
                        rotated={showSettings}
                        className="text-white"
                      />
                    </div>
                  </div>
                  <div
                    className={clsx(
                      !showSettings ? 'hidden' : 'flex-1',
                      'text-[14px] text-textColor font-[500] relative'
                    )}
                  >
                    <div className="absolute left-0 top-0 w-full h-full flex flex-col overflow-x-hidden overflow-y-auto scrollbar scrollbar-thumb-newBgColorInner scrollbar-track-newColColor">
                      <div
                        id="social-settings"
                        className="flex flex-col gap-[20px] bg-newBgColor"
                      />
                    </div>
                  </div>
                  <style>
                    {`#social-settings [data-id="${current}"] {display: block !important;}`}
                  </style>
                </div>
              </div>
              {!!channelIssues.length && (
                <div className="mx-[20px] mobile:mx-[12px] mb-[12px] rounded-[12px] border border-statusFailed bg-statusFailedBg shrink-0">
                  <button
                    type="button"
                    className="w-full flex items-center gap-[8px] px-[14px] py-[10px] text-start"
                    onClick={() =>
                      setChannelIssuesExpanded((expanded) => !expanded)
                    }
                    aria-expanded={channelIssuesExpanded}
                  >
                    <div className="flex-1 text-[14px] font-[700] text-statusFailed">
                      {t(
                        'fix_before_scheduling_count',
                        'Fix {{count}} channel(s) before scheduling',
                        { count: channelIssues.length }
                      )}
                    </div>
                    <ChevronDownIcon
                      rotated={channelIssuesExpanded}
                      className="text-statusFailed shrink-0"
                    />
                  </button>
                  {channelIssuesExpanded && (
                    <div className="px-[14px] pb-[12px] flex flex-col gap-[10px] max-h-[140px] overflow-y-auto scrollbar scrollbar-thumb-newColColor scrollbar-track-transparent">
                      {channelIssues.map((issue) => (
                        <div key={issue.id} className="flex flex-col gap-[4px]">
                          <button
                            type="button"
                            className="text-start text-[13px] font-[600] text-statusFailed underline-offset-2 hover:underline"
                            onClick={() => {
                              setCurrent(issue.id);
                              setHide(true);
                              setShowSettings(issue.focus === 'form');
                              const handle = selectedIntegrations
                                .find((p) => p.integration.id === issue.id)
                                ?.ref?.current as
                                | Partial<Record<ChannelFocusTarget, () => void>>
                                | undefined;
                              handle?.[issue.focus]?.();
                            }}
                          >
                            {capitalize(issue.identifier.split('-')[0])} (
                            {issue.name})
                          </button>
                          <ul className="list-disc ps-[18px] text-[13px] text-statusFailed flex flex-col gap-[2px]">
                            {issue.messages.map((message) => (
                              <li
                                key={message}
                                className="whitespace-pre-wrap break-words"
                              >
                                {message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-[580px] flex flex-col mobile:hidden">
            <div className="bg-newBgColor h-[65px] rounded-e-[20px] !rounded-b-[0] flex items-center px-[20px] text-[20px] font-[600]">
              <div className="flex-1">{t('post_preview', 'Post Preview')}</div>
              <div className="cursor-pointer">
                <CloseIcon onClick={askClose} className="text-[#A3A3A3]" />
              </div>
            </div>
            <div className="flex-1 relative">
              <Scrollable
                scrollClasses="!pe-[20px]"
                className="absolute top-0 p-[20px] pe-[8px] left-0 w-full h-full overflow-x-hidden overflow-y-scroll scrollbar scrollbar-thumb-newColColor scrollbar-track-newBgColorInner"
              >
                <ShowAllProviders ref={ref} />
              </Scrollable>
            </div>
          </div>
        </div>
        <div className="select-none h-[84px] py-[20px] border-t border-newBorder flex items-center mobile:h-auto mobile:p-[12px] mobile:flex-col mobile:items-stretch mobile:gap-[10px]">
          <div className="flex-1 flex ps-[20px] gap-[8px] mobile:ps-0 mobile:flex-wrap">
            {!dummy && (
              <TagsComponent
                name="tags"
                label={t('tags', 'Tags')}
                initial={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                }}
              />
            )}

            {!dummy && (
              <RepeatComponent repeat={repeater} onChange={setRepeater} />
            )}

            {!dummy && (
              <LinkPostsButton
                value={links}
                onChange={setLinks}
                currentIds={(existingData?.posts || [])
                  .map((post: { id?: string }) => post.id)
                  .filter((id: string | undefined): id is string => !!id)}
              />
            )}
          </div>
          <div className="pe-[20px] flex items-center justify-end gap-[8px] mobile:pe-0 mobile:flex-wrap mobile:justify-start">
            {existingData?.integration && (
              <button
                onClick={deletePost}
                className="cursor-pointer flex text-[#FF3F3F] gap-[8px] items-center text-[15px] font-[600]"
              >
                <div>
                  <TrashIcon />
                </div>
                <div>{t('delete_post', 'Delete Post')}</div>
              </button>
            )}
            <DatePicker onChange={setDate} date={date} />
            {!addEditSets && (
              <button
                disabled={
                  selectedIntegrations.length === 0 || loading || locked
                }
                onClick={schedule('draft')}
                className="relative cursor-pointer disabled:cursor-not-allowed px-[20px] h-[44px] bg-btnSimple justify-center items-center flex rounded-[8px] text-[15px] font-[600] mobile:flex-1"
              >
                {loading && (
                  <div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%]">
                    <div className="animate-spin h-[20px] w-[20px] border-4 border-textColor border-t-transparent rounded-full" />
                  </div>
                )}
                <div className={clsx(loading && 'invisible')}>
                  {t('save_as_draft', 'Save as Draft')}
                </div>
              </button>
            )}
            {addEditSets && (
              <button
                className="text-white text-[15px] font-[600] min-w-[180px] btnSub disabled:cursor-not-allowed disabled:opacity-80 outline-none gap-[8px] flex justify-center items-center h-[44px] rounded-[8px] bg-[#FF5227] ps-[20px] pe-[16px]"
                disabled={
                  selectedIntegrations.length === 0 || loading || locked
                }
                onClick={schedule('draft')}
              >
                Save Set
              </button>
            )}
            {!addEditSets && (
              <div
                ref={postNowMenuRef}
                className="relative mobile:basis-full"
              >
                <div
                  className={clsx(
                    'text-white relative min-w-[180px] mobile:min-w-0 mobile:w-full btnSub outline-none flex justify-center items-center h-[44px] rounded-[8px] bg-[#FF5227] overflow-hidden',
                    (selectedIntegrations.length === 0 ||
                      loading ||
                      locked) &&
                      'opacity-80'
                  )}
                >
                  {loading && (
                    <div className="absolute left-[50%] top-[50%] -translate-y-[50%] -translate-x-[50%] z-[1]">
                      <div className="animate-spin h-[20px] w-[20px] border-4 border-white border-t-transparent rounded-full" />
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={
                      selectedIntegrations.length === 0 || loading || locked
                    }
                    onClick={schedule('schedule')}
                    className={clsx(
                      'flex-1 h-full ps-[20px] text-[15px] font-[600] outline-none disabled:cursor-not-allowed',
                      dummy ? 'pe-[20px]' : 'pe-[8px]',
                      loading && 'invisible'
                    )}
                  >
                    {selectedIntegrations.length === 0
                      ? t('check_circles_above', 'Check the circles above')
                      : dummy
                      ? t('create_output', 'Create output')
                      : !existingData?.integration
                      ? t('add_to_calendar', 'Add to calendar')
                      : existingData?.posts?.[0]?.state === 'DRAFT'
                      ? t('schedule', 'Schedule')
                      : t('update', 'Update')}
                  </button>
                  {!dummy && (
                    <button
                      type="button"
                      disabled={
                        selectedIntegrations.length === 0 || loading || locked
                      }
                      aria-expanded={postNowOpen}
                      aria-haspopup="menu"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPostNowOpen((open) => !open);
                      }}
                      className={clsx(
                        'arrow-change flex justify-center items-center h-full w-[36px] pe-[12px] border-s border-white/25 outline-none disabled:cursor-not-allowed',
                        loading && 'invisible'
                      )}
                    >
                      <DropdownArrowSmallIcon
                        className={clsx(
                          'text-white transition-transform',
                          postNowOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  )}
                </div>

                {!dummy && postNowOpen && (
                  <button
                    type="button"
                    onClick={schedule('now')}
                    disabled={
                      selectedIntegrations.length === 0 || loading || locked
                    }
                    className="rounded-[8px] z-[300] disabled:cursor-not-allowed disabled:opacity-80 flex absolute bottom-[100%] -left-[12px] -translate-y-[10px] menu-shadow p-[12px] w-[206px] bg-newBgColorInner"
                  >
                    <div className="text-white rounded-[8px] bg-[#E23E14] h-[44px] w-full flex justify-center items-center post-now">
                      {t('post_now', 'Post Now')}
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <CopilotPopup
        hitEscapeToClose={false}
        clickOutsideToClose={true}
        instructions={`
You are an assistant that help the user to schedule their social media posts,
Here are the things you can do:
- Add a new comment / post to the list of posts
- Delete a comment / post from the list of posts
- Add content to the comment / post
- Activate or deactivate the comment / post

Post content can be added using the addPostContentFor{num} function.
After using the addPostFor{num} it will create a new addPostContentFor{num+ 1} function.
`}
        labels={{
          title: t('your_assistant', 'Your Assistant'),
          initial: t(
            'assistant_initial_message',
            'Hi! I can help you to refine your social media posts.'
          ),
        }}
      />
    </div>
  );
};

const Scrollable: FC<{
  className: string;
  scrollClasses: string;
  children: ReactNode;
}> = ({ className, scrollClasses, children }) => {
  const ref = useRef(undefined);
  const hasScroll = useHasScroll(ref);
  return (
    <div className={clsx(className, hasScroll && scrollClasses)} ref={ref}>
      {children}
    </div>
  );
};
