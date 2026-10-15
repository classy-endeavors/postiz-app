import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
  PlatformRow,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Social Publishing',
  description:
    'Compose once and publish to YouTube, TikTok, Instagram, LinkedIn, and Facebook Pages with platform-specific settings.',
  path: '/publishing',
});

export default function PublishingPage() {
  return (
    <>
      <PageHero
        sticker="Publishing"
        stickerVariant="peach"
        title="Publish to every connected channel from one composer."
        subtitle="Write the post, attach media, tune platform settings, then schedule or send now."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards([
            {
              title: 'One launch flow',
              body: 'Create a post once and select which connected channels should receive it.',
            },
            {
              title: 'Platform settings',
              body: 'Use provider options like YouTube tags, TikTok privacy, and page targets.',
            },
            {
              title: 'Schedule or post now',
              body: 'Send immediately or queue for the calendar — Temporal handles the publish job.',
            },
            {
              title: 'Drafts and previews',
              body: 'Save work in progress and preview how posts will look before they go live.',
            },
            {
              title: 'Media attachments',
              body: 'Pull images and video from your library or upload new creative in the flow.',
            },
            {
              title: 'Reliable delivery',
              body: 'Background workflows publish at the scheduled time across your channels.',
            },
          ])}
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap mkt-center">
          <h2 className="mkt-h2">Channels you can publish to</h2>
          <p className="mkt-sub" style={{ marginBottom: 28 }}>
            Only platforms registered in Zyntra today.
          </p>
          <PlatformRow />
        </div>
      </section>

      <div className="mkt-wrap" style={{ marginBottom: 40 }}>
        <div className="mkt-preview">
          <img
            src="/marketing/images/calendar.png"
            alt="Scheduled posts across channels on the calendar"
            width={980}
            height={560}
          />
        </div>
      </div>

      <CtaBand title="Publish your next post with Zyntra" />
    </>
  );
}
