import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { CustomCursor } from '@/components/CustomCursor';
import { SmoothScroll } from '@/components/SmoothScroll';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const displayFont = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Business Vault — Every business, one command center',
  description:
    'Business Vault is your internal operations knowledge platform. SOPs, leads, pricing, org charts, competitor intel — all in one role-gated, fully audit-logged vault.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${displayFont.variable} font-sans antialiased text-white bg-[#0A0A0B]`}>
      <SmoothScroll>
        <CustomCursor />
        {children}
      </SmoothScroll>
    </div>
  );
}
