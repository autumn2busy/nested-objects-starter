const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        slug: 'wc-field-service', // from initial batch 3
        data: { vendor_page_url: 'N/A' } // Already searched, no clear vendor site
    },
    {
        slug: 'national-creditors-connection-inc',
        data: { vendor_page_url: 'N/A' }
    },
    {
        slug: 'top-tier-public-adjusters',
        data: { vendor_page_url: 'N/A' }
    },
    {
        slug: 'amerispec-chicago-xperience-home-inspections',
        data: { vendor_page_url: 'N/A' }
    },
    {
        slug: 'east-coast-property-servicesllc',
        data: { vendor_page_url: 'N/A' }
    },
    {
        slug: 'sure-point-inspections', // batch 3b
        data: { vendor_page_url: 'N/A' } // No specific vendor page found
    },
    {
        slug: 'sdmyers',
        data: { vendor_page_url: 'https://sdmyers.com/contact-us/' } // General contact form
    },
    {
        slug: 'shiner-exteriors',
        data: { vendor_page_url: 'https://shinerexteriors.com/contact-us/' } // Requires direct contact
    },
    {
        slug: 'ka-engineering',
        data: { vendor_page_url: 'https://kapower.us/contact-us/' },
        phone: '+1 914 607 7115',
        email: 'sales@kapower.us'
    },
    {
        slug: 'integrated-asset-servicesinc-now-sperry',
        data: { vendor_page_url: 'https://www.sperrycga.com/careers/' }, // Sperry Commercial Global Affiliates
        email: 'Connor.Dean@sperrycga.com'
    }
];

// Re-incorporating email/phone fallback properties since they might be at the root object above
const mappedUpdates = updates.map(u => ({
    slug: u.slug,
    data: {
        vendor_page_url: u.data.vendor_page_url,
        ...(u.phone ? { phone: u.phone } : {}),
        ...(u.email ? { email: u.email } : {})
    }
}));


async function updateFirms() {
    console.log('Updating third batch of firms contact info...\n');
    for (const update of mappedUpdates) {
        const { error } = await supabase
            .from('firms')
            .update(update.data)
            .eq('slug', update.slug);

        if (error) {
            console.error(`[X] Error updating ${update.slug}:`, error.message);
        } else {
            console.log(`[✓] Updated ${update.slug}`);
        }
    }
    console.log('\nDone applying updates.');
}

updateFirms();
