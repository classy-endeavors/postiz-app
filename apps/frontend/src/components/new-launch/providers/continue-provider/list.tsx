'use client';

import { YoutubeContinue } from '@gitroom/frontend/components/new-launch/providers/continue-provider/youtube/youtube.continue';
import { LinkedinContinue } from '@gitroom/frontend/components/new-launch/providers/continue-provider/linkedin/linkedin.continue';
import { FacebookContinue } from '@gitroom/frontend/components/new-launch/providers/continue-provider/facebook/facebook.continue';

export const continueProviderList = {
  youtube: YoutubeContinue,
  'linkedin-page': LinkedinContinue,
  facebook: FacebookContinue,
};
