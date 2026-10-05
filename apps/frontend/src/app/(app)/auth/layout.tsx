import { getT } from '@gitroom/react/translation/get.translation.service.backend';

export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Toaster } from '@gitroom/react/toaster/toaster';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getT();

  const features = [
    t(
      'auth_feature_calendar',
      'One calendar for TikTok, YouTube and Instagram'
    ),
    t('auth_feature_ai', 'AI that drafts posts in your voice'),
    t('auth_feature_analytics', 'Analytics for every connected channel'),
  ];

  return (
    <MantineWrapper>
      <Toaster />
      <div className="bg-newBgColor flex h-screen w-screen p-[12px] gap-[12px] text-newTextColor">
        <ReturnUrlComponent />
        <div className="flex flex-col flex-1 lg:w-[520px] lg:flex-none rounded-[22px] bg-newBgColorInner border-[1.5px] border-newOutline shadow-hard overflow-y-auto [&_h1]:font-heading [&_h1]:font-[800]">
          <div className="px-[32px] pt-[24px]">
            <LogoTextComponent />
          </div>
          <div className="flex flex-1 items-center px-[32px] py-[24px]">
            <div className="w-full max-w-[400px] mx-auto flex">{children}</div>
          </div>
        </div>
        <div className="flex-1 hidden lg:flex flex-col justify-center rounded-[22px] bg-btnPrimary border-[1.5px] border-newOutline shadow-hard px-[56px] text-white overflow-hidden relative">
          <div className="absolute -end-[120px] -top-[120px] w-[360px] h-[360px] rounded-full bg-white/10" />
          <div className="absolute -start-[80px] -bottom-[140px] w-[300px] h-[300px] rounded-full bg-white/10" />
          <div className="relative max-w-[560px] flex flex-col gap-[24px]">
            <div className="text-[44px] font-heading font-[800] tracking-[-0.02em] leading-[1.1]">
              {t('auth_headline', 'Your content runs itself now.')}
            </div>
            <div className="text-[18px] text-white/85">
              {t(
                'auth_subheadline',
                'Plan, schedule and publish from one place, with AI that writes in your voice.'
              )}
            </div>
            <div className="flex flex-col gap-[12px] mt-[8px]">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-[12px] text-[16px] font-[600]"
                >
                  <div className="w-[28px] h-[28px] rounded-full bg-white text-btnPrimary flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MantineWrapper>
  );
}
