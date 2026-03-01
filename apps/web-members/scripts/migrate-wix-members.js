require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');

/**
 * MIGRATION CONFIGURATION
 */
const WIX_CSV_PATH = 'C:/Users/Mother/Projects/nested-objects-starter/contacts (7).csv';

// Outseta API configuration
// NOTE: Outseta API uses Basic Auth with Key:Secret base64 encoded.
const OUTSETA_DOMAIN = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || 'nestedobjects.outseta.com';
const OUTSETA_URL = `https://${OUTSETA_DOMAIN}/api/v1`;
const OUTSETA_API_KEY = process.env.OUTSETA_API_KEY || process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;
const OUTSETA_API_SECRET = process.env.OUTSETA_API_SECRET;

if (!OUTSETA_API_KEY || !OUTSETA_API_SECRET) {
    console.error("Missing OUTSETA_API_KEY or OUTSETA_API_SECRET in environment.");
    process.exit(1);
}

// Create the Auth token (Outseta uses 'Outseta key:secret', NOT base64 encoded Basic)
const OUTSETA_AUTH = `${OUTSETA_API_KEY}:${OUTSETA_API_SECRET}`;

// Plan and Discount configurations
const PLAN_UID = 'pWrBRnWn'; // Founder Plan
const DISCOUNT_UID = 'ZmNpN292'; // "founder" discount

// IMPORTANT: Set to false to run the full batch!
const SINGLE_TEST_MODE = true;

/**
 * FIELD MAPPINGS
 * Mapping the Wix "Position" string to the exact Option string expected by ActiveCampaign Field 69.
 * (Adjusted strings to match the ActiveCampaign screenshot exactly)
 */
const PERSONA_MAPPING = {
    'Choice 1': 'persona-new-inspector',
    'Choice 2': 'persona-experienced-inspector',
    'Choice 3': 'persona-notary-realtor',
    'Choice 4': 'persona-tech-professional'
};

/**
 * FILTERING LOGIC
 * Since there is no "Pricing Plan" column, we need to determine if a contact in the CSV
 * is a paying member we should port over.
 * BASED ON CSV: We check if 'Labels' includes 'Vetted Firms Direcfory' OR 'Last Activity' includes 'Purchased Pricing Plan'
 */
function isPayingMember(row) {
    const labels = row['Labels'] ? row['Labels'].toLowerCase() : '';
    const lastActivity = row['Last Activity'] ? row['Last Activity'].toLowerCase() : '';
    const position = row['Position'];

    // Ensure they have a Choice position AND have an indicator of membership
    if (!position || !position.trim().startsWith('Choice')) return false;

    return labels.includes('vetted firms direcfory') || lastActivity.includes('purchased pricing plan');
}

/**
 * Build the payload for the Outseta Account Creation endpoint.
 */
function buildOutsetaPayload(row) {
    const rawPosition = row['Position'].trim();
    const mappedPersona = PERSONA_MAPPING[rawPosition] || rawPosition;

    const email = row['Email 1'] || row['Email 2'];

    // The CSV has a BOM character on the first column header ('First Name').
    // We need to find the actual key by checking for keys that end with 'First Name'.
    const firstNameKey = Object.keys(row).find(k => k.endsWith('First Name'));
    let firstName = firstNameKey ? row[firstNameKey] : '';
    let lastName = row['Last Name'] || '';

    // If first/last name are empty, parse from Full Name
    if ((!firstName || !lastName) && row['Full Name']) {
        const parts = row['Full Name'].trim().split(/\s+/);
        if (!firstName && parts.length > 0) firstName = parts[0];
        if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
    }

    // Account name
    let name = row['Full Name'] || `${firstName} ${lastName}`.trim();
    if (!name && email) name = email.split('@')[0];

    return {
        Name: name,
        AccountStage: 3, // Subscriber/Customer
        PersonAccount: [
            {
                Person: {
                    Email: email,
                    FirstName: firstName,
                    LastName: lastName,
                    // Outseta custom fields use the system name as the key
                    Persona: mappedPersona
                },
                IsPrimary: true
            }
        ],
        CurrentSubscription: {
            Plan: {
                Uid: PLAN_UID
            },
            BillingRenewalTerm: 1, // Monthly
            DiscountCouponSubscriptions: [
                {
                    Discount: {
                        Uid: DISCOUNT_UID
                    }
                }
            ]
        },
        SendWelcomeEmail: true
    };
}

/**
 * MAIN EXECUTION (DRY RUN MODE)
 */
async function processMigration() {
    console.log(`Starting DRY RUN migration using file: ${WIX_CSV_PATH}`);
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
            console.log(`Skipped ${skippedRecords.length} records (no active membership indicator).\n`);

            if (SINGLE_TEST_MODE) {
                console.log('--- ⚠️ SINGLE TEST MODE IS ON ⚠️ ---');
                console.log('Only processing the FIRST valid member.');
            } else {
                console.log('--- 🚀 FULL MIGRATION MODE IS ON 🚀 ---');
                console.log(`Preparing to process all ${validMembers.length} valid members.`);
            }

            // Slice the array if we are only testing one
            const membersToProcess = SINGLE_TEST_MODE ? validMembers.slice(0, 1) : validMembers;

            console.log('\n--- STARTING API UPLOADS ---\n');
            const BATCH_WAIT_MS = 1000; // Wait 1 second between requests so we don't hit rate limits

            async function processBatch() {
                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < membersToProcess.length; i++) {
                    const member = membersToProcess[i];
                    const payload = buildOutsetaPayload(member);
                    const email = payload.PersonAccount[0].Person.Email;

                    console.log(`[${i + 1}/${membersToProcess.length}] Creating Account for: ${email}`);
                    console.log(`   Payload:`, JSON.stringify(payload, null, 2));

                    try {
                        const apiUrl = `${OUTSETA_URL}/crm/accounts`;
                        console.log(`   POST -> ${apiUrl}`);

                        const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Outseta ${OUTSETA_AUTH}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(payload)
                        });

                        const responseText = await response.text();

                        if (!response.ok) {
                            console.error(`   Response Status: ${response.status}`);
                            console.error(`   Response Body: ${responseText}`);
                            throw new Error(`HTTP ${response.status}`);
                        }

                        console.log(`   ✅ Success! Response: ${responseText.substring(0, 200)}`);
                        successCount++;
                    } catch (error) {
                        console.error(`   ❌ Failed: ${error.message}`);
                        failCount++;
                    }

                    // Throttle requests slightly
                    if (i < membersToProcess.length - 1) {
                        await new Promise(r => setTimeout(r, BATCH_WAIT_MS));
                    }
                }

                console.log('\n--- MIGRATION SUMMARY ---');
                console.log(`Total Attempted: ${membersToProcess.length}`);
                console.log(`Successful: ${successCount}`);
                console.log(`Failed: ${failCount}`);

                if (SINGLE_TEST_MODE && successCount > 0) {
                    console.log('\n--- TEST COMPLETE ---');
                    console.log('1. Check Outseta to verify the account/subscription/persona was created.');
                    console.log('2. Check ActiveCampaign to verify the webhook synced the persona and migrate tags.');
                    console.log('3. If everything looks good, change SINGLE_TEST_MODE = false at the top of this script and run again!');
                }
            }

            processBatch();
        });
}

processMigration();
