const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        slug: 'national-creditors-connection-inc',
        data: { vendor_page_url: 'N/A' } // General search didn't find specific vendor URL
    },
    {
        slug: 'top-tier-public-adjusters',
        data: { vendor_page_url: 'N/A' } // No specific vendor URL
    },
    {
        slug: 'national-mortgage-field-services',
        data: { vendor_page_url: 'https://nfronline.com/vendors/apply-now/' } // They operate as NFR
    },
    {
        slug: 'amerispec-chicago-xperience-home-inspections',
        data: { vendor_page_url: 'N/A' } // Skipped from previous query, but in JSON block
    },
    {
        slug: 'perry-johnson-registrars-food-safety-inc',
        data: { vendor_page_url: 'https://www.pjrfsi.com/careers' }
    },
    {
        slug: 'resnet',
        data: { vendor_page_url: 'https://resnet.jobstobuild.com/' } // Jobstobuild portal
    },
    {
        slug: 'east-coast-property-servicesllc',
        data: { vendor_page_url: 'N/A' } // Too many companies with this name to be sure
    },
    {
        slug: 'simple-inspections',
        data: { vendor_page_url: 'https://simpleinspection.com/contact-us/' } // No specific career page, use contact
    },
    {
        slug: '1st-choice-mfs',
        data: { vendor_page_url: 'https://1stchoicemfs.com/apply/' }
    },
    {
        slug: 'southern-elite-field-services-llc',
        data: { vendor_page_url: 'http://soelitefs.com/jobs/' }
    }
];

async function updateFirms() {
    console.log('Updating second batch of firms contact info...\n');
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
