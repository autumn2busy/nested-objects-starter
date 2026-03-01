const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        slug: 'rtr-services-inc',
        data: { vendor_page_url: 'https://www.rtrservices.com/contact-us' } // Freight vendor form mentioned here
    },
    {
        slug: 'vision-realty-management',
        data: { vendor_page_url: 'https://visionwestgeorgia.com/vendor-portal/' }
    },
    {
        slug: 'premier-claims',
        data: { vendor_page_url: 'https://premier-claims.com/contractor-program/' }
    },
    {
        slug: 'coleman-consulting-group-llc',
        data: { vendor_page_url: 'N/A' } // Government subcontractor, no specific public vendor page
    },
    {
        slug: 'atlantic-pacific-build-group',
        data: { vendor_page_url: 'https://atlanticpacificbuildgroup.com/careers' }
    },
    {
        slug: 'sport-management-group-inc',
        data: { vendor_page_url: 'N/A' } // Information unclear from name conflict
    },
    {
        slug: 'package-research-laboratory-llc',
        data: { vendor_page_url: 'https://www.package-testing.com/prl-customer-center' }
    },
    {
        slug: 'overland-surveys',
        data: { vendor_page_url: 'N/A' } // No vendor page online
    },
    {
        slug: 'metropolitan-solutions',
        data: { vendor_page_url: 'N/A' } // Name conflict obscures definitive answer
    },
    {
        slug: 'seek-now',
        data: { vendor_page_url: 'https://seeknow.com/become-a-seeker/' }
    }
];

async function updateFirms() {
    console.log('Updating fourth batch of firms contact info...\n');
    for (const update of updates) {
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
