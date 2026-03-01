import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    // Check Allegheny specifically
    const { data: allegheny } = await supabase
        .from('firms')
        .select('id, name, pay_min, pay_max, pay_type, pay_range')
        .ilike('name', '%allegheny%');

    const results: any = { allegheny };

    // Also check: how many firms have NULL pay values?
    const { count: nullPayMin } = await supabase
        .from('firms')
        .select('id', { count: 'exact', head: true })
        .is('pay_min', null);

    const { count: nullPayMax } = await supabase
        .from('firms')
        .select('id', { count: 'exact', head: true })
        .is('pay_max', null);

    const { count: totalFirms } = await supabase
        .from('firms')
        .select('id', { count: 'exact', head: true });

    results.nullPayMin = nullPayMin;
    results.nullPayMax = nullPayMax;
    results.totalFirms = totalFirms;

    // Check what the $100+ filter actually returns count-wise via direct query
    const { count: payFilterCount } = await supabase
        .from('firms')
        .select('id', { count: 'exact', head: true })
        .or('pay_max.gte.100,pay_min.gte.100');

    results.payFilter100Count = payFilterCount;

    fs.writeFileSync('/tmp/pay_diag.json', JSON.stringify(results, null, 2), 'utf8');
}

check();
