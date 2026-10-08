'use client';

import React, { FC, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { Button } from '@gitroom/react/form/button';
import { showMediaBox } from '@gitroom/frontend/components/media/media.component';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { ProfileAvatar } from '@gitroom/frontend/components/layout/profile.menu';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const ProfileSettings: FC = () => {
  const t = useT();
  const user = useUser();
  const form = useFormContext();
  const picture = form.watch('picture');
  const fullname = form.watch('fullname');

  const openMedia = useCallback(() => {
    showMediaBox((value) => {
      form.setValue('picture', value, { shouldDirty: true });
    });
  }, [form]);

  const removePicture = useCallback(() => {
    form.setValue('picture', null, { shouldDirty: true });
  }, [form]);

  return (
    <div className="flex flex-col gap-[24px] max-w-[560px]">
      <div className="flex flex-col gap-[4px]">
        <h3 className="text-[20px]">{t('profile', 'Profile')}</h3>
        <div className="text-[14px] text-textItemBlur">
          {t(
            'profile_description',
            'Your name and picture are shown to your team.'
          )}
        </div>
      </div>
      <div className="flex items-center gap-[16px]">
        <ProfileAvatar
          name={fullname}
          email={user?.email}
          picture={picture?.path}
          size={72}
        />
        <div className="flex gap-[8px]">
          <Button type="button" onClick={openMedia}>
            {picture
              ? t('change_picture', 'Change picture')
              : t('upload_picture', 'Upload picture')}
          </Button>
          {!!picture && (
            <Button type="button" secondary={true} onClick={removePicture}>
              {t('remove', 'Remove')}
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <Input
          label={t('full_name', 'Full name')}
          name="fullname"
          placeholder={t('your_name', 'Your name')}
        />
        <Input
          label={t('email', 'Email')}
          name="email"
          disableForm={true}
          disabled={true}
          value={user?.email || ''}
          className="opacity-60"
        />
        <Textarea
          label={t('bio', 'Bio')}
          name="bio"
          placeholder={t('bio_placeholder', 'A few words about you')}
        />
      </div>
      <div>
        <Button type="submit" loading={form.formState.isSubmitting}>
          {t('save_profile', 'Save profile')}
        </Button>
      </div>
    </div>
  );
};
