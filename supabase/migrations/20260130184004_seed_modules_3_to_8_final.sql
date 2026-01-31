-- Migration: Seed Interactive Content for Modules 3-8
-- Description: Populates flashcards, scenarios, and quiz questions for Modules 3-8
-- Fixes: Aligns with strictly enforced schema (slugs, JSON scenarios, etc.)

-- ============================================================================
-- MODULE 3: First Occupancy & Loss Draft Inspections
-- ============================================================================
DO $$
DECLARE
    v_module_id UUID;
    v_section_id UUID;
    v_deck_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO v_module_id FROM training_modules WHERE module_number = 3;
    
    IF v_module_id IS NOT NULL THEN
        -- 1. CLEANUP (Idempotency)
        DELETE FROM quiz_questions WHERE module_id = v_module_id;
        DELETE FROM scenarios WHERE module_id = v_module_id;
        DELETE FROM flashcards WHERE deck_id IN (
            SELECT id FROM flashcard_decks WHERE section_id IN (
                SELECT id FROM module_sections WHERE module_id = v_module_id
            )
        );
        DELETE FROM flashcard_decks WHERE section_id IN (
            SELECT id FROM module_sections WHERE module_id = v_module_id
        );
        -- We delete sections last to avoid FK issues
        DELETE FROM module_sections WHERE module_id = v_module_id;

        -- 2. CREATE SECTIONS
        -- Core Concepts (Flashcards holder)
        INSERT INTO module_sections (module_id, slug, section_type, title, description, estimated_duration_minutes, content, display_order)
        VALUES (v_module_id, 'module-3-flashcards', 'flashcards', 'Core Concepts', 'Key terms for occupancy and loss drafts.', 10, jsonb_build_object('deck_id', v_deck_id), 1)
        RETURNING id INTO v_section_id;

        -- 3. FLASHCARDS
        INSERT INTO flashcard_decks (id, section_id, title, description)
        VALUES (v_deck_id, v_section_id, 'Module 3 Terminology', 'Occupancy and Loss Draft Terms');

        INSERT INTO flashcards (deck_id, term, definition, category, display_order) VALUES
        (v_deck_id, 'Occupancy Verification', 'The process of determining if a property is inhabited, vacant, or abandoned based on visual evidence.', 'Core', 1),
        (v_deck_id, 'Loss Draft', 'An inspection to verify the percentage of completion for insurance-funded repairs.', 'Types', 2),
        (v_deck_id, 'Visual External', 'Evidence seen from the street (e.g., tall grass), considered weak evidence.', 'Evidence', 3),
        (v_deck_id, 'Visual Internal', 'Evidence seen through a window (e.g., empty rooms), considered strong evidence.', 'Evidence', 4),
        (v_deck_id, 'Scope Creep', 'When a project grows beyond its original requirements; inspectors must stick to the provided scope.', 'Management', 5);

        -- 4. SCENARIOS (Complex JSON)
        INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES (
            v_module_id, 
            'The Ambiguous Vacancy', 
            'Conflicting Signals', 
            'gig-worker', 
            'Home', 
            'amber',
            '{
                "character": "You",
                "background": "Inspector performing a standard occupancy check.",
                "context": "You arrive at a property. The grass is 12 inches tall (Vacant sign). But you hear a dog barking inside (Occupied sign).",
                "complication": "Conflicting visual and audio cues.",
                "instinct": "To assume the grass means vacancy."
            }',
            '[
                {
                    "id": "determination",
                    "question": "What is your determination?",
                    "options": [
                        {
                            "id": "a", 
                            "text": "Mark as Vacant (Grass is definitive)", 
                            "isCorrect": false, 
                            "feedback": { "title": "Incorrect", "message": "A dog implies life. The grass just means they are lazy or unable to mow.", "consequence": "You risked a confrontation." } 
                        },
                        {
                            "id": "b", 
                            "text": "Mark as Occupied", 
                            "isCorrect": true, 
                            "feedback": { "title": "Correct", "message": "A barking dog is a strong audio indicator of occupancy. Do not enter.", "consequence": "Safe and accurate determination." } 
                        },
                        {
                            "id": "c", 
                            "text": "Enter the backyard to check", 
                            "isCorrect": false, 
                            "feedback": { "title": "Dangerous", "message": "Beware of Dog signs or sounds are a hard stop. Never enter yard with loose/barking dog.", "consequence": "Safety hazard." } 
                        }
                    ]
                }
            ]',
            '{
                "keyLesson": "Audio cues often trump weak visual cues.",
                "coreRule": "Safety first: Barking dogs = Occupied/Inaccessible.",
                "audienceWarning": "Never assume vacancy based on lawn care alone."
            }',
            1
        );

        -- 5. QUIZ
        -- Create Quiz Section
        INSERT INTO module_sections (module_id, slug, section_type, title, description, estimated_duration_minutes, content, display_order)
        VALUES (v_module_id, 'module-3-quiz', 'quiz', 'Module 3 Assessment', 'Test your knowledge.', 15, '{"question_count": 5}', 5);

        INSERT INTO quiz_questions (module_id, question_number, question_type, question_text, options, correct_answer, explanation) VALUES
        (v_module_id, 1, 'multiple-choice', 
         'What is the most reliable indicator that a property is truly vacant?', 
         '["No one answers the door", "Tall grass", "Visual verification of empty interior through window AND removed utility meter", "A For Sale sign in the yard"]', 
         '2', 
         'Visual Internal (seeing an empty room) is factual proof. Grass, newspapers, and hearsay are circumstantial.'),
         
        (v_module_id, 2, 'multiple-choice', 
         'If you see bundles of shingles in the driveway but the roof has not been touched, what is the completion percentage for a Loss Draft?', 
         '["0%", "10-20% (Materials on site)", "50% (Started)", "100%"]', 
         '1', 
         'Materials on site counts as progress! It proves intent to repair. Credit 10-20%.'),
         
        (v_module_id, 3, 'multiple-choice', 
         'Why is "See Photos" a bad comment in a report?', 
         '["It hurts the reviewers feelings", "It forces the reviewer to guess what they are looking at", "It costs extra data", "It is illegal"]', 
         '1', 
         'QA reviewers view hundreds of homes. Guide them to what you want them to see with descriptive text.');

    END IF;
