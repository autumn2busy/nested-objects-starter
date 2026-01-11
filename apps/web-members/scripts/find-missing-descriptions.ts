
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_PATH = path.join(__dirname, '../firms_rows (3).csv');
const URL_MAP_PATH = path.join(__dirname, 'url_map.json');
const OUT_PATH = path.join(__dirname, '../missing_descriptions.json');

interface FirmRow {
    id: string;
    name: string;
    url: string;
    description: string;
}

function run() {
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');

    let urlMap: Record<string, string> = {};
    if (fs.existsSync(URL_MAP_PATH)) {
        urlMap = JSON.parse(fs.readFileSync(URL_MAP_PATH, 'utf-8'));
    }

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
    }) as FirmRow[];

    const missing = records.filter(r => {
        const hasUrl = !!(r.url || urlMap[r.id]);
        const hasDesc = r.description && r.description.trim().length > 10;
        return hasUrl && !hasDesc;
    }).map(r => ({
        id: r.id,
        name: r.name,
        url: r.url || urlMap[r.id]
    }));

    console.log(`Found ${missing.length} firms with URLs but missing descriptions.`);
    fs.writeFileSync(OUT_PATH, JSON.stringify(missing, null, 2));
}

run();
