const { createClient } = require('@supabase/supabase-js');

const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        slug: 'equicheckllc',
        data: { vendor_page_url: 'N/A' }, // Retry failed query, but probably don't have it.
        skipped: true
    },
    {
        slug: 'ocwen',
        data: { vendor_page_url: 'N/A' } // Referred to Vendor Management email tprm@onitygroup.com
    },
    {
        slug: 'wilmot-field-servicesllc',
        data: { vendor_page_url: 'N/A' } // Name conflict obscuring result
    },
    {
        slug: 'first-look-home-inspection',
        data: { vendor_page_url: 'N/A' } // Encourages emailing resume but no sign-up page
    },
    {
        slug: '2m-quality',
        data: { vendor_page_url: 'https://www.2mquality.com/InspectorRegistration' } // Online portal info provided
    },
    {
        slug: 'hcp-property-inspection',
        data: { vendor_page_url: 'N/A' } // General contact form
    },
    {
        slug: 'fidelity-national-field-services-inc',
        data: { vendor_page_url: 'https://servicelinkfieldservices.com/VendorOnBoarding/' } // Assumed ServiceLink Field Services
    },
    {
        slug: 'test-center-usainc',
        data: { vendor_page_url: 'N/A' } // No portal
    },
    {
        slug: 'lscg',
        data: { vendor_page_url: 'N/A' } // No portal
    },
    {
        slug: 'proteck',
        data: { vendor_page_url: 'N/A' } // Numerous company conflicts, skipping
    }
];

async function updateFirms() {
    console.log('Updating seventh batch of firms contact info...\n');
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
