-- ============================================================================
-- SEED DATA FOR INTERACTIVE MODULES (1 & 2)
-- Combined migration for production deployment
-- ============================================================================

-- MODULE 1: Scenarios
DO $$
DECLARE
    module1_id UUID;
BEGIN
    -- Dynamically get Module 1 ID
    SELECT id INTO module1_id FROM training_modules WHERE module_number = 1 LIMIT 1;

    -- Only proceed if module exist
    IF module1_id IS NOT NULL THEN
        -- 1. The Career Transition Trap
        INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES (
            module1_id,
            'The Career Transition Trap',
            'The "Helpful" Realtor',
            'realtor',
            'Home',
            'amber',
            '{
                "character": "Sarah",
                "background": "A seasoned Realtor diversifying her income with property condition reports (PCRs)",
                "context": "Sarah arrives at a property 90 days delinquent. While performing her exterior walk-around, she notices a massive horizontal crack in the west foundation wall and water stains on the living room ceiling visible through a window.",
                "complication": "The homeowner, visibly distraught, meets Sarah in the driveway. Knowing Sarah is a \"real estate professional,\" the owner begs for an assessment: \"Is the house falling apart? How much will it cost to fix? Am I going to lose everything?\"",
                "instinct": "Sarah''s realtor instincts kick in—she wants to provide a repair estimate and a professional diagnosis to ease the owner''s mind."
            }',
            '[
                {
                    "id": "diagnosis",
                    "question": "The homeowner asks about the foundation. What does Sarah say?",
                    "options": [
                        {
                            "id": "a",
                            "text": "Tell the owner the foundation is \"failing\" and needs a $15,000 piering job",
                            "isCorrect": false,
                            "feedback": {
                                "title": "VIOLATION: Professional Overreach",
                                "message": "As a field inspector, you are a documentarian, not a consultant. Providing repair estimates or diagnoses exceeds your professional authority and creates liability for both you and the lender.",
                                "consequence": "The homeowner calls the lender citing your \"expert opinion,\" triggering an FDCPA review."
                            }
                        },
                        {
                            "id": "b",
                            "text": "Say \"I can''t give you that assessment, but I can document what I see\"",
                            "isCorrect": true,
                            "feedback": {
                                "title": "CORRECT: Maintaining Boundaries",
                                "message": "You correctly maintained the \"bright line\" between a home inspection and a field inspection. Your role is to document facts, not provide professional conclusions.",
                                "consequence": "The homeowner may be frustrated, but you''ve protected yourself and the lender from liability."
                            }
                        },
                        {
                            "id": "c",
                            "text": "Avoid the question and quickly finish the inspection",
                            "isCorrect": false,
                            "feedback": {
                                "title": "PARTIAL: Unprofessional Exit",
                                "message": "While avoiding the diagnosis is correct, rushing away without explanation damages your professional reputation and doesn''t help the homeowner understand the process.",
                                "consequence": "The homeowner may complain about your conduct, even if your report is technically correct."
                            }
                        }
                    ]
                },
                {
                    "id": "vocabulary",
                    "question": "The homeowner asks why you''re there. What language do you use?",
                    "options": [
                        {
                            "id": "a",
                            "text": "Explain that the house is in \"foreclosure\" and the bank sent you",
                            "isCorrect": false,
                            "feedback": {
                                "title": "VIOLATION: FDCPA Trigger Words",
                                "message": "Using terms like \"foreclosure\" or \"default\" with homeowners violates the Fair Debt Collection Practices Act. You are not authorized to communicate the status of their loan.",
                                "consequence": "The lender flags you for FDCPA violation. Your contract is under review."
                            }
                        },
                        {
                            "id": "b",
                            "text": "Say you''re conducting a \"property condition report\" for the servicer",
                            "isCorrect": true,
                            "feedback": {
                                "title": "CORRECT: Neutral Language",
                                "message": "Using neutral terms like \"property condition report\" and \"servicer\" communicates your purpose without making statements about the homeowner''s loan status.",
                                "consequence": "The homeowner understands your role without receiving debt collection information."
                            }
                        },
                        {
                            "id": "c",
                            "text": "Refuse to explain why you''re there",
                            "isCorrect": false,
                            "feedback": {
                                "title": "PARTIAL: Creates Suspicion",
                                "message": "While protecting information is important, refusing to explain your presence entirely may escalate the situation or cause the homeowner to call police.",
                                "consequence": "The interaction becomes confrontational, making documentation difficult."
                            }
                        }
                    ]
                },
                {
                    "id": "report",
                    "question": "How do you describe the foundation damage in your report?",
                    "options": [
                        {
                            "id": "a",
                            "text": "\"Property is in terrible condition with major structural damage\"",
                            "isCorrect": false,
                            "feedback": {
                                "title": "VIOLATION: Subjective Language",
                                "message": "\"Terrible\" and \"major\" are subjective terms. Your report should contain only observable facts, not interpretations or emotional language.",
                                "consequence": "Report rejected for subjective language. You must resubmit with objective prose."
                            }
                        },
                        {
                            "id": "b",
                            "text": "\"The foundation needs immediate repair to prevent collapse\"",
                            "isCorrect": false,
                            "feedback": {
                                "title": "VIOLATION: Professional Diagnosis",
                                "message": "Stating something \"needs repair\" or predicting \"collapse\" is a professional diagnosis. You are not qualified to make structural assessments.",
                                "consequence": "Report flagged for scope violation. Potential contract termination."
                            }
                        },
                        {
                            "id": "c",
                            "text": "\"A horizontal crack approximately 8 feet in length is visible on the west foundation wall\"",
                            "isCorrect": true,
                            "feedback": {
                                "title": "CORRECT: Objective Documentation",
                                "message": "This describes exactly what you observed with measurable details. The lender''s risk team can interpret the significance—that''s their job, not yours.",
                                "consequence": "Report accepted. Your professional, factual documentation is exactly what the lender needs."
                            }
                        }
                    ]
                }
            ]',
            '{
                "keyLesson": "Maintain the \"bright line\" between field inspection and home inspection.",
                "coreRule": "You are a documentarian, not a consultant. Document facts, not diagnoses.",
                "audienceWarning": "Realtors: Your instinct to help with professional advice is your biggest liability in this role."
            }',
            1
        );

        -- 2. The Gig Worker Mindset
        INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES (
            module1_id,
            'The Gig Worker Mindset',
            'Speed vs. Quality',
            'gig-worker',
            'Car',
            'blue',
            '{
                "character": "Marcus",
                "background": "A former delivery driver used to a high-volume/low-pay model where speed is the only metric that matters",
                "context": "Marcus has a \"batch\" of 10 occupancy checks to complete before a 5:00 PM SLA deadline. It is raining, and he is behind schedule.",
                "complication": "At his fourth stop, Marcus considers staying in his dry car. He can see the front of the house from here. The grass is cut and a car is in the driveway.",
                "instinct": "Marcus assumes that as long as the photos show the house, he''ll get paid his $50 fee. Speed has always been the key to his income."
            }',
            '[
                {
                    "id": "six-angle",
                    "question": "It''s raining. Does Marcus exit the vehicle to capture the full 6-angle sequence?",
                    "options": [
                        {
                            "id": "a",
                            "text": "Stay in the car and take photos through the window to save time",
                            "isCorrect": false,
                            "feedback": {
                                "title": "VIOLATION: \"Car Parts\" in Frame",
                                "message": "Photos with visible mirrors, dashboards, or window frames are automatically rejected. They prove you didn''t conduct the required physical survey.",
                                "consequence": "Report rejected. \"Car parts\" visible in Front Elevation shot."
                            }
                        },
                        {
                            "id": "b",
                            "text": "Exit quickly, snap 2-3 photos of just the front, and move on",
                            "isCorrect": false,
                            "feedback": {
                                "title": "INCOMPLETE: Missing Required Angles",
                                "message": "The 6-angle sequence exists for a reason—it provides complete documentation of the property''s exterior condition. Partial coverage is incomplete documentation.",
                                "consequence": "Report flagged for missing angles. Return trip required at your expense."
                            }
                        },
                        {
                            "id": "c",
                            "text": "Exit the vehicle and complete the full 6-angle sequence despite the rain",
                            "isCorrect": true,
                            "feedback": {
                                "title": "CORRECT: Professional Standards",
                                "message": "Weather doesn''t change the requirements. Proper gear (umbrella, rain jacket) is part of being a professional. The 6-angle sequence must be completed from outside the vehicle.",
                                "consequence": "Report meets technical standards. Payment confirmed."
                            }
                        }
                    ]
                },
                {
                    "id": "verification",
                    "question": "There''s a car in the driveway and the grass is cut. How does Marcus determine occupancy?",
                    "options": [
                        {
                            "id": "a",
                            "text": "Mark it \"Occupied\" based on the car and grass maintenance",
                            "isCorrect": false,
                            "feedback": {
                                "title": "VIOLATION: The \"Hamburger Without Meat\"",
                                "message": "A car in a driveway could belong to a neighbor. Cut grass could be HOA maintenance. \"Guessing\" occupancy based on assumptions provides useless information to the lender.",
                                "consequence": "The homeowner actually moved out 2 days ago. The car belongs to a neighbor. Your \"Occupied\" determination is wrong."
                            }
                        },
                        {
                            "id": "b",
                            "text": "Check utility meters and look for signs of life before making a determination",
                            "isCorrect": true,
                            "feedback": {
                                "title": "CORRECT: The Occupancy Hierarchy",
                                "message": "Signs of life: spinning electric meter, lit windows, mail being collected, trash cans at curb, pets, personal items. These are the indicators that prove occupancy—not assumptions.",
                                "consequence": "You discover the electric meter is stopped and mail is piling up. You correctly determine \"First-Time Vacant.\""
                            }
                        },
                        {
                            "id": "c",
                            "text": "Mark it \"Unknown\" since no one answered the door",
                            "isCorrect": false,
                            "feedback": {
                                "title": "VIOLATION: The Useless Report",
                                "message": "\"Unknown\" is unacceptable. Lenders pay for a definitive determination based on visual cues. \"No answer\" is not the same as \"unknown\"—you can still observe signs of life.",
                                "consequence": "Report rejected as incomplete. \"Unknown\" provides zero value to the lender."
                            }
                        }
                    ]
                },
                {
                    "id": "quality",
                    "question": "Marcus is behind schedule. How does he handle photo quality in the rain?",
                    "options": [
                        {
                            "id": "a",
                            "text": "Upload whatever he got—the lender will understand it was raining",
                            "isCorrect": false,
                            "feedback": {
                                "title": "REJECTION: Technical Standards Apply",
                                "message": "Blurry, rain-streaked, or dark photos are rejected regardless of weather. Weather conditions don''t excuse poor documentation.",
                                "consequence": "Multiple photos rejected for quality. Return trip required."
                            }
                        },
                        {
                            "id": "b",
                            "text": "Review each photo before leaving the property and retake any that are unclear",
                            "isCorrect": true,
                            "feedback": {
                                "title": "CORRECT: First-Time Pass Rate",
                                "message": "Success in field services comes from the \"First-Time Pass\" rate. Taking 30 extra seconds to verify quality saves the 30+ minutes of a return trip.",
                                "consequence": "All photos meet technical standards. Report accepted on first submission."
                            }
                        },
                        {
                            "id": "c",
                            "text": "Skip this property entirely and come back tomorrow when it''s sunny",
                            "isCorrect": false,
                            "feedback": {
                                "title": "VIOLATION: SLA Deadline",
                                "message": "Missing an SLA deadline means the report may be reassigned and your payment forfeited. Professional inspectors work in all weather conditions.",
                                "consequence": "You miss the 5:00 PM SLA. Report reassigned to another inspector."
                            }
                        }
                    ]
                }
            ]',
            '{
                "keyLesson": "Field services rewards routing efficiency, not cutting technical corners.",
                "coreRule": "A report without high-quality, verifiable photos is considered incomplete or fraudulent.",
                "audienceWarning": "Gig Workers: Speed got you here, but quality keeps you earning. This is forensic data collection, not pizza delivery."
            }',
            2
        );
    END IF;

