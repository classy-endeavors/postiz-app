import { CommentsPage } from '@gitroom/frontend/components/replies/comments.page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Zyntra Comments',
  description: '',
};

export default async function Page() {
  return <CommentsPage />;
}
