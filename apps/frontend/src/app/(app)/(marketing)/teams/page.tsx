import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Team Collaboration',
  description:
    'Invite teammates, assign ADMIN or USER roles, and manage organizations in Zyntra on TEAM plans and above.',
  path: '/teams',
});

export default function TeamsPage() {
  return (
    <>
      <PageHero
        sticker="Teams"
        stickerVariant="lime"
        title="Collaborate without losing the calendar."
        subtitle="Share a workspace, invite members, and keep publishing decisions in one place."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards([
            {
              title: 'Team invites',
              body: 'Add teammates from Settings when your plan includes team members.',
            },
            {
              title: 'Roles that matter',
              body: 'Assign ADMIN or USER roles so access matches how your group works.',
            },
            {
              title: 'Organizations',
              body: 'Switch between organizations when you manage more than one workspace.',
            },
            {
              title: 'Shared calendar',
              body: 'Plan and review posts together instead of scattering files and chats.',
            },
            {
              title: 'Post comments',
              body: 'Leave notes on calendar items so feedback stays next to the work.',
            },
            {
              title: 'Available on TEAM+',
              body: 'Team features unlock on TEAM, PRO, and ULTIMATE subscription tiers.',
            },
          ])}
        </div>
      </section>

      <div className="mkt-wrap" style={{ marginBottom: 40 }}>
        <div className="mkt-preview">
          <img
            src="/marketing/images/calendar.png"
            alt="Shared team calendar for scheduled social posts"
            width={980}
            height={560}
          />
        </div>
      </div>

      <CtaBand title="Bring your team onto one calendar" />
    </>
  );
}
