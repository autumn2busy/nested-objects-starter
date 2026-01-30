-- ============================================================================
-- MASTER STRUCTURE SEED: Creates Modules 2-8 and Lessons 1-6
-- Run this script FIRST to create the rows.
-- Then run the individual 'seed_module_X.sql' scripts to populate the content.
-- ============================================================================

-- MODULE 2
INSERT INTO training_modules (module_number, title, description, is_active, slug)
SELECT 2, 'Understanding the Work Order', 'Learn how to read, interpret, and execute work orders perfectly.', true, 'module-2'
WHERE NOT EXISTS (SELECT 1 FROM training_modules WHERE module_number = 2);

INSERT INTO training_lessons (module_id, lesson_number, title, content_type, is_required)
SELECT id, 1, 'Anatomy of a Work Order', 'text', true FROM training_modules WHERE module_number = 2
UNION ALL SELECT id, 2, 'Decoding Inspection Types', 'text', true FROM training_modules WHERE module_number = 2
UNION ALL SELECT id, 3, 'Reading Property Details & Access Instructions', 'text', true FROM training_modules WHERE module_number = 2
UNION ALL SELECT id, 4, 'Understanding SLAs & Priorities', 'text', true FROM training_modules WHERE module_number = 2
UNION ALL SELECT id, 5, 'Special Instructions & Compliance Flags', 'text', true FROM training_modules WHERE module_number = 2
UNION ALL SELECT id, 6, 'Common Work Order Mistakes', 'text', true FROM training_modules WHERE module_number = 2
ON CONFLICT (module_id, lesson_number) DO UPDATE SET title = EXCLUDED.title;

-- MODULE 3
INSERT INTO training_modules (module_number, title, description, is_active, slug)
SELECT 3, 'First Occupancy & Loss Draft Inspections', 'Master the two most common inspection types: Occupancy Verification and Insurance Loss Drafts.', true, 'module-3'
WHERE NOT EXISTS (SELECT 1 FROM training_modules WHERE module_number = 3);

INSERT INTO training_lessons (module_id, lesson_number, title, content_type, is_required)
SELECT id, 1, 'The First Occupancy Inspection (Step-by-Step)', 'text', true FROM training_modules WHERE module_number = 3
UNION ALL SELECT id, 2, 'Occupancy Evidence Hierarchy', 'text', true FROM training_modules WHERE module_number = 3
UNION ALL SELECT id, 3, 'The Loss Draft Inspection (Step-by-Step)', 'text', true FROM training_modules WHERE module_number = 3
UNION ALL SELECT id, 4, 'Comparing Scope to Reality', 'text', true FROM training_modules WHERE module_number = 3
UNION ALL SELECT id, 5, 'Documentation That Gets Approved', 'text', true FROM training_modules WHERE module_number = 3
UNION ALL SELECT id, 6, 'Handling Edge Cases & Unknowns', 'text', true FROM training_modules WHERE module_number = 3
ON CONFLICT (module_id, lesson_number) DO UPDATE SET title = EXCLUDED.title;

-- MODULE 4
INSERT INTO training_modules (module_number, title, description, is_active, slug)
SELECT 4, 'Technical Photography Mastery', 'The comprehensive guide to taking 6-angle photos that get approved every time.', true, 'module-4'
WHERE NOT EXISTS (SELECT 1 FROM training_modules WHERE module_number = 4);

INSERT INTO training_lessons (module_id, lesson_number, title, content_type, is_required)
SELECT id, 1, 'Camera Settings & Metadata Configuration', 'text', true FROM training_modules WHERE module_number = 4
UNION ALL SELECT id, 2, 'The Complete Photo Sequence', 'text', true FROM training_modules WHERE module_number = 4
UNION ALL SELECT id, 3, 'Documenting Damages & Defects', 'text', true FROM training_modules WHERE module_number = 4
UNION ALL SELECT id, 4, 'Occupancy Indicator Photography', 'text', true FROM training_modules WHERE module_number = 4
UNION ALL SELECT id, 5, 'Interior Photography Standards', 'text', true FROM training_modules WHERE module_number = 4
UNION ALL SELECT id, 6, 'Common Photo Rejections & Fixes', 'text', true FROM training_modules WHERE module_number = 4
ON CONFLICT (module_id, lesson_number) DO UPDATE SET title = EXCLUDED.title;

-- MODULE 5
INSERT INTO training_modules (module_number, title, description, is_active, slug)
SELECT 5, 'The Business of Inspections', 'Setup your LLC, taxes, insurance, and equipment for long-term success.', true, 'module-5'
WHERE NOT EXISTS (SELECT 1 FROM training_modules WHERE module_number = 5);

