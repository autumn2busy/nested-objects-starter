-- ============================================================================
-- MODULE 3: First Occupancy & Loss Draft Inspections
-- ============================================================================

-- Add video URL to module
UPDATE training_modules 
SET video_url = 'https://youtu.be/22oUdcEApi0'
WHERE module_number = 3;

-- Lesson 3.1: The First Occupancy Inspection (Step-by-Step)
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Occupancy verification is an investigation, not just a photo op. You are building a case for whether someone lives there.",
  "introduction": {
    "hook": "Is the house vacant, or are they just on vacation? Your answer determines if the bank secures the property or leaves it alone.",
    "context": "This is 80% of your initial workload. Banks need to know if their asset is abandoned.",
    "yourRole": "You are the detective. Look for clues of life."
  },
  "sections": [
    {
      "id": "step-1-street",
      "title": "Step 1: The Street View",
      "type": "steps",
      "content": "Start your investigation before you even park.",
      "steps": [
        "Park 2 houses away to capture the ''Street Scene''.",
        "Look for cars in the driveway. Check registration stickers.",
        "Look for trash bins. Are they full? Empty? nonexistent?"
      ]
    },
    {
      "id": "step-2-approach",
      "title": "Step 2: The Approach",
      "type": "tips",
      "content": "Walking up the driveway tells you everything.",
      "tips": [
        { "title": "Newspapers", "content": "Pile of accumulation? Vacant sign." },
        { "title": "Cobwebs", "content": "Across the front door? Nobody uses that door." },
        { "title": "Landscaping", "content": "Overgrown grass (12''+) is a strong vacant indicator." }
      ]
    },
    {
      "id": "step-3-contact",
      "title": "Step 3: The Knock",
      "type": "callout",
      "callout": {
        "type": "info",
        "title": "THE SCRIPT",
        "content": "''Hi, I''m an inspector verifying occupancy for the mortgage holder. Can you confirm you still reside here? Great, thanks. Here is a contact card in case you need to reach them.''"
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "You are fast.",
      "focus": "Don''t just snap and run. LOOK at the details.",
      "warning": "Marking a house vacant just because no one answered the door."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "Personable skills.",
      "focus": "If no one answers, your investigation effectively *starts*. In notary work, no answer = go home. Here, no answer = investigate perimeter.",
      "warning": "Giving up after the knock."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Curb appeal analysis.",
      "focus": "You know an abandoned house when you see one. Document WHY.",
      "warning": "None."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "verify the *meter* if you suspect vacancy. It''s the smoking gun.",
      "warning": "Lazy ''Visual Vacant'' calls without checking hazards."
    }
  },
  "knowledgeCheck": {
    "question": "What is the most reliable indicator that a property is truly vacant?",
    "options": [
      "No one answers the door",
      "Tall grass",
      "Visual verification of empty interior through window AND removed utility meter",
      "A ''For Sale'' sign in the yard"
    ],
    "correctIndex": 2,
    "explanation": "Many occupied homes have tall grass or people at work. An empty interior combined with missing utilities is definitive proof."
  },
  "quickWin": "Look at the electric meter. Is the digital display moving? Is the ring spinning? If yes, electricity is ON.",
  "warningSign": "Marking a property ''Occupied'' just because a car is in the driveway (it could be a broken down car)."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 3)
AND lesson_number = 1;

