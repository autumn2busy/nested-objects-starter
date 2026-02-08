import Script from 'next/script'

type Props = {
    facebookPixelId?: string
    linkedinPartnerId?: string
    googleAdsId?: string
    googleAnalyticsId?: string
}

export const Analytics = ({
    facebookPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
    linkedinPartnerId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
    googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
    googleAnalyticsId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
}: Props) => {
    return (
        <>
            {/* Facebook Pixel */}
            {facebookPixelId && (
                <Script
                    id="fb-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${facebookPixelId}');
              fbq('track', 'PageView');
            `,
                    }}
                />
            )}

            {/* LinkedIn Insight Tag */}
            {linkedinPartnerId && (
                <Script
                    id="linkedin-insight"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
              _linkedin_partner_id = "${linkedinPartnerId}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
              (function(l) {
              if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);})(window.lintrk);
            `,
                    }}
                />
            )}

            {/* Google Analytics 4 (GA4) */}
            {googleAnalyticsId && (
                <>
                    <Script
                        strategy="afterInteractive"
                        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
                    />
                    <Script
                        id="google-analytics"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `,
                        }}
                    />
                </>
            )}

            {/* Google Ads (GT) */}
            {/* Only load if distinct from GA4, or if both are needed (gtag handles multiple configs) */}
            {googleAdsId && googleAdsId !== googleAnalyticsId && (
                <>
                    <Script
                        strategy="afterInteractive"
                        src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
                    />
                    <Script
                        id="google-ads"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAdsId}');
              `,
                        }}
                    />
                </>
            )}
        </>
    )
}
