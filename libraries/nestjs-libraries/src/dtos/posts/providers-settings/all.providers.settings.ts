import { YoutubeSettingsDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/youtube.settings.dto';
import { TikTokDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/tiktok.dto';
import { InstagramDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/instagram.dto';
import { IsIn } from 'class-validator';

export type ProviderExtension<T extends string, M> = { __type: T } & M;
export type AllProvidersSettings =
  | ProviderExtension<'youtube', YoutubeSettingsDto>
  | ProviderExtension<'tiktok', TikTokDto>
  | ProviderExtension<'instagram-standalone', InstagramDto>;

export const allProviders = (setEmpty?: any) => {
  return [
    { value: YoutubeSettingsDto, name: 'youtube' },
    { value: TikTokDto, name: 'tiktok' },
    { value: InstagramDto, name: 'instagram-standalone' },
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