END $$;


-- ============================================================================
-- MODULE 4: Technical Photography Mastery
-- ============================================================================
DO $$
DECLARE
    v_module_id UUID;
    v_section_id UUID;
    v_deck_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO v_module_id FROM training_modules WHERE module_number = 4;
    
    IF v_module_id IS NOT NULL THEN
        -- CLEANUP
        DELETE FROM quiz_questions WHERE module_id = v_module_id;
        DELETE FROM scenarios WHERE module_id = v_module_id;
        DELETE FROM flashcards WHERE deck_id IN (
            SELECT id FROM flashcard_decks WHERE section_id IN (
                SELECT id FROM module_sections WHERE module_id = v_module_id
            )
        );
        DELETE FROM flashcard_decks WHERE section_id IN (
            SELECT id FROM module_sections WHERE module_id = v_module_id
        );
        DELETE FROM module_sections WHERE module_id = v_module_id;

        -- SECTIONS
        INSERT INTO module_sections (module_id, slug, section_type, title, description, estimated_duration_minutes, content, display_order)
        VALUES (v_module_id, 'module-4-flashcards', 'flashcards', 'Photography Specs', 'Camera settings and requirements.', 10, jsonb_build_object('deck_id', v_deck_id), 1)
        RETURNING id INTO v_section_id;

        -- FLASHCARDS
        INSERT INTO flashcard_decks (id, section_id, title, description)
        VALUES (v_deck_id, v_section_id, 'Module 4 Camera Specs', 'Technical terms for inspection photos');

        INSERT INTO flashcards (deck_id, term, definition, category, display_order) VALUES
        (v_deck_id, 'EXIF Data', 'Metadata embedded in a photo file containing date, time, and GPS coordinates.', 'Tech', 1),
        (v_deck_id, 'Street Scene', 'A wide shot showing the property in context with neighbors; establishes location.', 'Shots', 2),
        (v_deck_id, 'W-M-T Rule', 'Wide, Medium, Tight. The three photo angles required for every major damage.', 'Shots', 3),
        (v_deck_id, 'Motion Blur', 'Distortion caused by moving the camera while the shutter is open.', 'Errors', 4);

        -- SCENARIO
        INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES (
            v_module_id, 
            'Basement in the Dark', 
            'Lighting Challenges', 
            'gig-worker', 
            'Home', 
            'blue',
            '{
                "character": "Alex",
                "background": "Inspector.",
                "context": "Inspecting a basement with no electricity.",
                "complication": "It is pitch black. Phone flash is too weak.",
                "instinct": "Just take the photo and fix it in post."
            }',
            '[
                {
                    "id": "lighting",
                    "question": "How do you handle the lighting?",
                    "options": [
                        {
                            "id": "a", 
                            "text": "Use the built-in flash only", 
                            "isCorrect": false, 
                            "feedback": { "title": "Too Dark", "message": "Phone flashes illuminate dust, not rooms.", "consequence": "Photo rejected (Pitch Black)." } 
                        },
                        {
                            "id": "b", 
                            "text": "Bring a powerful external flashlight (Lumens matter)", 
                            "isCorrect": true, 
                            "feedback": { "title": "Correct", "message": "Painting with light using a tactic flashlight is the pro move.", "consequence": "Perfectly lit photo." } 
                        },
                        {
                            "id": "c", 
                            "text": "Skip the basement photos", 
                            "isCorrect": false, 
                            "feedback": { "title": "Incomplete", "message": "You cannot skip required rooms.", "consequence": "Return trip required." } 
                        }
                    ]
                }
            ]',
            '{
                "keyLesson": "Always carry a high-lumen flashlight.",
                "coreRule": "If you can''t see it, the camera can''t see it.",
                "audienceWarning": "Dark photos are the #1 reason for rejections."
            }',
            1
        );

        -- QUIZ
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-4-quiz', 'quiz', 'Module 4 Assessment', 'Test your photo knowledge.', '{"question_count": 3}', 5);

        INSERT INTO quiz_questions (module_id, question_number, question_type, question_text, options, correct_answer, explanation) VALUES
        (v_module_id, 1, 'multiple-choice', 
         'What does the "W" in W-M-T stand for?', 
         '["Width", "Wide", "White Balance", "Window"]', 
         '1', 
         'Wide: Establish context first.'),
        (v_module_id, 2, 'true-false', 
         'You can use photo editing software to brighten a dark photo before uploading.', 
         '["True", "False"]', 
         '1', 
         'False. Editing photos (altering pixels) is often considered fraud/manipulation. The original EXIF data must be preserved.'),
        (v_module_id, 3, 'multiple-choice', 
         'Which photo is REQUIRED to prove you visited the correct house?', 
         '["The kitchen", "The bathroom", "The House Number / Address Block", "The roof"]', 
         '2', 
         'The address photo acts as the title page for your report.');

    END IF;
