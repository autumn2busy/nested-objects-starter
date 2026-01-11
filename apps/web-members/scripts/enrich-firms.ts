
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Path to the CSV file
const CSV_PATH = path.join(__dirname, '../firms_duplicate2_rows.csv');
const OUT_PATH = path.join(__dirname, '../seed_augmented.sql');
const URL_MAP_PATH = path.join(__dirname, 'url_map.json');

interface FirmRow {
    id: string;
    name: string;
    url: string;
    description: string;
    geographic_coverage: string;
    categories: string;
    slug: string;
    latitude: string;
    longitude: string;
    created_at: string;
    // specialized fields
    pay_min?: string;
    pay_max?: string;
    pay_type?: string;
    rating?: string;
}

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

function cleanCategories(catString: string): string {
    if (!catString) return '[]';
    // The CSV export often doubles quotes: "[""Valuation"", ""Inspection""]"
    // We need to parse that back to a real JSON array string
    try {
        // Attempt 1: It might be valid JSON already
        JSON.parse(catString);
        return catString;
    } catch (e) {
        // Attempt 2: aggressively clean the CSV artifacts
        // Remove outer quotes if wrapped
        let clean = catString.replace(/^"|"$/g, '');
        // Replace double double-quotes with single
        clean = clean.replace(/""/g, '"');

        // If it looks like a list: "Valuation, Inspection" -> ["Valuation", "Inspection"]
        if (!clean.startsWith('[')) {
            const parts = clean.split(',').map(s => s.trim()).filter(Boolean);
            return JSON.stringify(parts);
        }

        return clean;
    }
}

function run() {
    console.log(`Reading from ${CSV_PATH}...`);
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');

    // Load URL map
    let urlMap: Record<string, string> = {};
    if (fs.existsSync(URL_MAP_PATH)) {
        console.log(`Loading URL map from ${URL_MAP_PATH}...`);
        urlMap = JSON.parse(fs.readFileSync(URL_MAP_PATH, 'utf-8'));
    }

    const DESCRIPTION_MAP_PATH = path.join(__dirname, 'description_map.json');
    let descMap: Record<string, string> = {};
    if (fs.existsSync(DESCRIPTION_MAP_PATH)) {
        console.log(`Loading Description map from ${DESCRIPTION_MAP_PATH}...`);
        descMap = JSON.parse(fs.readFileSync(DESCRIPTION_MAP_PATH, 'utf-8'));
    }

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true, // metrics can be messy
    }) as FirmRow[];

    console.log(`Found ${records.length} records.`);

    let sqlOutput = `-- Auto-generated enrichment script\n\n`;

    for (const record of records) {
        // 1. Generate Slug if missing or ugly
        const slug = record.slug || slugify(record.name);

        // 1b. Enrich URL
        const finalUrl = record.url || urlMap[record.id] || '';

        // 2. Clean Categories
        let cats = cleanCategories(record.categories);
        // Fallback: if empty, try to derive from other fields or default
        if (cats === '[]' || !cats) {
            if (record.description.toLowerCase().includes('preservation')) {
                cats = '["Property Preservation"]';
            } else if (record.name.toLowerCase().includes('appraisal')) {
                cats = '["Appraisal Services"]';
            } else {
                cats = '["Field Services"]';
            }
        }

        // 3. Normalize Publish State
        // If it has a URL and a Description, let's publish it.
        const isPublished = (!!finalUrl && record.description.length > 10) ? 'true' : 'false';

        // 4. Construct SQL Update
        // We use ON CONFLICT DO UPDATE to make this idempotent
        // Note: We need to escape single quotes in content
        let finalDesc = record.description || '';
        if (finalDesc.length < 10 && descMap[record.id]) {
            finalDesc = descMap[record.id];
        }

        const safeDesc = finalDesc.replace(/'/g, "''");
        const safeName = record.name.replace(/'/g, "''");

        // Helper to safely parse numbers, removing commas
        const parseNum = (val: string | undefined) => {
            if (!val) return 'NULL';
            const clean = val.replace(/,/g, '').trim();
            const num = parseFloat(clean);
            return isNaN(num) ? 'NULL' : clean; // Return clean string (without commas)
        };

        const lat = parseNum(record.latitude);
        const lon = parseNum(record.longitude);

        const payMin = parseNum(record.pay_min);
        const payMax = parseNum(record.pay_max);
        const rating = parseNum(record.rating);

        const updateStmt = `
INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '${record.id}',
    '${safeName}',
    '${slug}',
    '${safeDesc}',
    '${cats}'::jsonb,
    '${finalUrl}',
    ${lat},
    ${lon},
    ${isPublished},
    ${payMin},
    ${payMax},
    ${rating}
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;
`;
        sqlOutput += updateStmt;
    }

    console.log(`Writing SQL to ${OUT_PATH}...`);
    fs.writeFileSync(OUT_PATH, sqlOutput);
    console.log('Done!');
}

run();
