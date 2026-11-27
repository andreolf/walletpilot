import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata: Metadata = {
  title: {
    default: 'WalletPilot Docs',
    template: '%s – WalletPilot Docs',
  },
  description: 'Documentation for WalletPilot SDK',
  openGraph: {
    title: 'WalletPilot Docs',
    description: 'Documentation for WalletPilot SDK',
  },
};

const navbar = (
  <Navbar
    logo={
      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
        🚀 WalletPilot
      </span>
    }
    projectLink="https://github.com/andreolf/walletpilot"
  />
);

const footer = <Footer>© 2026 WalletPilot</Footer>;

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head color={{ hue: 24, saturation: 100 }} />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/andreolf/walletpilot/tree/main/apps/docs"
          sidebar={{ defaultMenuCollapseLevel: 1, toggleButton: true }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
