-- Add Scenarios for Modules 3-8
-- explicit jsonb casts added to avoid type mismatch errors

-- Module 3 Scenarios
INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
SELECT 
    id,
    'The Pushy Realtor',
    'Handling unauthorized access requests.',
    'realtor',
    'Key',
    'red',
    '{
        "character": "You",
        "background": "Field Inspector",
        "context": "A Realtor meets you at the property. The house is locked.",
        "complication": "The Realtor tells you to just break the window to get in, saying ''The bank owns it anyway.''",
        "instinct": "You want to help, but this sounds illegal."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "What do you do?",
            "options": [
                { "id": "a", "text": "Break the window carefully.", "isCorrect": false, "feedback": { "title": "Illegal", "message": "That is Breaking & Entering.", "consequence": "Jail time." } },
                { "id": "b", "text": "Refuse and document the request.", "isCorrect": true, "feedback": { "title": "Correct", "message": "Never damage property to gain access.", "consequence": "Professionalism maintained." } },
                { "id": "c", "text": "Ask the Realtor to do it.", "isCorrect": false, "feedback": { "title": "Accomplice", "message": "You are still liable.", "consequence": "Liability." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Access must be lawful.",
        "coreRule": "Do not break and enter.",
        "audienceWarning": "Realtors are used to having keys. You are not."
    }'::jsonb,
    2
FROM training_modules WHERE module_number = 3
UNION ALL
SELECT 
    id,
    'The Hidden Occupant',
    'Verifying occupancy with conflicting signs.',
    'gig-worker',
    'Eye',
    'blue',
    '{
        "character": "You",
        "background": "Field Inspector",
        "context": "The driveway is empty. Grass is high. Mail is overflowing.",
        "complication": "You hear a TV playing inside.",
        "instinct": "Mark it vacant because of the grass."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "How do you classify this property?",
            "options": [
                { "id": "a", "text": "Vacant (The TV is just a deterrent).", "isCorrect": false, "feedback": { "title": "Incorrect", "message": "You cannot prove it is a deterrent.", "consequence": "Wrongful eviction risk." } },
                { "id": "b", "text": "Occupied (TV is on).", "isCorrect": true, "feedback": { "title": "Correct", "message": "Sounds of life = Occupied.", "consequence": "Asset secured properly." } },
                { "id": "c", "text": "Unknown.", "isCorrect": false, "feedback": { "title": "Lazy", "message": "You have evidence (sound). Use it.", "consequence": "Report rejection." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Sounds vary.",
        "coreRule": "If in doubt, call it Occupied.",
        "audienceWarning": "Do not guess."
    }'::jsonb,
    3
FROM training_modules WHERE module_number = 3;

-- Module 4 Scenarios
INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
SELECT 
    id,
    'The Glare',
    'Handling bad lighting conditions.',
    'realtor',
    'Sun',
    'amber',
    '{
        "character": "You",
        "background": "Photographer",
        "context": "It is 12:00 PM. The sun is directly behind the house.",
        "complication": "The front photo looks like a black silhouette.",
        "instinct": "Just take it and leave."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "How do you fix this shot?",
            "options": [
                { "id": "a", "text": "Take it anyway.", "isCorrect": false, "feedback": { "title": "Rejected", "message": "QA cannot see the house condition.", "consequence": "Return trip required." } },
                { "id": "b", "text": "Tap the screen on the dark area (HDR) or move slightly to the side.", "isCorrect": true, "feedback": { "title": "Correct", "message": "Exposure compensation saves the shot.", "consequence": "Approved report." } },
                { "id": "c", "text": "Block the sun with your hand.", "isCorrect": false, "feedback": { "title": "Finger in Frame", "message": "Now your hand is in the photo.", "consequence": "Rejection." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Light matters.",
        "coreRule": "Don''t shoot into the sun.",
        "audienceWarning": "No silhouettes."
    }'::jsonb,
    2
FROM training_modules WHERE module_number = 4
UNION ALL
SELECT 
    id,
    'The Locked Gate',
    'Documenting access issues.',
    'gig-worker',
    'Lock',
    'slate',
    '{
        "character": "You",
        "background": "Inspector",
        "context": "You need a rear photo.",
        "complication": "The side gate is locked with a padlock.",
        "instinct": "Climb the fence."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "What is the move?",
            "options": [
                { "id": "a", "text": "Climb the fence.", "isCorrect": false, "feedback": { "title": "Unsafe", "message": "You could get hurt or shot.", "consequence": "Injury/Trespassing." } },
                { "id": "b", "text": "Take a photo OF the lock and mark ''Rear Inaccessible''.", "isCorrect": true, "feedback": { "title": "Correct", "message": "Proof of obstruction acts as the photo.", "consequence": "Paid full fee." } },
                { "id": "c", "text": "Skip the rear photo.", "isCorrect": false, "feedback": { "title": "Missing Info", "message": "Why is it missing? You didn''t prove why.", "consequence": "Rejection." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Safety first.",
        "coreRule": "Photograph the obstacle.",
        "audienceWarning": "Do not climb fences."
    }'::jsonb,
    3
FROM training_modules WHERE module_number = 4;

-- Module 5 Scenarios
INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
SELECT 
    id,
    'Receipt Chaos',
    'Organizing for tax season.',
    'gig-worker',
    'FileText',
    'orange',
    '{
        "character": "You",
        "background": "Business Owner",
        "context": "It''s tax time. You spent $2,000 on gas.",
        "complication": "You threw away all the receipts.",
        "instinct": "Panic."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "What can you deduct?",
            "options": [
                { "id": "a", "text": "Guess the amount.", "isCorrect": false, "feedback": { "title": "Audit Risk", "message": "The IRS loves guessers.", "consequence": "Penalties." } },
                { "id": "b", "text": "Use your mileage log.", "isCorrect": true, "feedback": { "title": "Correct", "message": "Standard Mileage Rate doesn''t require gas receipts, just a mileage log.", "consequence": "Safe deduction." } },
                { "id": "c", "text": "Nothing.", "isCorrect": false, "feedback": { "title": "Money Lost", "message": "You overpay taxes.", "consequence": "Loss of profit." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Logs > Receipts.",
        "coreRule": "Track miles, not gas (usually).",
        "audienceWarning": "Keep logs contemporaneous."
    }'::jsonb,
    2
FROM training_modules WHERE module_number = 5
UNION ALL
SELECT 
    id,
    'The Lowball Offer',
    'Negotiating rates.',
    'inspector',
    'DollarSign',
    'green',
    '{
        "character": "You",
        "background": "Contractor",
        "context": "A firm emails you a job.",
        "complication": "It is 20 miles away and pays $3.",
        "instinct": "Accept it to build favor."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "Do you take it?",
            "options": [
                { "id": "a", "text": "Yes.", "isCorrect": false, "feedback": { "title": "Loss", "message": "You lost money on gas.", "consequence": "Bankruptcy." } },
                { "id": "b", "text": "Counter-offer.", "isCorrect": true, "feedback": { "title": "Correct", "message": "Ask for a Trip Fee or Decline.", "consequence": "Respect established." } },
                { "id": "c", "text": "Ignore it.", "isCorrect": false, "feedback": { "title": "Ghosting", "message": "They will stop calling.", "consequence": "Relationship damaged." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Know your worth.",
        "coreRule": "Don''t work for free.",
        "audienceWarning": "Volume does not cure negative margins."
    }'::jsonb,
    3
FROM training_modules WHERE module_number = 5;

-- Module 6 Scenarios
INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
SELECT 
    id,
    'Traffic Jam',
    'Dealing with delays.',
    'gig-worker',
    'Truck',
    'slate',
    '{
        "character": "You",
        "background": "Driver",
        "context": "You have 5 stops left.",
        "complication": "Major accident closes the highway. 2 hour delay.",
        "instinct": "Drive effectively."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "What is the strategy?",
            "options": [
                { "id": "a", "text": "Wait it out.", "isCorrect": false, "feedback": { "title": "Late", "message": "You miss sunlight.", "consequence": "Failed inspections." } },
                { "id": "b", "text": "Re-route using Waze/Google.", "isCorrect": true, "feedback": { "title": "Correct", "message": "Or change the order of stops to hit the ones behind you first.", "consequence": "Day saved." } },
                { "id": "c", "text": "Go home.", "isCorrect": false, "feedback": { "title": "Quitter", "message": "No pay.", "consequence": "Sadness." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Be flexible.",
        "coreRule": "Use technology (Waze).",
        "audienceWarning": "Don''t stick to a rigid plan."
    }'::jsonb,
    2
FROM training_modules WHERE module_number = 6
UNION ALL
SELECT 
    id,
    'The Distant Job',
    'Route density calculation.',
    'realtor',
    'Map',
    'blue',
    '{
        "character": "You",
        "background": "Strategist",
        "context": "A $50 job pops up 40 miles away.",
        "complication": "You have no other work in that area.",
        "instinct": "It pays $50! Take it."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "Is it profitable?",
            "options": [
                { "id": "a", "text": "Yes.", "isCorrect": false, "feedback": { "title": "Wrong", "message": "80 miles round trip = $52 cost. You lost $2.", "consequence": "Net loss." } },
                { "id": "b", "text": "No.", "isCorrect": true, "feedback": { "title": "Correct", "message": "Mileage eats the profit.", "consequence": "Smart pass." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Math wins.",
        "coreRule": "Calculate round trip costs.",
        "audienceWarning": "Revenue is not Profit."
    }'::jsonb,
    3
FROM training_modules WHERE module_number = 6;

-- Module 7 Scenarios
INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
SELECT 
    id,
    'Angry Homeowner',
    'De-escalation techniques.',
    'realtor',
    'UserMinus',
    'red',
    '{
        "character": "You",
        "background": "Inspector",
        "context": "You knock on the door.",
        "complication": "The owner opens the door screaming ''Get off my porch!''",
        "instinct": "Explain why you are there."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "What is the safest move?",
            "options": [
                { "id": "a", "text": "Shout back.", "isCorrect": false, "feedback": { "title": "Escalation", "message": "Now you are fighting.", "consequence": "Police called." } },
                { "id": "b", "text": "Apologize and Retreat.", "isCorrect": true, "feedback": { "title": "Correct", "message": "De-escalate. Leave safety.", "consequence": "Safe exit." } },
                { "id": "c", "text": "Stand your ground.", "isCorrect": false, "feedback": { "title": "Dangerous", "message": "Not worth getting hurt.", "consequence": "Injury." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Leave.",
        "coreRule": "Argument = Exit.",
        "audienceWarning": "Don''t try to be a hero."
    }'::jsonb,
    2
FROM training_modules WHERE module_number = 7
UNION ALL
SELECT 
    id,
    'The Late Report',
    'Managing coordinator expectations.',
    'gig-worker',
    'Clock',
    'orange',
    '{
        "character": "You",
        "background": "Inspector",
        "context": "Job is due at 5 PM.",
        "complication": "It is 4:55 PM and you are 20 mins away.",
        "instinct": "Drive fast."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "How do you handle the coordinator?",
            "options": [
                { "id": "a", "text": "Ghost them until it is done.", "isCorrect": false, "feedback": { "title": "Anxiety", "message": "They thrive on updates. Silence kills trust.", "consequence": "Contract lost." } },
                { "id": "b", "text": "Call/Email NOW with new ETA.", "isCorrect": true, "feedback": { "title": "Correct", "message": "''Will be late, ETA 5:30''. They can update the client.", "consequence": "Trust maintained." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Communicate early.",
        "coreRule": "Bad news must travel fast.",
        "audienceWarning": "Never ghost."
    }'::jsonb,
    3
FROM training_modules WHERE module_number = 7;

-- Module 8 Scenarios
INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
SELECT 
    id,
    'The Subcontractor',
    'Scaling risks.',
    'inspector',
    'Users',
    'purple',
    '{
        "character": "You",
        "background": "Manager",
        "context": "You hired a sub to do 10 houses.",
        "complication": "They uploaded blurry photos for all 10.",
        "instinct": "Blame them."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "Who is responsible?",
            "options": [
                { "id": "a", "text": "The Sub.", "isCorrect": false, "feedback": { "title": "Wrong", "message": "The client doesn''t know the sub exists.", "consequence": "You get fired." } },
                { "id": "b", "text": "You.", "isCorrect": true, "feedback": { "title": "Correct", "message": "You are the vendor of record. You must fix it.", "consequence": "Lesson learned." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "You own the work.",
        "coreRule": "QA your team.",
        "audienceWarning": "Do not abdicate responsibility."
    }'::jsonb,
    2
FROM training_modules WHERE module_number = 8
UNION ALL
SELECT 
    id,
    'Burnout',
    'Managing health.',
    'gig-worker',
    'Battery',
    'red',
    '{
        "character": "You",
        "background": "Worker",
        "context": "You have worked 30 days in a row.",
        "complication": "You are making mistakes and angry at homeowners.",
        "instinct": "Keep pushing."
    }'::jsonb,
    '[
        {
            "id": "response",
            "question": "What is the fix?",
            "options": [
                { "id": "a", "text": "Coffee.", "isCorrect": false, "feedback": { "title": "Temporary", "message": "Crash incoming.", "consequence": "Mistakes." } },
                { "id": "b", "text": "Schedule a day off.", "isCorrect": true, "feedback": { "title": "Correct", "message": "Rest puts money in the bank by preventing errors.", "consequence": "Longevity." } }
            ]
        }
    ]'::jsonb,
    '{
        "keyLesson": "Rest is productive.",
        "coreRule": "Schedule downtime.",
        "audienceWarning": "Grindset kills quality."
    }'::jsonb,
    3
FROM training_modules WHERE module_number = 8;