INSERT INTO training_lessons (module_id, lesson_number, title, content_type, is_required)
SELECT id, 1, 'Setting Up Your Business Entity', 'text', true FROM training_modules WHERE module_number = 5
UNION ALL SELECT id, 2, 'Tax Basics for Independent Contractors', 'text', true FROM training_modules WHERE module_number = 5
UNION ALL SELECT id, 3, 'Insurance & Liability Requirements', 'text', true FROM training_modules WHERE module_number = 5
UNION ALL SELECT id, 4, 'Equipment Investment Strategy', 'text', true FROM training_modules WHERE module_number = 5
UNION ALL SELECT id, 5, 'Pricing, Negotiation & When to Walk Away', 'text', true FROM training_modules WHERE module_number = 5
UNION ALL SELECT id, 6, 'Scaling: From Part-Time to Full-Time Pro', 'text', true FROM training_modules WHERE module_number = 5
ON CONFLICT (module_id, lesson_number) DO UPDATE SET title = EXCLUDED.title;

-- MODULE 6
INSERT INTO training_modules (module_number, title, description, is_active, slug)
SELECT 6, 'Advanced Routing & Efficiency', 'How to complete 20 jobs a day without burning out using route optimization.', true, 'module-6'
WHERE NOT EXISTS (SELECT 1 FROM training_modules WHERE module_number = 6);

INSERT INTO training_lessons (module_id, lesson_number, title, content_type, is_required)
SELECT id, 1, 'Territory Analysis & ZIP Code Strategy', 'text', true FROM training_modules WHERE module_number = 6
UNION ALL SELECT id, 2, 'Route Optimization Software & Techniques', 'text', true FROM training_modules WHERE module_number = 6
UNION ALL SELECT id, 3, 'Batching Strategies for Maximum Efficiency', 'text', true FROM training_modules WHERE module_number = 6
UNION ALL SELECT id, 4, 'Time Management: The Inspector''s Day', 'text', true FROM training_modules WHERE module_number = 6
UNION ALL SELECT id, 5, 'Managing Multiple Clients Simultaneously', 'text', true FROM training_modules WHERE module_number = 6
UNION ALL SELECT id, 6, 'Weather, Seasonality & Demand Patterns', 'text', true FROM training_modules WHERE module_number = 6
ON CONFLICT (module_id, lesson_number) DO UPDATE SET title = EXCLUDED.title;

-- MODULE 7
INSERT INTO training_modules (module_number, title, description, is_active, slug)
SELECT 7, 'Professional Communication', 'Scripts for homeowners and coordinators to de-escalate and look professional.', true, 'module-7'
WHERE NOT EXISTS (SELECT 1 FROM training_modules WHERE module_number = 7);

INSERT INTO training_lessons (module_id, lesson_number, title, content_type, is_required)
SELECT id, 1, 'Coordinator Communication Excellence', 'text', true FROM training_modules WHERE module_number = 7
UNION ALL SELECT id, 2, 'Occupant Interaction Scripts', 'text', true FROM training_modules WHERE module_number = 7
UNION ALL SELECT id, 3, 'De-escalation & Difficult Situations', 'text', true FROM training_modules WHERE module_number = 7
UNION ALL SELECT id, 4, 'Written Communication Standards', 'text', true FROM training_modules WHERE module_number = 7
UNION ALL SELECT id, 5, 'Building Your Professional Reputation', 'text', true FROM training_modules WHERE module_number = 7
UNION ALL SELECT id, 6, 'Handling Complaints & Feedback', 'text', true FROM training_modules WHERE module_number = 7
ON CONFLICT (module_id, lesson_number) DO UPDATE SET title = EXCLUDED.title;

-- MODULE 8
INSERT INTO training_modules (module_number, title, description, is_active, slug)
SELECT 8, 'Scaling & Career Growth', 'Moving from 1099 worker to business owner: Subcontracting and diversifying.', true, 'module-8'
WHERE NOT EXISTS (SELECT 1 FROM training_modules WHERE module_number = 8);

INSERT INTO training_lessons (module_id, lesson_number, title, content_type, is_required)
SELECT id, 1, 'From Inspector to Territory Manager', 'text', true FROM training_modules WHERE module_number = 8
UNION ALL SELECT id, 2, 'Adding Revenue Streams (Notary, REO, Preservation)', 'text', true FROM training_modules WHERE module_number = 8
UNION ALL SELECT id, 3, 'Building a Team & Subcontracting', 'text', true FROM training_modules WHERE module_number = 8
UNION ALL SELECT id, 4, 'Technology & Automation for Growth', 'text', true FROM training_modules WHERE module_number = 8
UNION ALL SELECT id, 5, 'Industry Trends & Future-Proofing Your Career', 'text', true FROM training_modules WHERE module_number = 8
UNION ALL SELECT id, 6, 'The Nested Objects Elite Path', 'text', true FROM training_modules WHERE module_number = 8
ON CONFLICT (module_id, lesson_number) DO UPDATE SET title = EXCLUDED.title;
