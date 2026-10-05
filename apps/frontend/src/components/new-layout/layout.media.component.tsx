'use client';

import { useCallback } from 'react';
import dayjs from 'dayjs';
import { Media } from '@prisma/client';
import { MediaBox } from '@gitroom/frontend/components/media/media.component';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import { AddEditModal } from '@gitroom/frontend/components/new-launch/add.edit.modal';

export const MediaLayoutComponent = () => {
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const { data: integrations } = useIntegrationList();

  const createPost = useCallback(
    async (media: Media) => {
      if (!integrations.length) {
        toaster.show(
          t(
            'connect_channel_before_post',
            'Connect a channel in the Calendar before creating a post'
          ),
          'warning'
        );
        return;
      }

      const date = (await (await fetch('/posts/find-slot')).json()).date;

      modal.openModal({
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
          <AddEditModal
            allIntegrations={integrations.map((p: any) => ({
              ...p,
            }))}
            integrations={integrations}
            reopenModal={() => ({})}
            mutate={() => ({})}
            date={dayjs.utc(date).local()}
            onlyValues={[
              {
                content: '',
                image: [{ id: media.id, path: media.path }],
              },
            ]}
          />
        ),
        size: '80%',
        title: ``,
      });
    },
    [integrations]
  );

  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[15px] transition-all">
      <MediaBox
        setMedia={() => {}}
        closeModal={() => {}}
        standalone={true}
        onCreatePost={createPost}
      />
    </div>
  );
};
