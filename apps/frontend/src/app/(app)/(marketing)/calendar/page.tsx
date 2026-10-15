import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import { HeroCalendarMock } from '@gitroom/frontend/components/marketing/hero-calendar-mock';
import {
  CtaBand,
  PageHero,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Content Calendar',
  description:
    'Plan drafts and scheduled posts with Zyntra day, week, month, and list calendar views.',
  path: '/calendar',
});

export default function CalendarPage() {
  return (
    <>
      <PageHero
        sticker="Calendar"
        stickerVariant="lime"
        title="See your whole content week at a glance."
        subtitle="The Zyntra calendar is the home for drafts, scheduled posts, and published history."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards([
            {
              title: 'Multiple views',
              body: 'Switch between day, week, month, and list layouts for the same queue.',
            },
            {
              title: 'Status filters',
              body: 'Focus on drafts, scheduled items, or published posts when you need clarity.',
            },
            {
              title: 'Drag your plan',
              body: 'Move work across the calendar as priorities shift through the week.',
            },
            {
              title: 'Launch from the grid',
              body: 'Open the composer directly from the calendar to create or edit posts.',
            },
            {
              title: 'Comments on posts',
              body: 'Leave notes on calendar items so teammates stay aligned.',
            },
            {
              title: 'On-time publishing',
              body: 'Scheduled posts run through the background workflow at the set time.',
            },
          ])}
        </div>
      </section>

      <div className="mkt-wrap" style={{ marginBottom: 40 }}>
        <HeroCalendarMock />
      </div>

      <CtaBand title="Build your calendar in minutes" />
    </>
  );
}
