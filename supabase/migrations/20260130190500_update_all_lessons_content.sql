-- Update Lessons for Modules 4-8 (Module 3 was fixed in previous migration)

-- ============================================================================
-- MODULE 4
-- ============================================================================
UPDATE training_lessons 
SET estimated_minutes = 12,
    content = jsonb_set(
        content::jsonb, 
        '{sections,0,steps}', 
        '[
            {"number": 1, "title": "Street Scene", "content": "Take a wide shot showing the house numbers of neighbors if possible."},
            {"number": 2, "title": "Front View", "content": "Get the FULL house. Ground to roof."},
            {"number": 3, "title": "Address", "content": "Close up of the mailbox or house number."},
            {"number": 4, "title": "Left Side", "content": "Stand at the corner to get the depth."},
            {"number": 5, "title": "Rear View", "content": "Full rear view. Watch for dogs."},
            {"number": 6, "title": "Right Side", "content": "Complete the circle."}
        ]'::jsonb
    )
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 4) AND lesson_number = 2;

-- ============================================================================
-- MODULE 5
-- ============================================================================
UPDATE training_lessons 
SET estimated_minutes = 15,
    content = jsonb_set(
        content::jsonb, 
        '{sections,1,steps}', 
        '[
            {"number": 1, "title": "Go to IRS.gov", "content": "Search for ''Apply for EIN Online''. It is a free government service."},
            {"number": 2, "title": "Complete Application", "content": "Use ''Sole Proprietor'' if you haven''t formed an LLC yet."},
            {"number": 3, "title": "Save PDF", "content": "Download the CP-575 letter immediately. You cannot download it later."}
        ]'::jsonb
    )
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 5) AND lesson_number = 1;

-- ============================================================================
-- MODULE 6
-- ============================================================================
UPDATE training_lessons 
SET estimated_minutes = 12,
    content = jsonb_set(
        content::jsonb, 
        '{sections,0,steps}', 
        '[
            {"number": 1, "title": "Set Home Base", "content": "Your house is the center of the circle."},
            {"number": 2, "title": "Draw Radius", "content": "Max 20 miles. Anything further must be high fee."},
            {"number": 3, "title": "Identify Hotspots", "content": "Circle the dense neighborhoods inside your radius."},
            {"number": 4, "title": "Hard Borders", "content": "Decide where you simply will not go (e.g., across the bridge during rush hour)."}
        ]'::jsonb
    )
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 6) AND lesson_number = 1;

-- ============================================================================
-- MODULE 7
-- ============================================================================
-- Lesson 7.2
UPDATE training_lessons 
SET estimated_minutes = 10,
    content = jsonb_set(
        content::jsonb, 
        '{sections,0,steps}', 
        '[
            {"number": 1, "title": "Create Distance", "content": "Step back 6 feet immediately after knocking. Do not crowd the door."},
            {"number": 2, "title": "Badge Up", "content": "Hold your ID badge up so they see it through the peephole."},
            {"number": 3, "title": "The Intro", "content": "Start with ''I am an independent inspector for the mortgage client''."},
            {"number": 4, "title": "The Disclaimer", "content": "Immediately say ''I do not have account info'' to lower their defenses."}
        ]'::jsonb
    )
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 7) AND lesson_number = 2;

-- Lesson 7.6
UPDATE training_lessons 
SET estimated_minutes = 10,
    content = jsonb_set(
        content::jsonb, 
        '{sections,0,steps}', 
        '[
            {"number": 1, "title": "Read Calmly", "content": "Don''t get mad. Read the rejection reason."},
            {"number": 2, "title": "Check Evidence", "content": "Look at your backup photos."},
            {"number": 3, "title": "Reply", "content": "Reply with facts. ''Photo 4 shows the address''."},
            {"number": 4, "title": "Fix", "content": "If you messed up, fix it immediately."}
        ]'::jsonb
    )
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 7) AND lesson_number = 6;

-- ============================================================================
-- MODULE 8
-- ============================================================================
-- Lesson 8.3
UPDATE training_lessons 
SET estimated_minutes = 15,
    content = jsonb_set(
        content::jsonb, 
        '{sections,0,steps}', 
        '[
            {"number": 1, "title": "Recruit", "content": "Find reliable drivers. Retired professionals are great."},
            {"number": 2, "title": "Contract", "content": "Sign a Subcontractor Agreement. Protect your liability."},
            {"number": 3, "title": "Split", "content": "Agree on the split. You keep 20-30% for management."},
            {"number": 4, "title": "QA", "content": "You check their work before sending to client."}
        ]'::jsonb
    )
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 8) AND lesson_number = 3;

-- Lesson 8.6
UPDATE training_lessons 
SET estimated_minutes = 10,
    content = jsonb_set(
        content::jsonb, 
        '{sections,0,steps}', 
        '[
            {"number": 1, "title": "Profile", "content": "Complete your Nested Objects Profile to 100%."},
            {"number": 2, "title": "Verify", "content": "Get your badges (Background Check, Insurance)."},
            {"number": 3, "title": "Network", "content": "Engage in the community forums."},
            {"number": 4, "title": "Apply", "content": "Bid on contracts in the Marketplace."}
        ]'::jsonb
    )
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 8) AND lesson_number = 6;
