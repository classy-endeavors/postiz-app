import { ContentLinksPage } from '@gitroom/frontend/components/replies/content.links.page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Zyntra Content links',
  description: '',
};

export default async function Page() {
  return <ContentLinksPage />;
}
