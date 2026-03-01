const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        slug: 'frrsc-llc',
        data: { vendor_page_url: 'N/A' }
    },
    {
        slug: 'sage-consulting-group',
        data: { vendor_page_url: 'https://sage.global/company/partnerships/' }
    },
    {
        slug: 'desert-view-inspection',
        data: { vendor_page_url: 'N/A' } // Ambiguous identity, general "Desert View Systems" has no clear portal
    },
    {
        slug: 'national-insurance-advocates',
        data: { vendor_page_url: 'https://nia.law/contact-us/' } // General contact form for vendors/partners
    },
    {
        slug: 'givemethevincom',
        data: { vendor_page_url: 'https://givemethevin.com/dealer-registration/' }
    },
    {
        slug: 'one-guard-inspections-automotive-inspector',
        data: { vendor_page_url: 'https://oneguardinspections.com/become-an-inspector/' }
    },
    {
        slug: 'shore-field-inspections',
        data: { vendor_page_url: 'N/A' } // Name conflict obscuring clear answer
    },
    {
        slug: 'armstrong-insurance-services',
        data: { vendor_page_url: 'https://armstrong-is.com/contact-us/' } // General contact
    },
    {
        slug: 'nic-solutions',
        data: { vendor_page_url: 'https://nicpartnersinc.com/partners/' } // Choosing the most likely candidate NIC Partners
    },
    {
        slug: 'thebest-claims-solutions',
        data: { vendor_page_url: 'https://thebestclaims.com/partner-with-us/' }
    }
];

async function updateFirms() {
    console.log('Updating fifth batch of firms contact info...\n');
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
