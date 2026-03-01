const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        slug: 'sure-guard-property-inspections',
        data: { vendor_page_url: 'N/A' } // General contact form found, not specific to vendors
    },
    {
        slug: 'field-services-inc',
        data: { vendor_page_url: 'N/A' } // Unclear specific company given generic name
    },
    {
        slug: 'mcdargh-real-estate-services-inc',
        data: { vendor_page_url: 'https://mcdarghconsulting.com/subcontractor-questionnaire/' }
    },
    {
        slug: 'mti-inspection-services',
        data: { vendor_page_url: 'N/A' } // Government vendor, no clear portal for submitting vendor applications
    },
    {
        slug: 'wetherill-engineering',
        data: { vendor_page_url: 'N/A' } // Specific instructions not found for vendors
    },
    {
        slug: 'canadian-mortgage-loan-services-limited',
        data: { vendor_page_url: 'https://www.cmls.ca/brokers/become-an-affiliate' }
    },
    {
        slug: 'equicheckllc',
        data: { vendor_page_url: 'N/A' }, // Search failed, let's skip for now
        skipped: true
    },
    {
        slug: 'computer-evidence-specialistsllc',
        data: { vendor_page_url: 'N/A' } // Government subcontractor, no direct portal
    },
    {
        slug: 'tpg-alliance-llc',
        data: { vendor_page_url: 'https://www.tpg-alliance.com/vendors' }
    },
    {
        slug: 'osp-inspectors-inc',
        data: { vendor_page_url: 'N/A' } // No vendor sign-up info found
    }
];

async function updateFirms() {
    console.log('Updating sixth batch of firms contact info...\n');
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
