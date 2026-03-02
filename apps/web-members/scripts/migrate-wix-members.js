require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');

/**
 * MIGRATION CONFIGURATION
 */
const WIX_CSV_PATH = 'C:/Users/Mother/Projects/nested-objects-starter/contacts (7).csv';

// Outseta API configuration
const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nested-objects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;

// ActiveCampaign API configuration
const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;

if (!OUTSETA_API_KEY || !OUTSETA_API_SECRET) {
    console.error("Missing OUTSETA_API_KEY or OUTSETA_API_SECRET in environment.");
    process.exit(1);
}
if (!AC_API_URL || !AC_API_KEY) {
    console.error("Missing AC_API_URL or AC_API_KEY in environment.");
    process.exit(1);
}

const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

// Plan and Discount configurations
const PLAN_UID = 'pWrBRnWn'; // Founder Plan
const DISCOUNT_UID = 'ZmNpN292'; // "founder" discount

// IMPORTANT: Set to false to run the full batch!
const SINGLE_TEST_MODE = false;

/**
 * PERSONA TAG MAPPING
 * Maps Wix "Position" to ActiveCampaign persona tags.
 * NOTE: Outseta REST API does not support custom field writes,
 * so we tag the user directly in ActiveCampaign instead.
 */
const PERSONA_MAPPING = {
    'Choice 1': 'persona-new-inspector',
    'Choice 2': 'persona-experienced-inspector',
    'Choice 3': 'persona-notary-realtor',
    'Choice 4': 'persona-tech-professional'
};

/**
 * FILTERING LOGIC
 */
function isPayingMember(row) {
    const labels = row['Labels'] ? row['Labels'].toLowerCase() : '';
    const lastActivity = row['Last Activity'] ? row['Last Activity'].toLowerCase() : '';
    const position = row['Position'];
    if (!position || !position.trim().startsWith('Choice')) return false;
    return labels.includes('vetted firms direcfory') || lastActivity.includes('purchased pricing plan');
}

/**
 * Build the Outseta payload (account + person + subscription).
 * Persona is NOT included here since Outseta REST API ignores custom fields.
 */
function buildOutsetaPayload(row) {
    const email = row['Email 1'] || row['Email 2'];

    // The CSV has a BOM character on the first column header ('First Name').
    const firstNameKey = Object.keys(row).find(k => k.endsWith('First Name'));
    let firstName = (firstNameKey ? row[firstNameKey] : '').trim();
    let lastName = (row['Last Name'] || '').trim();

    // If first/last name are empty, parse from Full Name
    if ((!firstName || !lastName) && row['Full Name']) {
        const parts = row['Full Name'].trim().split(/\s+/);
        if (!firstName && parts.length > 0) firstName = parts[0];
        if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
    }

    // Account name
    let name = row['Full Name'] ? row['Full Name'].trim() : `${firstName} ${lastName}`.trim();
    if (!name && email) name = email.split('@')[0];

    return {
        Name: name,
        AccountStage: 3, // Subscriber/Customer
        PersonAccount: [
            {
                IsPrimary: true,
                Person: {
                    Email: email,
                    FirstName: firstName,
                    LastName: lastName
                }
            }
        ],
        Subscriptions: [
            {
                Plan: { Uid: PLAN_UID },
                BillingRenewalTerm: 1, // Monthly
                DiscountCode: 'founder' // This 100% off coupon makes the first month $0, then it goes to $37
            }
        ],
        SendWelcomeEmail: true
    };
}

/**
 * ACTIVECAMPAIGN TAGGING
 * After creating the user in Outseta, we tag them directly in AC.
 */
