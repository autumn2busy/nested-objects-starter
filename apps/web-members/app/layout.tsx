// In /apps/web-members/app/layout.tsx

import type { Metadata } from 'next';
import Script from 'next/script';
// 1. Import the provider from its correct location in your 'lib' folder
import { OutsetaProvider } from '../lib/outseta-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nested Objects Member Hub',
  description: 'Where Side Hustles Become Businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* All your existing <Script> tags remain unchanged */}
        <Script
          id="outseta-options"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var o_options = {
                domain: 'nested-objects.outseta.com',
                load: 'auth,customForm,emailList,leadCapture,nocode,profile,support'
              };
            `,
          }}
        />
        <Script
          id="outseta-script"
          strategy="beforeInteractive"
          src="https://cdn.outseta.com/outseta.min.js"
          data-options="o_options"
        />
      </head>
      <body>
        {/* 2. Wrap your {children} with the provider */}
        <OutsetaProvider>{children}</OutsetaProvider>
      </body>
    </html>
  );
}