END $$;


-- ============================================================================
-- MODULE 5: Creating the Perfect Report
-- ============================================================================
DO $$
DECLARE
    v_module_id UUID;
    v_section_id UUID;
    v_deck_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO v_module_id FROM training_modules WHERE module_number = 5;
    
    IF v_module_id IS NOT NULL THEN
        -- CLEANUP
        DELETE FROM quiz_questions WHERE module_id = v_module_id;
        DELETE FROM scenarios WHERE module_id = v_module_id;
        DELETE FROM flashcards WHERE deck_id IN (
            SELECT id FROM flashcard_decks WHERE section_id IN (
                SELECT id FROM module_sections WHERE module_id = v_module_id
            )
        );
        DELETE FROM flashcard_decks WHERE section_id IN (
            SELECT id FROM module_sections WHERE module_id = v_module_id
        );
        DELETE FROM module_sections WHERE module_id = v_module_id;

        -- SECTIONS
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-5-flashcards', 'flashcards', 'Report Writing', 'Terms for narrative excellence.', jsonb_build_object('deck_id', v_deck_id), 1)
        RETURNING id INTO v_section_id;

        -- FLASHCARDS
        INSERT INTO flashcard_decks (id, section_id, title, description)
        VALUES (v_deck_id, v_section_id, 'Module 5 Reporting', 'Writing Professional Reports');

        INSERT INTO flashcards (deck_id, term, definition, category, display_order) VALUES
        (v_deck_id, 'Objective Language', 'Stating facts without emotion or opinion (e.g., "Wall has 2ft hole" vs "Wall looks terrible").', 'Writing', 1),
        (v_deck_id, 'Bid Item', 'A specific line item request for payment to fix a damage.', 'Bidding', 2),
        (v_deck_id, 'Justification', 'The "Why" behind a bid. Why is this repair needed now?', 'Bidding', 3),
        (v_deck_id, 'PCR', 'Property Condition Report - The final output.', 'Terminology', 4);

         -- SCENARIO
        INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES (
            v_module_id, 
            'The Angry Contractor', 
            'Defending Your Bid', 
            'realtor', 
            'User', 
            'rose',
            '{
                "character": "You",
                "background": "Inspector submitting a bid for roof repair.",
                "context": "Reviewer rejects your bid saying ''Too Expensive''.",
                "complication": "You know the steep pitch requires extra safety gear.",
                "instinct": "To get angry."
            }',
            '[
                {
                    "id": "response",
                    "question": "How do you respond to the rejection?",
                    "options": [
                        {
                            "id": "a", 
                            "text": "Resubmit lower price to just get it done", 
                            "isCorrect": false, 
                            "feedback": { "title": "Loss", "message": "You will lose money on the job.", "consequence": "Financial loss." } 
                        },
                        {
                            "id": "b", 
                            "text": "Add a detailed note explaining the ''Steep Charge'' and cost of safety harness/ropes", 
                            "isCorrect": true, 
                            "feedback": { "title": "Justification", "message": "Reviewers approve costs when they understand the WHY.", "consequence": "Bid approved." } 
                        },
                        {
                            "id": "c", 
                            "text": "Call them and yell", 
                            "isCorrect": false, 
                            "feedback": { "title": "Unprofessional", "message": "Never yell.", "consequence": "Account flagged." } 
                        }
                    ]
                }
            ]',
            '{
                "keyLesson": "You must justify every dollar.",
                "coreRule": "If it isn''t in the notes, it doesn''t exist.",
                "audienceWarning": "Reviewers are not at the property. You are their eyes."
            }',
            1
        );

        -- QUIZ
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-5-quiz', 'quiz', 'Module 5 Assessment', 'Test your reporting skills.', '{"question_count": 3}', 5);

        INSERT INTO quiz_questions (module_id, question_number, question_type, question_text, options, correct_answer, explanation) VALUES
        (v_module_id, 1, 'multiple-choice', 
         'Which sentence is better?', 
         '["The roof is super old and ugly.", "The roof shingles show signs of granular loss and cupping consistent with approx 15 years of age."]', 
         '1', 
         'The second option is factual and specific. The first is subjective opinion.'),
        (v_module_id, 2, 'multiple-choice', 
         'What are the 3 Ws of a Damage Report?', 
         '["Who, Where, Why", "What, Where, Quantity", "When, Will, Was", "Water, Wind, Wumbo"]', 
         '1', 
         'What is it? Where is it? How much of it is there? (Quantity/Dimensions).');

    END IF;
