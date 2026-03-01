require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;

if (!AC_API_URL || !AC_API_KEY) {
    console.error("Missing ActiveCampaign URL or Key in environment variables.");
    process.exit(1);
}

async function fetchAllTags() {
    let allTags = [];
    let offset = 0;
    const limit = 100;
    let keepGoing = true;

    console.log(`Fetching tags from ActiveCampaign...`);

    while (keepGoing) {
        try {
            const url = `${AC_API_URL}/api/3/tags?limit=${limit}&offset=${offset}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Api-Token': AC_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.tags && data.tags.length > 0) {
                allTags = allTags.concat(data.tags);
                offset += limit;
                console.log(`Fetched ${allTags.length} tags...`);
            } else {
                keepGoing = false;
            }
        } catch (error) {
            console.error("Error fetching tags:", error.message);
            keepGoing = false;
        }
    }

    // Sort tags alphabetically for easier auditing
    allTags.sort((a, b) => a.tag.localeCompare(b.tag));

    // Group tags to find potential duplicates (case-insensitive or similar)
    const normalizedMap = {};
    const exactDuplicates = [];

    allTags.forEach(tagObj => {
        const normalized = tagObj.tag.toLowerCase().trim();
        if (normalizedMap[normalized]) {
            normalizedMap[normalized].push(tagObj);
            exactDuplicates.push({ name: tagObj.tag, ids: normalizedMap[normalized].map(t => t.id) });
        } else {
            normalizedMap[normalized] = [tagObj];
        }
    });

    console.log(`\n\n--- ACTIVE CAMPAIGN TAG AUDIT ---`);
    console.log(`Total Unique Tags: ${allTags.length}`);

    if (exactDuplicates.length > 0) {
        console.log(`\n⚠️ POTENTIAL DUPLICATES DETECTED:`);
        exactDuplicates.forEach(d => console.log(`  - "${d.name}" (IDs: ${d.ids.join(', ')})`));
    }

    console.log(`\n--- ALL TAGS ---`);
    allTags.forEach(t => {
        console.log(`ID: ${t.id.padEnd(5)} | Name: ${t.tag.padEnd(40)} | Subs: ${t.subscriber_count}`);
    });

    // Save to a local JSON file for further programmatic filtering if needed
    fs.writeFileSync('ac_tags_audit.json', JSON.stringify(allTags, null, 2));
    console.log('\nFull tag data saved to ac_tags_audit.json');
}

fetchAllTags();
