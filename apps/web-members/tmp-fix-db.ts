import * as dotenv from 'dotenv';
import * as path from 'path';
import postgres from 'postgres';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Parse the Supabase URL
// Format: https://[PROJECT_REF].supabase.co
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

async function fixConstraint() {
    if (!dbPassword) {
        console.error('Missing SUPABASE_DB_PASSWORD in environment. Please add to .env.local to run migrations.');
        return;
    }

    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    const connectionString = `postgres://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

    console.log(`Connecting to Postgres: ${projectRef}...`);
    const sql = postgres(connectionString);

    try {
        console.log('Dropping existing constraint...');
        await sql`ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;`;

        console.log('Adding updated constraint...');
        await sql`ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'starter', 'pro', 'elite', 'agency', 'founders'));`;

        console.log('Constraint updated successfully!');
    } catch (err) {
        console.error('Error updating constraint:', err);
    } finally {
        await sql.end();
    }
}

fixConstraint();