END $$;

-- ============================================================================
-- MODULE 6: Damage Detection
-- ============================================================================
DO $$
DECLARE
    v_module_id UUID;
    v_section_id UUID;
    v_deck_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO v_module_id FROM training_modules WHERE module_number = 6;
    
    IF v_module_id IS NOT NULL THEN
        -- CLEANUP
        DELETE FROM quiz_questions WHERE module_id = v_module_id;
        DELETE FROM scenarios WHERE module_id = v_module_id;
        DELETE FROM flashcards WHERE deck_id IN (
            SELECT id FROM flashcard_decks WHERE section_id IN (
                SELECT id FROM module_sections WHERE module_id = v_module_id
            )
        );
        DELETE FROM flashcard_decks WHERE section_id IN (
            SELECT id FROM module_sections WHERE module_id = v_module_id
        );
        DELETE FROM module_sections WHERE module_id = v_module_id;

        -- SECTIONS
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-6-flashcards', 'flashcards', 'Damage Terms', 'Identify damages correctly.', jsonb_build_object('deck_id', v_deck_id), 1)
        RETURNING id INTO v_section_id;

        -- FLASHCARDS
        INSERT INTO flashcard_decks (id, section_id, title, description)
        VALUES (v_deck_id, v_section_id, 'Module 6 Damage ID', 'Identifying common property damages');

        INSERT INTO flashcards (deck_id, term, definition, category, display_order) VALUES
        (v_deck_id, 'Freeze Break', 'Pipes that have burst due to expanding ice; looking for longitudinal cracks.', 'Plumbing', 1),
        (v_deck_id, 'Seepage', 'Slow water intrusion usually in basements.', 'Water', 2),
        (v_deck_id, 'Roof Cupping', 'Shingles curling upward at the edges, indicating age/heat damage.', 'Roof', 3),
        (v_deck_id, 'Vandalism', 'Intentional damage by people (graffiti, broken glass).', 'Types', 4);

        -- SCENARIO
        INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES (
            v_module_id, 
            'The Hidden Leak', 
            'Source Identification', 
            'gig-worker', 
            'Home', 
            'blue',
            '{
                "character": "You",
                "background": "Inspector checking visible water stain on ceiling.",
                "context": "There is a stain on the living room ceiling.",
                "complication": "You can''t tell if it is active or old.",
                "instinct": "Mark it as cosmetic and move on."
            }',
            '[
                {
                    "id": "action",
                    "question": "What is the best way to verify?",
                    "options": [
                        {
                            "id": "a", 
                            "text": "Touch it (if reachable) or use moisture meter, and check the room above.", 
                            "isCorrect": true, 
                            "feedback": { "title": "Correct", "message": "Investigate the SOURCE. Is it the roof? The bathroom upstairs?", "consequence": "Source identified as toilet leak." } 
                        },
                        {
                            "id": "b", 
                            "text": "Just photograph it", 
                            "isCorrect": false, 
                            "feedback": { "title": "Incomplete", "message": "Photos show the result, not the cause.", "consequence": "Report returned for more info." } 
                        }
                    ]
                }
            ]',
            '{
                "keyLesson": "Find the source, not just the symptom.",
                "coreRule": "Water follows gravity.",
                "audienceWarning": "Unreported leaks cause thousands in mold damage."
            }',
            1
        );
        
        -- QUIZ
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-6-quiz', 'quiz', 'Module 6 Assessment', 'Test damage ID skills.', '{"question_count": 3}', 5);

        INSERT INTO quiz_questions (module_id, question_number, question_type, question_text, options, correct_answer, explanation) VALUES
        (v_module_id, 1, 'multiple-choice', 
         'What distinguishes a "Freeze Break" from other pipe damage?', 
         '["The pipes are cold", "The split runs lengthwise (longitudinally) along the pipe", "The pipe is missing", "It only happens in Alaska"]', 
         '1', 
         'Water expands when freezing, splitting the copper/pvc lengthwise.'),
        (v_module_id, 2, 'multiple-choice', 
         'Mold requires what 3 things to grow?', 
         '["Moisture, Organic Material, Warmth/Spores", "Light, Soil, Water", "Sugar, Spice, Everything Nice", "None of the above"]', 
         '0', 
         'Eliminate moisture, and you eliminate the mold.');

    END IF;
