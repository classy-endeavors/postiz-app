'use client';

import { FC, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import { CustomVariables } from '@gitroom/frontend/components/launches/add.provider.component';

export const ChannelsSettings: FC = () => {
  const fetch = useFetch();
  const t = useT();
  const router = useRouter();
  const modal = useModals();
  const { data: integrations, isLoading } = useIntegrationList();

  const reconnect = useCallback(
    (integration: any) => async () => {
      if (integration.inBetweenSteps) {
        router.push(
          `/launches?added=${integration.identifier}&continue=${integration.id}`
        );
        return;
      }

      // Custom-fields providers have no OAuth URL, reconnecting means
      // re-entering the credentials
      if (integration.isCustomFields) {
        modal.openModal({
          title: t('custom_url', 'Custom URL'),
          withCloseButton: false,
          classNames: {
            modal: 'md',
          },
          children: (
            <CustomVariables
              identifier={integration.identifier}
              gotoUrl={(url: string) => router.push(url)}
              variables={integration.customFields || []}
            />
          ),
        });
        return;
      }

      const { url } = await (
        await fetch(
          `/integrations/social/${integration.identifier}?refresh=${integration.internalId}`,
          {
            method: 'GET',
          }
        )
      ).json();
      window.location.href = url;
    },
    []
  );

  return (
    <div className="flex flex-col">
      <h3 className="text-[20px]">{t('channels', 'Channels')}</h3>
      <div className="text-textItemBlur mt-[4px]">
        {t(
          'channels_settings_description',
          'Reconnect a channel to refresh its permissions, or when posting and analytics stop working.'
        )}
      </div>
      <div className="my-[16px] bg-newBgColorInner border-newTableBorder border rounded-[12px] p-[20px] flex flex-col gap-[12px]">
        {!isLoading && !integrations?.length && (
          <div className="text-textItemBlur">
            {t(
              'no_channels_connected',
              'No channels connected yet. Add one from the calendar.'
            )}
          </div>
        )}
        {(integrations || []).map((integration: any) => (
          <div
            key={integration.id}
            className="flex items-center gap-[12px] p-[12px] border border-newTableBorder rounded-[10px]"
          >
            <div className="relative shrink-0">
              <img
                src={integration.picture}
                alt={integration.name}
                className="w-[40px] h-[40px] rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/no-picture.jpg';
                }}
              />
              <img
                src={`/icons/platforms/${integration.identifier}.png`}
                alt={integration.identifier}
                className="w-[18px] h-[18px] rounded-[4px] absolute -bottom-[2px] -end-[2px] border border-newBgColorInner"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-[600] truncate">
                {integration.name}
              </div>
              <div className="text-[12px] text-textItemBlur capitalize">
                {integration.identifier.split('-')[0]}
                {integration.display ? ` · ${integration.display}` : ''}
              </div>
            </div>
            <div
              className={clsx(
                'text-[12px] font-[600] px-[10px] py-[4px] rounded-full',
                integration.refreshNeeded || integration.inBetweenSteps
                  ? 'bg-statusFailedBg text-statusFailed'
                  : integration.disabled
                  ? 'bg-boxHover text-statusDraft'
                  : 'bg-statusPublishedBg text-statusPublished'
              )}
            >
              {integration.inBetweenSteps
                ? t('channel_status_setup', 'Finish setup')
                : integration.refreshNeeded
                ? t('channel_status_needs_reconnect', 'Needs reconnect')
                : integration.disabled
                ? t('channel_status_disabled', 'Disabled')
                : t('channel_status_connected', 'Connected')}
            </div>
            <Button
              className="rounded-[8px] !h-[36px] text-[13px]"
              secondary={!integration.refreshNeeded && !integration.inBetweenSteps}
              onClick={reconnect(integration)}
            >
              {integration.inBetweenSteps
                ? t('continue_setup', 'Continue')
                : t('reconnect', 'Reconnect')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
