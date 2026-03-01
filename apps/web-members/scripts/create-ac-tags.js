require('dotenv').config({ path: '.env.local' });

const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;

if (!AC_API_URL || !AC_API_KEY) {
    console.error("Missing ActiveCampaign URL or Key in environment variables.");
    process.exit(1);
}

const tagsToCreate = [
    'persona-new-inspector',
    'persona-experienced-inspector',
    'persona-notary-realtor',
    'persona-tech-professional'
];

async function createTags() {
    console.log("Checking and creating Persona tags in ActiveCampaign...");

    for (const tagName of tagsToCreate) {
        try {
            // First search if it exists
            const searchRes = await fetch(`${AC_API_URL}/api/3/tags?search=${encodeURIComponent(tagName)}`, {
                method: 'GET',
                headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' }
            });
            const searchData = await searchRes.json();

            const existingTag = searchData.tags?.find(t => t.tag.toLowerCase() === tagName.toLowerCase());

            if (existingTag) {
                console.log(`✅ Tag already exists: ${tagName} (ID: ${existingTag.id})`);
            } else {
                // Create the tag
                console.log(`Creating tag: ${tagName}...`);
                const createRes = await fetch(`${AC_API_URL}/api/3/tags`, {
                    method: 'POST',
                    headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tag: {
                            tag: tagName,
                            tagType: 'contact',
                            description: 'Auto-created Persona tag for automated journeys'
                        }
                    })
                });

                if (!createRes.ok) {
                    throw new Error(`Failed to create tag ${tagName}: ${createRes.statusText}`);
                }

                const createData = await createRes.json();
                console.log(`🎉 Successfully created tag: ${tagName} (ID: ${createData.tag.id})`);
            }
        } catch (error) {
            console.error(`❌ Error with tag ${tagName}:`, error.message);
        }
    }
}

createTags();