async function tagContactInAC(email, firstName, lastName, personaTag) {
    const logs = [];

    // Step 1: Sync contact to get their AC ID (also updates name)
    const syncRes = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
        method: 'POST',
        headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contact: { email, firstName: firstName || '', lastName: lastName || '' }
        })
    });
    const syncData = await syncRes.json();
    const contactId = syncData?.contact?.id;
    if (!contactId) {
        logs.push(`Failed to sync contact in AC: ${JSON.stringify(syncData)}`);
        return logs;
    }
    logs.push(`AC Contact synced: ID ${contactId}`);

    // Step 2: Add persona tag + migrate tag
    const tagsToAdd = [personaTag, 'migrate'];
    for (const tagName of tagsToAdd) {
        // Find or create the tag
        const searchRes = await fetch(`${AC_API_URL}/api/3/tags?search=${encodeURIComponent(tagName)}`, {
            headers: { 'Api-Token': AC_API_KEY }
        });
        const searchData = await searchRes.json();
        let tagId = searchData.tags?.find(t => t.tag.toLowerCase() === tagName.toLowerCase())?.id;

        if (!tagId) {
            const createRes = await fetch(`${AC_API_URL}/api/3/tags`, {
                method: 'POST',
                headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag: { tag: tagName, tagType: 'contact', description: 'Migration tag' } })
            });
            const createData = await createRes.json();
            tagId = createData.tag?.id;
        }

        if (!tagId) {
            logs.push(`Could not find/create tag '${tagName}'`);
            continue;
        }

        // Apply it
        const assocRes = await fetch(`${AC_API_URL}/api/3/contactTags`, {
            method: 'POST',
            headers: { 'Api-Token': AC_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } })
        });

        if (assocRes.ok || assocRes.status === 201) {
            logs.push(`Tagged '${tagName}'`);
        } else if (assocRes.status === 422) {
            logs.push(`Tag '${tagName}' already applied`);
        } else {
            logs.push(`Failed to tag '${tagName}': ${assocRes.status}`);
        }
    }

    return logs;
}

/**
 * MAIN EXECUTION
 */
async function processMigration() {
    console.log(`Starting migration using file: ${WIX_CSV_PATH}`);
    console.log(`Plan UID: ${PLAN_UID} | Discount UID: ${DISCOUNT_UID}\n`);

    const validMembers = [];
    const skippedRecords = [];

    fs.createReadStream(WIX_CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
            if (row['Email 1'] || row['Email 2']) {
                if (isPayingMember(row)) {
                    validMembers.push(row);
                } else {
                    skippedRecords.push(row['Email 1'] || row['Email 2']);
                }
            }
        })
        .on('end', () => {
            console.log(`✅ CSV Parsing Complete`);
            console.log(`Found ${validMembers.length} valid members to migrate.`);
            console.log(`Skipped ${skippedRecords.length} records.\n`);

            if (SINGLE_TEST_MODE) {
                console.log('--- ⚠️ SINGLE TEST MODE ⚠️ ---');
                console.log('Only processing the FIRST valid member.\n');
            } else {
                console.log(`--- 🚀 FULL MIGRATION: ${validMembers.length} members ---\n`);
            }

            const membersToProcess = SINGLE_TEST_MODE ? validMembers.slice(0, 1) : validMembers;

            async function processBatch() {
                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < membersToProcess.length; i++) {
                    const member = membersToProcess[i];
                    const payload = buildOutsetaPayload(member);
                    const email = payload.PersonAccount[0].Person.Email;
                    const firstName = payload.PersonAccount[0].Person.FirstName;
                    const lastName = payload.PersonAccount[0].Person.LastName;
                    const rawPosition = member['Position'].trim();
                    const personaTag = PERSONA_MAPPING[rawPosition] || 'persona-unknown';

                    console.log(`[${i + 1}/${membersToProcess.length}] ${email} (${firstName} ${lastName}) -> ${personaTag}`);

                    try {
                        // Step 1: Create in Outseta
                        const response = await fetch(`${OUTSETA_URL}/crm/accounts`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Outseta ${OUTSETA_AUTH}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });

                        const responseText = await response.text();
                        if (!response.ok) {
                            throw new Error(`Outseta HTTP ${response.status}: ${responseText.substring(0, 200)}`);
                        }
                        console.log(`   ✅ Outseta: Account created`);

                        // Step 2: Tag in ActiveCampaign (name + persona + migrate)
                        const acLogs = await tagContactInAC(email, firstName, lastName, personaTag);
                        acLogs.forEach(log => console.log(`   📌 AC: ${log}`));

                        successCount++;
                    } catch (error) {
                        console.error(`   ❌ Failed: ${error.message}`);
                        failCount++;
                    }

                    // Throttle
                    if (i < membersToProcess.length - 1) {
                        await new Promise(r => setTimeout(r, 1500));
                    }
                }

                console.log('\n--- MIGRATION SUMMARY ---');
                console.log(`Total: ${membersToProcess.length} | Success: ${successCount} | Failed: ${failCount}`);

                if (SINGLE_TEST_MODE && successCount > 0) {
                    console.log('\n✅ TEST COMPLETE. Verify in Outseta + ActiveCampaign, then set SINGLE_TEST_MODE = false.');
                }
            }

            processBatch();
        });
}

processMigration();
