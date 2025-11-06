// In /apps/web-members/app/layout.tsx

import type { Metadata } from 'next';
import Script from 'next/script'; // Import the Next.js Script component
import './globals.css'; // Assuming you have a global CSS file

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
        {/* The first script (o_options) must be inline and run before 
          the main Outseta script. We use 'dangerouslySetInnerHTML' 
          to achieve this, as recommended by Next.js for inline scripts.
        */}
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

        {/* The main Outseta script. 
          'strategy="beforeInteractive"' ensures it loads before the page 
          becomes interactive, which is crucial for auth.
        */}
        <Script
          id="outseta-script"
          strategy="beforeInteractive"
          src="https://cdn.outseta.com/outseta.min.js"
          data-options="o_options"
        />
      </head>
      <body>
        {/* Your children prop will be your page content (e.g., page.tsx) */}
        {children}
      </body>
    </html>
  );
}