END $$;

-- ============================================================================
-- MODULE 7: Professional Communication
-- ============================================================================
DO $$
DECLARE
    v_module_id UUID;
    v_section_id UUID;
    v_deck_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO v_module_id FROM training_modules WHERE module_number = 7;
    
    IF v_module_id IS NOT NULL THEN
        -- CLEANUP
         DELETE FROM quiz_questions WHERE module_id = v_module_id;
        DELETE FROM scenarios WHERE module_id = v_module_id;
        DELETE FROM flashcards WHERE deck_id IN (
            SELECT id FROM flashcard_decks WHERE section_id IN (
                SELECT id FROM module_sections WHERE module_id = v_module_id
            )
        );
        DELETE FROM flashcard_decks WHERE section_id IN (
            SELECT id FROM module_sections WHERE module_id = v_module_id
        );
        DELETE FROM module_sections WHERE module_id = v_module_id;

        -- SECTIONS
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-7-flashcards', 'flashcards', 'Communication Terms', 'Speaking to homeowners.', jsonb_build_object('deck_id', v_deck_id), 1)
        RETURNING id INTO v_section_id;

        -- FLASHCARDS
        INSERT INTO flashcard_decks (id, section_id, title, description)
        VALUES (v_deck_id, v_section_id, 'Module 7 Soft Skills', 'De-escalation and professionalism');

        INSERT INTO flashcards (deck_id, term, definition, category, display_order) VALUES
        (v_deck_id, 'De-escalation', 'Reducing the intensity of a conflict through calm voice and listening.', 'Soft Skills', 1),
        (v_deck_id, 'Pivot', 'Acknowledging a question but steering back to your allowed script.', 'Technique', 2),
        (v_deck_id, 'Empathy', 'Showing you understand their frustration without admitting fault.', 'Soft Skills', 3);

        -- SCENARIO
         INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES (
            v_module_id, 
            'The Helpful Neighbor', 
            'Privacy Boundaries', 
            'realtor', 
            'User', 
            'amber',
            '{
                "character": "You",
                "background": "Inspector at a vacant house.",
                "context": "Neighbor asks ''What happened to the Johnsons? Did they go bust?''",
                "complication": "You might know, but can''t say.",
                "instinct": "To gossip."
            }',
            '[
                {
                    "id": "response",
                    "question": "What do you say?",
                    "options": [
                        {
                            "id": "a", 
                            "text": "Tell them the house is in foreclosure.", 
                            "isCorrect": false, 
                            "feedback": { "title": "Privacy Violation", "message": "Illegal disclosure of private info.", "consequence": "Lawsuit." } 
                        },
                        {
                            "id": "b", 
                            "text": "Say ''I am just here to check the condition of the building, I don''t have info on the owners.''", 
                            "isCorrect": true, 
                            "feedback": { "title": "Correct", "message": "Polite but firm boundary.", "consequence": "Neighbor satisfied enough." } 
                        }
                    ]
                }
            ]',
            '{
                "keyLesson": "Privacy is paramount.",
                "coreRule": "Never discuss the borrower/owner status.",
                "audienceWarning": "Neighbors talk to owners."
            }',
            1
        );

         -- QUIZ
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-7-quiz', 'quiz', 'Module 7 Assessment', 'Test communication skills.', '{"question_count": 3}', 5);

        INSERT INTO quiz_questions (module_id, question_number, question_type, question_text, options, correct_answer, explanation) VALUES
        (v_module_id, 1, 'multiple-choice', 
         'What is the best way to handle an aggressive homeowner?', 
         '["Yell back", "Leave immediately", "Calmly explain you will leave if they wish, and document the refusal", "Call the police"]', 
         '2', 
         'If safety is threatened, leave. Documenting the refusal is the professional step before leaving, but safety is #1.');

    END IF;
