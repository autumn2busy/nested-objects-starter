
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_PATH = path.join(__dirname, '../firms_rows (3).csv');
const OUT_PATH = path.join(__dirname, '../missing_urls_utf8.json');

interface FirmRow {
    id: string;
    name: string;
    url: string;
}

const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
}) as FirmRow[];

const missing = records.filter(r => !r.url || r.url.trim() === '');
fs.writeFileSync(OUT_PATH, JSON.stringify(missing.map(r => ({ id: r.id, name: r.name })), null, 2), 'utf-8');
console.log(`Found ${missing.length} missing URLs.`);
