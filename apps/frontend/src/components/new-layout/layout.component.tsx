'use client';

import React, { ReactNode, useCallback, useEffect } from 'react';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';
const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  {
    ssr: false,
  }
);

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { CheckPayment } from '@gitroom/frontend/components/layout/check.payment';
import { ToolTip } from '@gitroom/frontend/components/layout/top.tip';
import { ShowMediaBoxModal } from '@gitroom/frontend/components/media/media.component';
import { ShowLinkedinCompany } from '@gitroom/frontend/components/launches/helpers/linkedin.component';
import { MediaSettingsLayout } from '@gitroom/frontend/components/launches/helpers/media.settings.component';
import { Toaster } from '@gitroom/react/toaster/toaster';
import { ShowPostSelector } from '@gitroom/frontend/components/post-url-selector/post.url.selector';
import { NewSubscription } from '@gitroom/frontend/components/layout/new.subscription';
import { Support } from '@gitroom/frontend/components/layout/support';
import { ContinueProvider } from '@gitroom/frontend/components/layout/continue.provider';
import { ContextWrapper } from '@gitroom/frontend/components/layout/user.context';
import { CopilotKit } from '@copilotkit/react-core';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Impersonate } from '@gitroom/frontend/components/layout/impersonate';
import { AnnouncementBanner } from '@gitroom/frontend/components/layout/announcement.banner';
import { Title } from '@gitroom/frontend/components/layout/title';
import { TopMenu } from '@gitroom/frontend/components/layout/top.menu';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import { OrganizationSelector } from '@gitroom/frontend/components/layout/organization.selector';
import { StreakComponent } from '@gitroom/frontend/components/layout/streak.component';
import { PreConditionComponent } from '@gitroom/frontend/components/layout/pre-condition.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import { TrialTracker } from '@gitroom/frontend/components/layout/gtm.component';
import { setSentryUser } from '@gitroom/react/sentry/initialize.sentry.client';
import { TopBarAddChannel } from '@gitroom/frontend/components/launches/add.provider.component';
import { ProfileMenu } from '@gitroom/frontend/components/layout/profile.menu';
import {
  PhoneDrawer,
  usePhoneDrawer,
} from '@gitroom/frontend/components/new-layout/phone-drawer';

export const LayoutComponent = ({ children }: { children: ReactNode }) => {
  const fetch = useFetch();

  const { backendUrl } = useVariables();
  const navDrawer = usePhoneDrawer();
  const navDrawerId = 'phone-primary-nav';

  // Feedback icon component attaches Sentry feedback to a top-bar icon when DSN is present
  const searchParams = useSearchParams();
  const load = useCallback(async (path: string) => {
    return await (await fetch(path)).json();
  }, []);
  const { data: user, mutate } = useSWR('/user/self', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
  });

  useEffect(() => {
    setSentryUser(
      user ? { id: user.id, email: user.email, orgId: user.orgId } : null
    );
  }, [user]);

  if (!user) return null;

  return (
    <ContextWrapper user={user}>
      <CopilotKit
        credentials="include"
        runtimeUrl={backendUrl + '/copilot/chat'}
        useSingleEndpoint={true}
        enableInspector={false}
      >
        <MantineWrapper>
          <ToolTip />
          <Toaster />
          <TrialTracker />
          <CheckPayment check={searchParams.get('check') || ''} mutate={mutate}>
            <ShowMediaBoxModal />
            <ShowLinkedinCompany />
            <MediaSettingsLayout />
            <ShowPostSelector />
            <PreConditionComponent />
            <NewSubscription />
            <ContinueProvider />
            <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden text-newTextColor p-[12px] phone:p-[8px]">
              <div>{user?.admin ? <Impersonate /> : <div />}</div>
              <>
                <AnnouncementBanner />
                <div className="flex-1 flex gap-[12px] min-w-0">
                  <Support />
                  <div className="phone:hidden flex flex-col bg-newBgColorInner w-[80px] rounded-[16px] border-[1.5px] border-newOutline shadow-hard">
                    <div
                      id="left-menu"
                      className={clsx(
                        'fixed h-full w-[64px] start-[17px] flex flex-1 top-0',
                        user?.admin && 'pt-[60px] max-h-[1000px]:w-[500px]'
                      )}
                    >
                      <div className="flex flex-col h-full gap-[32px] flex-1 py-[12px]">
                        <Logo />
                        <TopMenu />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 bg-newBgLineColor rounded-[16px] border-[1.5px] border-newOutline shadow-hard overflow-hidden flex flex-col gap-[1px] blurMe">
                    <div className="flex bg-newBgColorInner h-[80px] phone:h-[64px] px-[20px] phone:px-[12px] items-center gap-[12px] min-w-0">
                      <button
                        type="button"
                        className="phone:inline-flex hidden shrink-0 w-[36px] h-[36px] items-center justify-center rounded-[8px] border-[1.5px] border-newOutline bg-newBgColorInner text-newTextColor outline-none"
                        aria-label="Open navigation menu"
                        aria-expanded={navDrawer.open}
                        aria-controls={navDrawerId}
                        onClick={navDrawer.toggle}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                        >
                          <path
                            d="M2.25 4.5H15.75M2.25 9H15.75M2.25 13.5H15.75"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <div className="text-[24px] phone:text-[20px] font-heading font-[800] tracking-[-0.01em] flex flex-1 min-w-0">
                        <div className="truncate w-full">
                          <Title />
                        </div>
                      </div>
                      <div className="flex gap-[20px] phone:gap-[10px] items-center text-textItemBlur shrink-0">
                        <TopBarAddChannel />
                        <div className="phone:hidden flex gap-[20px] items-center">
                          <StreakComponent />
                          <div className="w-[1px] h-[20px] bg-blockSeparator" />
                          <OrganizationSelector />
                          <div className="hover:text-newTextColor">
                            <ModeComponent />
                          </div>
                          <div className="w-[1px] h-[20px] bg-blockSeparator" />
                          <LanguageComponent />
                          <div className="w-[1px] h-[20px] bg-blockSeparator" />
                          <AttachToFeedbackIcon />
                        </div>
                        <NotificationComponent />
                        <div className="phone:hidden w-[1px] h-[20px] bg-blockSeparator" />
                        <ProfileMenu />
                      </div>
                    </div>
                    <div className="flex flex-1 gap-[1px] min-w-0 overflow-x-hidden">
                      {children}
                    </div>
                  </div>
                </div>
                <PhoneDrawer
                  open={navDrawer.open}
                  onClose={navDrawer.close}
                  title="Menu"
                  id={navDrawerId}
                  hideHeader
                  className="!w-[96px]"
                >
                  <div className="flex flex-col h-full gap-[20px] py-[12px] px-[12px]">
                    <div className="flex flex-col items-center gap-[8px]">
                      <Logo />
                      <button
                        type="button"
                        onClick={navDrawer.close}
                        aria-label="Close"
                        className="w-[28px] h-[28px] rounded-[8px] bg-btnSimple text-btnText flex items-center justify-center outline-none"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M11 3L3 11M3 3L11 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <TopMenu />
                  </div>
                </PhoneDrawer>
              </>
            </div>
          </CheckPayment>
        </MantineWrapper>
      </CopilotKit>
    </ContextWrapper>
  );
};
