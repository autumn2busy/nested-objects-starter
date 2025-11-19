import Script from 'next/script'
import { 
  structuredData, 
  organizationStructuredData, 
  offerCatalogStructuredData 
} from './metadata'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Your existing Outseta script */}
        <Script
          src={`${process.env.NEXT_PUBLIC_OUTSETA_URL}/widget.js`}
          strategy="beforeInteractive"
          data-options="o_options"
        />

        {/* NEW: Structured Data for SEO */}
        <Script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script
          id="structured-data-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <Script
          id="structured-data-offers"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogStructuredData) }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
