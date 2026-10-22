import { YoutubeSettingsDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/youtube.settings.dto';
import { TikTokDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/tiktok.dto';
import { InstagramDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/instagram.dto';
import { LinkedinDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/linkedin.dto';
import { FacebookDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/facebook.dto';
import { IsIn } from 'class-validator';

export type ProviderExtension<T extends string, M> = { __type: T } & M;
export type AllProvidersSettings =
  | ProviderExtension<'youtube', YoutubeSettingsDto>
  | ProviderExtension<'tiktok', TikTokDto>
  | ProviderExtension<'instagram-standalone', InstagramDto>
  | ProviderExtension<'linkedin', LinkedinDto>
  | ProviderExtension<'linkedin-page', LinkedinDto>
  | ProviderExtension<'facebook', FacebookDto>;

export const allProviders = (setEmpty?: any) => {
  return [
    { value: YoutubeSettingsDto, name: 'youtube' },
    { value: TikTokDto, name: 'tiktok' },
    { value: InstagramDto, name: 'instagram-standalone' },
    { value: LinkedinDto, name: 'linkedin' },
    { value: LinkedinDto, name: 'linkedin-page' },
    { value: FacebookDto, name: 'facebook' },
  ].filter((f) => f.value);
};

export class EmptySettings {
  @IsIn(allProviders(EmptySettings).map((p) => p.name), {
    message: `"__type" must be ${allProviders(EmptySettings)
      .map((p) => p.name)
      .join(', ')}`,
  })
  __type: string;
}
