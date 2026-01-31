-- Migration to fix Module 3-8 Content Schema and Add Scenarios

-- Fix Lesson 3.1 Content
UPDATE training_lessons 
SET estimated_minutes = 10,
    content = jsonb_set(
        content::jsonb, 
        '{sections,0,steps}', 
        '[
            {"number": 1, "title": "The Street Scene", "content": "Park 2 houses away to capture the wide shot. Do not park in the driveway."},
            {"number": 2, "title": "Check Driveway", "content": "Look for cars. Check registration stickers for expiration dates."},
            {"number": 3, "title": "Check Trash", "content": "Look for bins. Are they full? Empty? Non-existent?"}
        ]'::jsonb
    )
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 3) AND lesson_number = 1;
