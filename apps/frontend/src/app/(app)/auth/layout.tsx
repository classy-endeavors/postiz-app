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

  return (
    <MantineWrapper>
      <Toaster />
      <div className="bg-newBgColor flex flex-1 p-[12px] gap-[12px] min-h-screen w-screen text-newTextColor">
        {/*<style>{`html, body {overflow-x: hidden;}`}</style>*/}
        <ReturnUrlComponent />
        <div className="flex flex-col py-[40px] px-[20px] flex-1 lg:w-[600px] lg:flex-none rounded-[22px] p-[12px] bg-newBgColorInner border-[1.5px] border-newOutline shadow-hard [&_h1]:font-heading [&_h1]:font-[800]">
          <div className="w-full max-w-[440px] mx-auto justify-center gap-[20px] h-full flex flex-col">
            <LogoTextComponent />
            <div className="flex">{children}</div>
          </div>
        </div>
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center px-[40px]">
          <div className="text-center text-[44px] font-heading font-[800] tracking-[-0.02em] leading-[1.15] max-w-[640px]">
            Your <span className="text-btnPrimary">content</span> runs itself
            now.
          </div>
          <div className="text-center text-[18px] text-textItemBlur mt-[20px] max-w-[520px]">
            Plan, schedule and publish to TikTok and YouTube from one calendar,
            with AI that writes in your voice.
          </div>
        </div>
      </div>
    </MantineWrapper>
  );
}
