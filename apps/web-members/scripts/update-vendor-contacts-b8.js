const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        slug: 'equicheckllc',
        data: { vendor_page_url: 'N/A' }, // Retry failed query, but probably don't have it.
        skipped: true
    },
    {
        slug: 'sgs',
        data: { vendor_page_url: 'https://www.suppliergateway.com/' } // Directing vendors to their gateway portal
    },
    {
        slug: 'pinnacle-mystery-shopper',
        data: { vendor_page_url: 'https://www.pinnaclemysteryshopper.com/registration' } // Known mystery shopping portals
    },
    {
        slug: 'evaluationsolutions',
        data: { vendor_page_url: 'N/A' } // Name conflict blocking answer
    },
    {
        slug: 'proproperty-inspection-services',
        data: { vendor_page_url: 'N/A' } // General contact only
    },
    {
        slug: 'majestic-service-company',
        data: { vendor_page_url: 'https://majesticservicecompany.com/career-form' } // Used for both employment and contractor vendor network
    }
];

async function updateFirms() {
    console.log('Updating eighth batch of firms contact info...\n');
    for (const update of updates) {
        if (update.skipped) {
            console.log(`[-] Skipped ${update.slug}`);
            continue;
        }

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
