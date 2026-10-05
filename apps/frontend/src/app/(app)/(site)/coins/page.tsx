import { CoinsComponent } from '@gitroom/frontend/components/coins/coins.component';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `AI Zyntra Coins`,
  description: '',
};

export default async function Page() {
  return <CoinsComponent />;
}
