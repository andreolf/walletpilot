import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: (
    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
      🚀 WalletPilot
    </span>
  ),
  project: {
    link: 'https://github.com/andreolf/walletpilot',
  },
  docsRepositoryBase: 'https://github.com/andreolf/walletpilot/tree/main/apps/docs',
  footer: {
    text: '© 2026 WalletPilot',
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="WalletPilot Docs" />
      <meta property="og:description" content="Documentation for WalletPilot SDK" />
    </>
  ),
  primaryHue: 24,
  primarySaturation: 100,
  useNextSeoProps() {
    return {
      titleTemplate: '%s – WalletPilot Docs',
    };
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
};

export default config;
