-- ============================================================================
-- MODULE 2: Understanding the Work Order - INTERACTIVE COMPONENTS
-- Refactored to use EXISTING table structure
-- ============================================================================

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

END $$;
