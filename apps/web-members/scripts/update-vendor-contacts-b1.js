const { createClient } = require('@supabase/supabase-js');

const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        slug: 'asi-auto-groupllc',
        data: { vendor_page_url: 'https://asiag.com/careers' }
    },
    {
        slug: 'glotel',
        data: { vendor_page_url: 'https://www.glotel.com/about-us/' } // Contact usallsales@glotel.com
    },
    {
        slug: 'gridsource-incorporated-llc',
        data: { vendor_page_url: 'https://www.gogridsource.com/careers' }
    },
    {
        slug: 'millennium-information-servicesinc',
        data: { vendor_page_url: 'https://millinfo.com/careers/', phone: '(630) 285-8282', email: 'custservice@millinfo.com' }
    },
    {
        slug: 'inspections-done-right-llc',
        data: { vendor_page_url: 'https://www.inspectionsdoneright.biz/join-the-team' }
    },
    {
        slug: 'national-sfs',
        data: { vendor_page_url: 'http://www.nationsfs.com/' } // SFS Inc
    },
    {
        slug: 'ky-field-services',
        data: { vendor_page_url: 'https://kyfieldservices.com/join-our-network/' }
    },
    {
        slug: 'wc-field-service',
        data: { vendor_page_url: 'N/A' } // Doesn't seem to have a vendor page online
    },
    {
        slug: 'greenworks-inspections-engineering',
        data: { vendor_page_url: 'https://greenworksinspections.com/careers/' }
    },
    {
        slug: 'spotless-chimney-sweeping-solutions',
        data: { vendor_page_url: 'https://spotlesschimney.com/training-center-careers/' }
    }
];

async function updateFirms() {
    console.log('Updating first 10 firms contact info...\n');
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