-- Lesson 3.2: Occupancy Evidence Hierarchy
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Not all evidence is created equal. Direct contact beats a hunch every time.",
  "introduction": {
    "hook": "You think it''s vacant. The neighbor thinks it''s vacant. But if the water is on, the bank treats it as occupied.",
    "context": "We grade evidence by strength. Strong evidence allows the bank to act; weak evidence causes delays.",
    "yourRole": "Provide the strongest possible evidence level."
  },
  "sections": [
    {
      "id": "evidence-levels",
      "title": "The Hierarchy of Truth",
      "type": "comparison-table",
      "content": "From weakest to strongest.",
      "data": {
        "headers": ["Strength", "Type", "Examples"],
        "rows": [
          ["Weak", "Visual External", "Tall grass, full mailbox, dark house"],
          ["Medium", "Constructive", "Neighbor states vacancy, Postal sticker"],
          ["Strong", "Visual Internal", "Empty rooms visible through window"],
          ["Definitive", "DIRECT", "Occupant says ''I moved out'', Meter pulled"]
        ]
      }
    },
    {
      "id": "neighbors",
      "title": "The Neighbor Strategy",
      "type": "tips",
      "content": "Neighbors know everything.",
      "tips": [
        { "title": "Ask nicely", "content": "''Hi, strictly a routine check, do you know if the folks next door are around?''" },
        { "title": "Verify", "content": "Neighbors often lie or don''t know. Validate their claim with visual separation." },
        { "title": "Document", "content": "''Neighbor at 125 Main St confirmed vacancy'' is valid evidence." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Street smarts.",
      "focus": "Get that neighbor confirmation. It turns a 10-minute guess into a 2-minute certainty.",
      "warning": "Guessing based on vibes."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "You are verifying *status*, not identity. The house status is the client.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "You know ''vacant'' vs ''vacation''. Use that instinct.",
      "warning": "None."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Always try to get the definitive tier. Don''t settle for ''Visual External'' if you can see a void window.",
      "warning": "Not taking the window production photo."
    }
  },
  "knowledgeCheck": {
    "question": "Which of these is the STRONGEST form of vacancy verification?",
    "options": [
      "The grass is 3 feet tall",
      "There are 20 newspapers in the driveway",
      "You can see through the front window that the living room is empty",
      "The neighbor says ''I think they left''"
    ],
    "correctIndex": 2,
    "explanation": "Visual Internal (seeing an empty room) is factual proof. Grass, newspapers, and hearsay are circumstantial."
  },
  "quickWin": "Carry a cheap pair of binoculars to read meter tags or verify window contents from the street.",
  "warningSign": "Using ''Unknown'' as a status. Banks hate ''Unknown''."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 3)
AND lesson_number = 2;

-- Lesson 3.3: The Loss Draft Inspection (Step-by-Step)
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Loss Drafts pay more because they require math. You are verifying percentage of completion.",
  "introduction": {
    "hook": "The insurance company gave them $50,000 to fix the roof. Did they fix the roof, or buy a boat?",
    "context": "When a house is damaged, the insurance check goes to the bank first. The bank releases it in chunks (draws) as work gets done. You verify the work.",
    "yourRole": "Construction progress auditor."
  },
  "sections": [
    {
      "id": "ld-steps",
      "title": "The Loss Draft Workflow",
      "type": "workflow-steps",
      "content": "Follow the line items.",
      "data": {
        "headers": ["Step", "Action", "Goal"],
        "rows": [
          ["1. Review Scope", "Read the list: Roof (50%), Siding (50%)", "Know what to look for"],
          ["2. Inspect Items", "Look at the Roof. Is it new?", "Verify status"],
          ["3. Estimate %", "Is it 100% done? 50% (halfway)? 0% (materials only)?", "Assign %"],
          ["4. Photograph", "Photo MUST show the new materials.", "Prove it"]
        ]
      }
    },
    {
      "id": "calculating-percent",
      "title": "How to calculate %",
      "type": "info-table",
      "content": "Rules of thumb for completion.",
      "data": {
        "headers": ["Status", "Percentage", "Visual"],
        "rows": [
          ["Not Started", "0%", "No activity"],
          ["Materials On Site", "10-20%", "Shingles wrapped in plastic in driveway"],
          ["In Progress", "50%", "Old roof off, felt on, half shingled"],
          ["Completed", "90-100%", "Looks finished, no debris"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "This is detailed. Take your time. Pays 3x a normal inspection.",
      "warning": "Checking ''100%'' when it''s clearly only half done."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Like verifying document completeness. But for drywall.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Renovation knowledge.",
      "focus": "You know what a finished job looks like. Use that eye.",
      "warning": "Being too critical. We aren''t code enforcement, just verify it exists."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Don''t be lazy with the photos. If you say 50%, show the 50%.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "If you see bundles of shingles in the driveway but the roof has not been touched, what is the completion percentage?",
    "options": [
      "0%",
      "10-20% (Materials on site)",
      "50% (Started)",
      "100% (They bought the stuff, good enough)"
    ],
    "correctIndex": 1,
    "explanation": "Materials on site counts as progress! It proves intent to repair. Credit 10-20%."
  },
  "quickWin": "Always take a photo of the building permit in the window if it exists. It''s great evidence.",
  "warningSign": "Marking 100% complete when there is still painting or trim work to be done."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 3)
AND lesson_number = 3;

-- Lesson 3.4: Comparing Scope to Reality
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Sometimes the paperwork is wrong. Trust your eyes, but address the paperwork.",
  "introduction": {
    "hook": "The work order says ''Inspect repairs to fire damage''. You get there, and the house is fine, but the garage is ash.",
    "context": "Insurance adjusters make mistakes or descriptions are vague. You are the boots on the ground to clarify.",
    "yourRole": "Verify the list, but report the reality."
  },
  "sections": [
    {
      "id": "missing-items",
      "title": "When items are missing",
      "type": "tips",
      "content": "The list says ''Replace AC Unit'' but there is no AC unit.",
      "tips": [
        { "title": "Don''t Panic", "content": "Just mark 0% and comment ''AC Unit not present''." },
        { "title": "Photo Required", "content": "Take a photo of the empty concrete pad where it should be." },
        { "title": "Ask", "content": "Ask the homeowner: ''Are we doing the AC later?''" }
      ]
    },
    {
      "id": "scope-creep",
      "title": "Scope Creep",
      "type": "callout",
      "callout": {
        "type": "warning",
        "title": "Stay in your lane",
        "content": "If the homeowner asks ''Does this look right to you?'', your answer is ''I''m just taking photos for the bank.'' DO NOT offer construction advice."
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Follow the app. If the app asks for it, address it.",
      "warning": "Marking ''Completed'' just to clear the item."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "Discrepancy handling.",
      "focus": "If a name is wrong, you flag it. Same here. If the repair list doesn''t match the house, FLag it.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "Don''t judge the quality of the tile choice. Just that it is tile.",
      "warning": "Critiquing the contractor''s work to the homeowner."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Just get it done.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "The work order lists ''Repair Siding''. You arrive and see the siding is untouched, but they installed new windows. What do you do?",
    "options": [
      "Mark Siding as 100% because they spent the money on windows",
      "Mark Siding as 0% and add a note/photo about the new windows",
      "Call the police",
      "Leave"
    ],
    "correctIndex": 1,
    "explanation": "You assess the specific line item. Siding is 0%. The windows are great, note them, but do not credit Siding percentage for Window work."
  },
  "quickWin": "Use the ''General Comments'' section to explain any mismatch between list and reality.",
  "warningSign": "Crediting 100% for ''Kitchen Repair'' when they only did the floors."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 3)
AND lesson_number = 4;

-- Lesson 3.5: Documentation That Gets Approved
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Quality Assurance (QA) reviewers spend 15 seconds on your report. Make it readable.",
  "introduction": {
    "hook": "You did the work, driven the miles, and uploaded the photos. Then you get an email: ''REJECTED: Clarification Needed''.",
    "context": "Photos without context are useless. Comments connect the dots.",
    "yourRole": "Storyteller. Your photos + comments tell the story of the property."
  },
  "sections": [
    {
      "id": "photo-labels",
      "title": "Labeling (Mental or Digital)",
      "type": "examples",
      "content": "Don''t just upload a pile of drywall photos.",
      "data": {
        "headers": ["Bad Comment", "Good Comment"],
        "rows": [
          ["Repairs done.", "Kitchen drywall hanged and taped. 50% complete."],
          ["See photos.", "Front elevation shows new roof shingles. Back slope still original."],
          ["Vacant.", "Vacant confirmed by visual void through front window."]
        ]
      }
    },
    {
      "id": "wide-tight",
      "title": "Wide vs Tight",
      "type": "six-angle",
      "content": "For every repair:",
      "steps": [
        "1. Context (Wide): Show the whole wall.",
        "2. Detail (Tight): Show the texture/paint quality.",
        "3. Material: Show the box of tile or stack of wood."
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Photo proof.",
      "focus": "Add captions! Uber eats doesn''t need captions. Banks do.",
      "warning": "Leaving comment fields blank."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "notes.",
      "focus": "Your journals are detailed. Make your inspection notes just as detailed.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Descriptions.",
      "focus": "Use professional terms (fascia, soffit, grade) instead of ''roof edge'' or ''ground''.",
      "warning": "None."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Don''t use abbreviations QA might not know.",
      "warning": "Using internal slang."
    }
  },
  "knowledgeCheck": {
    "question": "Why is ''See Photos'' a bad comment?",
    "options": [
      "It hurts the reviewer''s feelings",
      "It forces the reviewer to guess what they are looking at, increasing rejection risk",
      "It costs extra data to upload",
      "It''s illegal"
    ],
    "correctIndex": 1,
    "explanation": "QA reviewers view hundreds of homes. Guide them to what you want them to see."
  },
  "quickWin": "Dictate your notes using voice-to-text while walking back to the car.",
  "warningSign": "Blurry photos of receipts or permits."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 3)
AND lesson_number = 5;

-- Lesson 3.6: Handling Edge Cases & Unknowns
UPDATE training_lessons 
SET content = '{
  "coreConcept": "When in doubt, document the obstacle.",
  "introduction": {
    "hook": "What do you do when a bear is on the porch? (True story).",
    "context": "Field work is unpredictable. Weather, animals, and neighbors happen.",
    "yourRole": "Safety first, Attempt second, Document third."
  },
  "sections": [
    {
      "id": "blockers",
      "title": "Valid Trip Reasons (Get paid for trying)",
      "type": "danger-list",
      "content": "If you can''t complete the order, you need a valid reason to get a ''Trip Fee''.",
      "items": [
        { "title": "Gated/No Access", "content": "Photo required of the closed gate/code box." },
        { "title": "Hostile Occupant/Dog", "content": "Photo required of the ''Beware of Dog'' sign or animal (from safety)." },
        { "title": "Police Tape", "content": "Do not cross. Photo of the scene." }
      ]
    },
    {
      "id": "unknown-status",
      "title": "The ''Unknown'' Trap",
      "type": "callout",
      "callout": {
        "type": "danger",
        "title": "Avoid ''Unknown''",
        "content": "Banks hate paying for ''Unknown''. Always try to determine Vacant/Occupied. Use neighbors, utilities, mail, or car movement."
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Resilience.",
      "focus": "If you can''t deliver, you take a photo of WHY. Proof of obstruction = Pay.",
      "warning": "Canceling without a photo of the problem."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Safety first. If you feel unsafe, leave.",
      "warning": "Trying to negotiate with a hostile occupant."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "Don''t use your lockbox key if it''s not authorized, even if you can.",
      "warning": "Overstepping legal access just to get the job done."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Bill for the trip charge immediately.",
      "warning": "Forgetting to upload the ''Gate'' photo and getting denied the trip fee."
    }
  },
  "knowledgeCheck": {
    "question": "You arrive at a property but a large aggressively barking dog prevents you from reaching the door. What do you do?",
    "options": [
      "Feed the dog a treat and proceed",
      "Jump the back fence",
      "Take a photo of the dog/sign from the car, mark ''Inaccessible'', and leave",
      "Honk until the owner comes out"
    ],
    "correctIndex": 2,
    "explanation": "Safety first. A photo of the hazard justifies your trip fee. Never engage a hostile animal."
  },
  "quickWin": "Keep ''Dog Biscuits'' in the car? NO. Keep a telephoto lens (zoom) on your phone.",
  "warningSign": "Entering a backyard with a ''Beware of Dog'' sign even if you don''t see the dog."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 3)
AND lesson_number = 6;
