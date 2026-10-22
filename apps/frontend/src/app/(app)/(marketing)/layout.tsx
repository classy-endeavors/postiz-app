import { ReactNode } from 'react';
import { MarketingNav } from '@gitroom/frontend/components/marketing/marketing-nav';
import { MarketingFooter } from '@gitroom/frontend/components/marketing/marketing-footer';
import '@gitroom/frontend/components/marketing/marketing.css';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mkt light">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
