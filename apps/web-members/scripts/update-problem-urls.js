const { createClient } = require('@supabase/supabase-js');

// Supabase config
const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const updates = [
    {
        nameQuery: 'AmeriSpec Chicago',
        updateData: {
            url: 'https://www.amerispec.com'
        }
    },
    {
        nameQuery: 'Bismark Mortgage',
        updateData: {
            url: 'https://bismarkmortgage.com' // verified working with www or root
        }
    },
    {
        nameQuery: 'Douglas Guardian',
        updateData: {
            url: 'https://douglasguardian.com/'
        }
    },
    {
        nameQuery: 'F.R.R.S.C', // Front Range Roofing
        updateData: {
            url: 'https://frontrangeroofingservices.com/'
        }
    },
    {
        nameQuery: 'Inspect Solutions',
        updateData: {
            url: 'https://www.inspectsolutions.com/'
        }
    },
    {
        nameQuery: 'McCrory & Williams',
        updateData: {
            url: 'https://mcwinc.com/'
        }
    },
    {
        nameQuery: 'MedSpeed',
        updateData: {
            url: 'https://www.medspeed.com/'
        }
    },
    {
        nameQuery: 'NEIS/Armstrong',
        updateData: {
            url: 'https://armstrong-is.com/'
        }
    },
    {
        nameQuery: 'Reliable Reports',
        updateData: {
            url: 'https://reliablereports.com/'
        }
    },
    {
        nameQuery: 'Second To None',
        updateData: {
            url: 'https://second-to-none.com/'
        }
    },
    {
        nameQuery: 'Technical Insurance Services',
        updateData: {
            url: 'https://www.tisinspects.com/'
        }
    },
    {
        nameQuery: 'Total Care Medical Courier',
        updateData: {
            url: 'https://www.totalcarenc.com/'
        }
    },
    {
        nameQuery: 'Touch Insight Systems',
        updateData: {
            url: 'https://www.intouchinsight.com/'
        }
    },
    {
        nameQuery: 'Venture Underwriting',
        updateData: {
            url: 'https://ventureunderwriting.com/'
        }
    }
];

// Fallback exact text searches since some don't match exactly with standard search
const customSearches = {
    'F.R.R.S.C': 'Front Range',
    'McCrory & Williams': 'McCrory',
    'NEIS/Armstrong': 'Armstrong',
    'Total Care Medical Courier': 'Total Care',
    'Touch Insight Systems': 'Touch Insight'
};

async function main() {
    console.log('Initiating updates for the provided URLs...\n');

    for (const update of updates) {
        let searchQuery = customSearches[update.nameQuery] || update.nameQuery;

        let { data: firms, error: searchError } = await supabase
            .from('firms')
            .select('slug, name, url')
            .textSearch('name', searchQuery);

        // If textSearch fails, try ilike
        if (!firms || firms.length === 0) {
            const { data: ilikeFirms } = await supabase
                .from('firms')
                .select('slug, name, url')
                .ilike('name', `%${searchQuery.split(' ')[0]}%`);
            if (ilikeFirms) firms = ilikeFirms;
        }

        if (searchError || !firms || firms.length === 0) {
            console.log(`[!] Could not find firm matching: ${update.nameQuery} (Query: ${searchQuery})`);
            continue;
        }

        // Just take the first match for simplicity assuming names are distinct enough
        const firmToUpdate = firms[0];
        console.log(`[✓] Found ${firmToUpdate.name} (${firmToUpdate.slug}). Old URL: ${firmToUpdate.url} -> New: ${update.updateData.url}`);

        const { error: updateError } = await supabase
            .from('firms')
            .update(update.updateData)
            .eq('slug', firmToUpdate.slug);

        if (updateError) {
            console.error(`[X] Error updating ${firmToUpdate.slug}:`, updateError.message);
        } else {
            console.log(`    Successfully updated URL.`);
        }
    }
    console.log('\nDone applying updates.');
}

main();
