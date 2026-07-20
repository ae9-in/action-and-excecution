import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { CustomCursor } from '@/components/CustomCursor';
import { SmoothScroll } from '@/components/SmoothScroll';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const displayFont = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Business Vault — Every business, one command center',
  description: 'Business Vault is your internal operations knowledge platform. SOPs, leads, pricing, org charts, competitor intel — all in one role-gated, fully audit-logged vault.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${displayFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0A0A0B] text-white font-sans">
        <SessionProvider>
          <SmoothScroll>
            <CustomCursor />
            {children}
          </SmoothScroll>
        </SessionProvider>
      </body>
    </html>
  );
}