END $$;

-- ============================================================================
-- MODULE 8: Scaling & Career
-- ============================================================================
DO $$
DECLARE
    v_module_id UUID;
    v_section_id UUID;
    v_deck_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO v_module_id FROM training_modules WHERE module_number = 8;
    
    IF v_module_id IS NOT NULL THEN
        -- CLEANUP
        DELETE FROM quiz_questions WHERE module_id = v_module_id;
        DELETE FROM scenarios WHERE module_id = v_module_id;
        DELETE FROM flashcards WHERE deck_id IN (
            SELECT id FROM flashcard_decks WHERE section_id IN (
                SELECT id FROM module_sections WHERE module_id = v_module_id
            )
        );
        DELETE FROM flashcard_decks WHERE section_id IN (
            SELECT id FROM module_sections WHERE module_id = v_module_id
        );
        DELETE FROM module_sections WHERE module_id = v_module_id;

        -- SECTIONS
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-8-flashcards', 'flashcards', 'Business Terms', 'Scaling your business.', jsonb_build_object('deck_id', v_deck_id), 1)
        RETURNING id INTO v_section_id;

        -- FLASHCARDS
        INSERT INTO flashcard_decks (id, section_id, title, description)
        VALUES (v_deck_id, v_section_id, 'Module 8 Business', 'Scaling to Agency Level');

        INSERT INTO flashcards (deck_id, term, definition, category, display_order) VALUES
        (v_deck_id, 'Subcontractor', 'An inspector you hire to complete work under your contract.', 'Business', 1),
        (v_deck_id, 'E&O Insurance', 'Errors and Omissions insurance; protects against liability for mistakes.', 'Insurance', 2),
        (v_deck_id, 'Volume', 'The number of orders you can handle; the key to profitability.', 'Metrics', 3);

        -- SCENARIO
         INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
        VALUES (
            v_module_id, 
            'Subcontractor Dilemma', 
            'Quality Control', 
            'realtor', 
            'User', 
            'green',
            '{
                "character": "You",
                "background": "Business owner.",
                "context": "Your new hire submitted photos that look fake.",
                "complication": "It is late and the order is due.",
                "instinct": "To submit it anyway to get paid.",
                "instinct": "Submit and hope."
            }',
            '[
                {
                    "id": "action",
                    "question": "What do you do?",
                    "options": [
                        {
                            "id": "a", 
                            "text": "Submit it. It''s probably fine.", 
                            "isCorrect": false, 
                            "feedback": { "title": "Fraud Risk", "message": "You are liable for your sub''s fraud.", "consequence": "Contract terminated." } 
                        },
                        {
                            "id": "b", 
                            "text": "Reject the work and go do it yourself.", 
                            "isCorrect": true, 
                            "feedback": { "title": "Correct", "message": "Protect your reputation at all costs.", "consequence": "Order late, but quality maintained." } 
                        }
                    ]
                }
            ]',
            '{
                "keyLesson": "You are responsible for your subs.",
                "coreRule": "Verify everything.",
                "audienceWarning": "One bad apple spoils the contract."
            }',
            1
        );

         -- QUIZ
        INSERT INTO module_sections (module_id, slug, section_type, title, description, content, display_order)
        VALUES (v_module_id, 'module-8-quiz', 'quiz', 'Module 8 Assessment', 'Test business knowledge.', '{"question_count": 3}', 5);

        INSERT INTO quiz_questions (module_id, question_number, question_type, question_text, options, correct_answer, explanation) VALUES
        (v_module_id, 1, 'multiple-choice', 
         'What is the biggest risk when hiring subcontractors?', 
         '["They eat your lunch", "Quality Control / Fraud", "They drive better cars", "None"]', 
         '1', 
         'You are liable for their work. If they fake photos, you get fired.');

    END IF;
END $$;