END $$;

-- MODULE 2: Interactive Components
DO $$
DECLARE
    module2_id UUID;
    flashcard_section_id UUID;
    deck2_id UUID := gen_random_uuid();
    quiz_section_id UUID;
    scenario_section_id UUID;
BEGIN
    -- Get Module 2 ID
    SELECT id INTO module2_id FROM training_modules WHERE module_number = 2 LIMIT 1;

    IF module2_id IS NOT NULL THEN

        -- ========================================================================
        -- 1. CREATE SECTIONS
        -- ========================================================================

        -- Flashcards Section
        INSERT INTO module_sections (module_id, slug, section_type, title, description, estimated_duration_minutes, content, display_order)
        VALUES (module2_id, 'flashcards', 'flashcards', 'Module 2 Terminology', 'Master the language of work orders.', 15, jsonb_build_object('deck_id', deck2_id, 'card_count', 50), 10)
        ON CONFLICT (module_id, slug) DO UPDATE SET content = EXCLUDED.content
        RETURNING id INTO flashcard_section_id;

        -- Quiz Section
        INSERT INTO module_sections (module_id, slug, section_type, title, description, estimated_duration_minutes, content, is_required, passing_score, display_order)
        VALUES (module2_id, 'quiz', 'quiz', 'Work Order Verification', 'Test your ability to interpret instructions.', 20, jsonb_build_object('question_count', 15), true, 80, 20)
        ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title
        RETURNING id INTO quiz_section_id;

        -- Scenarios Section
        INSERT INTO module_sections (module_id, slug, section_type, title, description, estimated_duration_minutes, content, display_order)
        VALUES (module2_id, 'scenarios', 'scenario', 'Field Decisions', 'Practice real-world decision making.', 15, jsonb_build_object('component', 'InteractiveScenario', 'scenario_count', 4), 30)
        ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title;

        -- ========================================================================
        -- 2. FLASHCARDS
        -- ========================================================================

        -- Create Deck
        INSERT INTO flashcard_decks (id, section_id, title, description)
        VALUES (deck2_id, flashcard_section_id, 'Module 2: Work Order Terminology', 'Key terms and definitions for understanding work orders.')
        ON CONFLICT (id) DO NOTHING;

        -- Insert Cards
        INSERT INTO flashcards (deck_id, term, definition, category, display_order) VALUES
        (deck2_id, 'Work Order (WO)', 'A binding contract containing client requirements, access info, and the data collection script for a specific property.', 'Terminology', 1),
        (deck2_id, 'SLA (Service Level Agreement)', 'The deadline by which the inspection must be completed and submitted.', 'Procedural', 2),
        (deck2_id, 'PCR', 'Property Condition Report - The generic term for the form you fill out.', 'Terminology', 3),
        (deck2_id, 'No Contact', 'A strict rule often found in Bankruptcy orders prohibiting any interaction with the occupant.', 'Compliance', 4),
        (deck2_id, 'Occupancy Verification', 'An inspection type focused solely on determining if a property is occupied or vacant.', 'Terminology', 5),
        (deck2_id, 'Loss Draft Inspection', 'An inspection to verify the progress of repairs after an insurance claim.', 'Procedural', 6),
        (deck2_id, 'Drive-by', 'An exterior-only inspection where you do not need to exit the vehicle (though often you should for better photos).', 'Terminology', 7),
        (deck2_id, 'Cut List', 'A list of items (usually damages) that an insurance adjuster has approved for repair.', 'Terminology', 8),
        (deck2_id, 'Contact Card', 'A card left at the property requesting the occupant to call the mortgage company.', 'Procedural', 9),
        (deck2_id, 'FDCPA', 'Fair Debt Collection Practices Act - Federal law limiting what you can say to debtors.', 'Compliance', 10),
        (deck2_id, 'Mortgagor', 'The homeowner/borrower.', 'Terminology', 11),
        (deck2_id, 'Mortgagee', 'The lender/bank.', 'Terminology', 12),
        (deck2_id, 'First Time Vacant (FTV)', 'The first time a property is reported as vacant; requires extensive documentation.', 'Procedural', 13),
        (deck2_id, 'Secondary Address', 'A unit number or separate structure address that must be verified.', 'Terminology', 14),
        (deck2_id, 'QC (Quality Control)', 'The review process your report goes through before being sent to the client.', 'Procedural', 15),
        (deck2_id, 'Photo Metadata', 'Embedded data in a photo file proving the date, time, and GPS location.', 'Compliance', 16),
        (deck2_id, 'REO', 'Real Estate Owned - Property that has completed foreclosure and is owned by the bank.', 'Terminology', 17),
        (deck2_id, 'Pre-Foreclosure', 'The period where the borrower is in default but still owns the home.', 'Terminology', 18),
        (deck2_id, 'Gated Community', 'A restricted access area requiring a code or guard entry.', 'Procedural', 19),
        (deck2_id, 'Trespassing', 'Entering a property without a valid work order or contrary to "No Trespassing" signs (unless authorized).', 'Compliance', 20),
        (deck2_id, 'Lockbox', 'A secure box containing a key, allowing access to vacant properties.', 'Terminology', 21),
        (deck2_id, 'Master Key', 'A universal key (like an A389) that opens common locks in the industry.', 'Terminology', 22),
        (deck2_id, 'Bid/Estimate', 'A calculated cost to repair a damage or perform a service (like lawn cut).', 'Procedural', 23),
        (deck2_id, 'Cubic Yards (CY)', 'The standard unit of measurement for debris (3ft x 3ft x 3ft).', 'Terminology', 24),
        (deck2_id, 'Rush Order', 'An order with an accelerated timeframe, often less than 24 hours.', 'Compliacne', 25),
        (deck2_id, 'Re-open', 'An order sent back to you for corrections or missing information.', 'Procedural', 26),
        (deck2_id, 'Bad Address', 'An address that does not exist or cannot be located.', 'Terminology', 27),
        (deck2_id, 'Vacant Land', 'A lot with no structure on it.', 'Terminology', 28),
        (deck2_id, 'Utility Verification', 'Checking the meters to see if water/gas/electric are active.', 'Procedural', 29),
        (deck2_id, 'Sump Pump', 'A device in the basement to remove groundwater; critical to check in vacant homes.', 'Terminology', 30),
        (deck2_id, 'Mold vs. Discoloration', 'Inspectors report "discoloration" rather than "mold" to avoid liability without lab testing.', 'Compliance', 31),
        (deck2_id, 'Winterization', 'The process of draining pipes to prevent freezing in vacant homes.', 'Terminology', 32),
        (deck2_id, 'De-winterization', 'Restoring water service to a home for testing.', 'Terminology', 33),
        (deck2_id, 'Door Knock', 'Attempting contact with the occupant (unless prohibited).', 'Procedural', 34),
        (deck2_id, 'Curtain/Blinds Check', 'Looking through windows to determine vacancy status (never enter unless authorized).', 'Compliance', 35),
        (deck2_id, 'For Sale Sign', 'A strong indicator of potential vacancy or change in ownership.', 'Terminology', 36),
        (deck2_id, 'Active Listing', 'A property currently on the market; usually requires contacting the agent.', 'Terminology', 37),
        (deck2_id, 'Broker Price Opinion (BPO)', 'A valuation report usually done by realtors, but sometimes inspectors provide photos for it.', 'Procedural', 38),
        (deck2_id, 'Personally Identifiable Information (PII)', 'Data like social security numbers or loan papers found in homes; do not photograph closely.', 'Compliance', 39),
        (deck2_id, 'Mechanism of Damage', 'The cause of the damage (e.g., wind, fire, vandalism).', 'Terminology', 40),
        (deck2_id, 'Consequential Damage', 'Damage resulting from the initial failure (e.g., mold from a pipe burst).', 'Terminology', 41),
        (deck2_id, 'Date of Loss', 'The specific date damage occurred (critical for insurance claims).', 'Procedural', 42),
        (deck2_id, 'Depreciation', 'The loss of value over time; usually irrelevant to your report but good to understand.', 'Terminology', 43),
        (deck2_id, 'Safety Hazard', 'Anything posing immediate risk (exposed wire, hole in floor); must be reported immediately.', 'Compliance', 44),
        (deck2_id, 'Verification of Occupancy (VO)', 'Another term for Occupancy Inspection.', 'Terminology', 45),
        (deck2_id, 'Batching', 'Grouping nearby orders to complete them in one efficient trip.', 'Procedural', 46),
        (deck2_id, 'Turnaround Time (TAT)', 'The time measuring your speed from receipt to submission.', 'Terminology', 47),
        (deck2_id, 'Status Update', 'Sending a quick note to the coordinator if an order is delayed.', 'Procedural', 48),
        (deck2_id, 'Code Violation', 'A notice posted by the city regarding ordinance violations (grass, trash).', 'Compliance', 49),
        (deck2_id, 'Field Service Provider (FSP)', 'The company you work for (or you, if independent).', 'Terminology', 50);

        -- ========================================================================
        -- 3. QUIZ QUESTIONS
        -- ========================================================================

        INSERT INTO quiz_questions (module_id, question_number, question_type, question_text, options, correct_answer, explanation) VALUES
        (module2_id, 1, 'multiple-choice', 'What is the FIRST thing you should check on a work order?', '["The pay rate", "The SLA / Due Date", "The occupant name", "The distance from your house"]', '1', 'Checking the SLA allows you to prioritize effectively. A high-pay order is useless if it was due yesterday.'),
        (module2_id, 2, 'multiple-choice', 'What does "Bankruptcy - No Contact" mean?', '["You can knock but not call", "You can verify occupancy visually but must NOT disturb the occupant", "You cannot go to the property at all", "You must ask neighbors for info"]', '1', 'Bankruptcy laws strictly prohibit harassment. "No Contact" means exactly that—do not knock, do not leave a card.'),
        (module2_id, 3, 'multiple-choice', 'You find conflicting instructions: The header says "Exterior Only" but the comments say "Call from porch". What do you do?', '["Follow the header (Exterior Only)", "Follow the comments (Call)", "Do both", "Call your coordinator for clarification"]', '3', 'When instructions conflict, you must get clarification to avoid a violation. Never guess.'),
        (module2_id, 4, 'true-false', 'It is acceptable to inspect a property 2 days after the SLA if you call the coordinator first.', '["True", "False"]', '1', 'False. While communication is good, missing an SLA is a performance failure. The bank''s deadline is federal; they cannot extend it easily.'),
        (module2_id, 5, 'multiple-choice', 'Which section of the work order typically contains the Gate Code?', '["The Header", "The Footer", "Comments / Access Info", "The Pricing Section"]', '2', 'Access codes are usually buried in the "Comments" or "Access Info" text blocks.'),
        (module2_id, 6, 'multiple-choice', 'What is a "Loss Draft" inspection?', '["An inspection of a lost check", "Verifying repairs after an insurance claim", "Checking for drafty windows", "A foreclosure inspection"]', '1', 'Loss Drafts track the progress of contractor repairs paid for by insurance funds.'),
        (module2_id, 7, 'scenario', 'You arrive at a property for an "Occupancy Check". The grass is 2 feet tall, but a new car is in the driveway. What do you conclude?', '["The property is vacant", "The property is occupied", "Cannot determine (verify other indicators)", "The car is abandoned"]', '2', 'Never assume. A car could belong to a neighbor or be abandoned. Check meters, mail, and look through windows (from outside) to confirm.'),
        (module2_id, 8, 'multiple-choice', 'Why is the "Order #" important?', '["It determines your pay", "It acts as the unique ID for support and file naming", "It tells you the lockbox code", "It isn''t important"]', '1', 'The Order # is the unique identifier. Using the wrong one can result in uploading photos to the wrong case.'),
        (module2_id, 9, 'true-false', 'You should always explain your findings to the homeowner if they ask.', '["True", "False"]', '1', 'False. Your client is the bank, not the homeowner. You are there to document, not to report findings to the occupant.'),
        (module2_id, 10, 'multiple-choice', 'What should you do if the address on the house doesn''t match the work order?', '["Inspect it anyway, it''s probably the right house", "Call the homeowner", "Stop, verify with maps, and contact support", "Write the correct number on the form"]', '2', 'Inspecting the wrong house is a major liability. Stop immediately and verify.'),
        (module2_id, 11, 'multiple-choice', 'What constitutes "Contact" with a mortgagor?', '["Speaking face-to-face", "Leaving a card", "Speaking on the phone", "All of the above"]', '3', 'Any interaction, direct or indirect, counts as contact attempts.'),
        (module2_id, 12, 'multiple-choice', 'Which of these is a "Compliance Flag"?', '["Grass is green", "House number visible", "Safety Hazard Present", "Sky is blue"]', '2', 'Safety hazards are compliance issues that must be reported immediately.'),
        (module2_id, 13, 'true-false', 'You can use yesterday''s photos if you forgot to upload them and went back today.', '["True", "False"]', '1', 'False. Photos must be time-stamped with the CURRENT date of visitation. Re-using old photos is fraud.'),
        (module2_id, 14, 'multiple-choice', 'What is the "Scope" of a drive-by inspection?', '["Street view only", "Street view + Front of house + Address", "Interior and Exterior", "Roof only"]', '1', 'Standard drive-by scope includes verification of the property from the public right-of-way.'),
        (module2_id, 15, 'scenario', 'The work order requires a photo of the rear of the house, but a 6ft locked fence blocks access. What do you do?', '["Climb the fence", "Kick the gate open", "Take a photo of the locked gate/fence to prove lack of access", "Mark it as complete without the photo"]', '2', 'Never force entry. Document the obstruction to justify why the required photo is missing.');

        -- ========================================================================
        -- 4. SCENARIOS (Data insertion for dynamic scenarios)
        -- ========================================================================
        
        INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES
        (
          module2_id,
          'The "Friendly" Neighbor',
          'Dealing with nosy neighbors.',
          'realtor',
          'User',
          'amber',
          '{
            "character": "You",
            "background": "A field inspector documenting a vacant property.",
            "context": "You are photographing a vacant house. A neighbor walks over.",
            "complication": "Asking questions about the sale.",
            "instinct": "To be helpful."
          }',
          '[
            {
              "id": "response",
              "question": "The neighbor asks: \"Is the bank finally selling this place? I want to buy it.\"",
              "options": [
                 { "id": "a", "text": "Tell him yes, it is a foreclosure and he should call the bank.", "isCorrect": false, "feedback": { "title": "Privacy Violation", "message": "Never disclose foreclosure status.", "consequence": "Liability." } },
                 { "id": "b", "text": "Ignore him and keep working.", "isCorrect": false, "feedback": { "title": "Rude", "message": "Being rude creates enemies.", "consequence": "Potential confrontation." } },
                 { "id": "c", "text": "Smile and say, \"I''m just documenting the condition. I don''t have sale info.\"", "isCorrect": true, "feedback": { "title": "Correct", "message": "Professional and discreet.", "consequence": "Situation de-escalated." } }
              ]
            }
          ]',
          '{
            "keyLesson": "Discretion is key.",
            "coreRule": "Never reveal client info.",
            "audienceWarning": "Neighbors are not clients."
          }',
          1
        ),
        (
          module2_id,
          'The Wrong Address Trap',
          'Navigating ambiguous addressing.',
          'gig-worker',
          'Map',
          'blue',
          '{
            "character": "You",
            "background": "Rural inspection.",
            "context": "GPS takes you to dirt road.",
            "complication": "No house number visible.",
            "instinct": "To guess."
          }',
          '[
            {
              "id": "action",
              "question": "You see a mailbox marked 120, work order is 124. What do you do?",
              "options": [
                 { "id": "a", "text": "Drive down unmarked path.", "isCorrect": false, "feedback": { "title": "Trespassing Risk", "message": "Guessing is dangerous.", "consequence": "Possible legal trouble." } },
                 { "id": "b", "text": "Mark Unable to Locate and leave.", "isCorrect": false, "feedback": { "title": "Lazy", "message": "Not enough effort.", "consequence": "Unpaid trip." } },
                 { "id": "c", "text": "Check secondary map (GIS) or find neighbor.", "isCorrect": true, "feedback": { "title": "Due Diligence", "message": "Use all tools.", "consequence": "Correct property found." } }
              ]
            }
          ]',
          '{
            "keyLesson": "Verify before entry.",
            "coreRule": "GPS is often wrong.",
            "audienceWarning": "Wrong address = $0 pay."
          }',
          2
        );
    
    END IF;

END $$;
