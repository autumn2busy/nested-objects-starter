-- Quiz for Module 1
INSERT INTO public.training_questions (module_id, question_text, options, correct_answer, explanation, order_index)
VALUES 
('3875311c-0a12-4d00-a043-e2184aaaf407', 'What is the primary role of a Mortgage Field Inspector?', '["To repair damages", "To verify occupancy and condition", "To appraise the property value", "To evict tenants"]'::jsonb, 'To verify occupancy and condition', 'Inspectors are eyes and ears for the lender, strictly verifying facts without intervening.', 1),
('3875311c-0a12-4d00-a043-e2184aaaf407', 'When should you enter a property that appears hazardous?', '["Always, to get the photos", "Only if you have PPE", "Never; safety is the priority", "If the client offers a bonus"]'::jsonb, 'Never; safety is the priority', 'No fee is worth your safety. Document the hazard from a safe distance.', 2),
('3875311c-0a12-4d00-a043-e2184aaaf407', 'What defines an "Occupied" property?', '["It has furniture inside", "Someone is living there", "The lawn is mowed", "The mail is picked up"]'::jsonb, 'Someone is living there', 'Occupancy is defined by human habitation, not just the presence of items.', 3);

-- Quiz for Module 2
INSERT INTO public.training_questions (module_id, question_text, options, correct_answer, explanation, order_index)
VALUES 
('bffcfb09-5665-4c1b-82df-8ae02653facb', 'What is the mandatory photo orientation?', '["Vertical (Portrait)", "Horizontal (Landscape)", "Square", "Configurable"]'::jsonb, 'Horizontal (Landscape)', 'Clients require landscape photos to fit their standardized reporting forms.', 1),
('bffcfb09-5665-4c1b-82df-8ae02653facb', 'Which of these is a VALID reason to use a flash?', '["To create artistic shadows", "When ambient light is insufficient (e.g., basements)", "To reflect off windows", "Always use flash"]'::jsonb, 'When ambient light is insufficient (e.g., basements)', 'Flash should only be used when necessary to illuminate dark areas.', 2),
('bffcfb09-5665-4c1b-82df-8ae02653facb', 'What element must be avoided in all photos?', '["The house number", "Your reflection or body parts", "Damage", " Grass"]'::jsonb, 'Your reflection or body parts', 'Photos including the inspector or their car are unprofessional and often rejected.', 3);
