-- ============================================================================
-- MODULE 2: Understanding the Work Order
-- ============================================================================

-- Add video URL to module
UPDATE training_modules 
SET video_url = 'https://youtu.be/KtfUM9X5VMg'
WHERE module_number = 2;

-- Lesson 2.1: Anatomy of a Work Order
UPDATE training_lessons 
SET content = '{
  "coreConcept": "The work order is not just a request; it is a binding contract defining specific deliverables for a specific property.",
  "introduction": {
    "hook": "90% of inspection rejections happen because the inspector didn''t read the instructions until they arrived at the property.",
    "context": "A work order in field services is a composite document containing client requirements, access info, and the data collection script. It is your roadmap.",
    "yourRole": "You are the executor of this contract. Your job is to fulfill every line item exactly as requested."
  },
  "sections": [
    {
      "id": "header-info",
      "title": "1. The Header: Admin & Pay",
      "type": "info-table",
      "content": "The top of every work order tells you the logistics. Never accept an order without checking these first.",
      "data": {
        "headers": ["Field", "What It Means", "Critical Action"],
        "rows": [
          ["Order #", "Unique ID for the job", "Reference this when emailing support"],
          ["Due Date", "Deadline for submission", "Subtract 24 hours for your personal deadline"],
          ["Fee/Pay", "What you earn", "Verify it matches your rate sheet"],
          ["Client", "Who ordered the inspection", "Different clients have different photo rules"]
        ]
      }
    },
    {
      "id": "property-info",
      "title": "2. Property & Contact Data",
      "type": "tips",
      "content": "Located below the header. This section dictates where you go and who you might meet.",
      "tips": [
        { "title": "Service Address", "content": "Verify the zip code matches your territory before accepting." },
        { "title": "Occupant Name", "content": "Often outdated, but gives you a name to ask for." },
        { "title": "Loan Type", "content": "FHA/VA loans often have stricter inspection requirements." }
      ]
    },
    {
      "id": "instructions-block",
      "title": "3. The Instructions Block (The Minefield)",
      "type": "danger-list",
      "content": "This is where unique requirements live.",
      "items": [
        { "title": "Required Photos", "content": "Specific angles requested (e.g., ''Photo of electric meter'')." },
        { "title": "Mandatory Forms", "content": "Paperwork needed for occupant signatures." },
        { "title": "Call Requirements", "content": "Instructions to call the client from the property." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "You''re used to app-based instructions.",
      "focus": "Work orders are denser than a delivery app. Read every line.",
      "warning": "Don''t skim. A delivery app might forgive a missed note; a bank will reject the whole job."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "You''re used to checking details.",
      "focus": "Focus on the physical property descriptions rather than just names/dates.",
      "warning": "None - your attention to detail is a huge asset here."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "You understand property data.",
      "focus": "Look for the *scope limits*. You aren''t selling it, just verifying it.",
      "warning": "Don''t over-interpret owner data."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "You know the drill.",
      "focus": "Check for *client-specific* changes. Don''t go on autopilot.",
      "warning": "Assuming this order is just like the last one."
    }
  },
  "knowledgeCheck": {
    "question": "Which section of the work order contains the specific photo requirements that could get your report rejected?",
    "options": [
      "The Header",
      "The Instructions / Special Requests Block",
      "The Occupant Info",
      "The Footer"
    ],
    "correctIndex": 1,
    "explanation": "The Header is for pay/dates. The Instructions block lists the specific scope and photo requirements."
  },
  "quickWin": "Highlight the ''Special Instructions'' section on your first 5 work orders with a yellow marker (digital or physical).",
  "warningSign": "Accepting a work order without looking at the location or due date."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 2)
AND lesson_number = 1;

-- Lesson 2.2: Decoding Inspection Types
UPDATE training_lessons 
SET content = '{
  "coreConcept": "The inspection code tells you the scope. Know the difference between a 3-minute drive-by and a 30-minute interior walk-through.",
  "introduction": {
    "hook": "Imagine showing up for a ''quick drive-by'' and realizing you need to interview the homeowner and photograph the backyard.",
    "context": "Banks use standardized codes to request specific types of data. Confusing these codes wastes time and annoys homeowners.",
    "yourRole": "You must recognize the scope immediately to plan your day."
  },
  "sections": [
    {
      "id": "occupancy-verification",
      "title": "Occupancy Verification (The Bread & Butter)",
      "type": "comparison-table",
      "content": "The most common inspection type. Determining if someone lives there.",
      "data": {
        "headers": ["Feature", "Exterior Only (Drive-by)", "Contact (Door Knock)"],
        "rows": [
          ["Goal", "Determine occupancy from street", "Confirm occupant name & phone"],
          ["Interaction", "None (Stay in car/curb)", "Knock on door"],
          ["Scope", "Street photo + House photo", "Interview + Contact Card"],
          ["Pay", "Lower", "Higher"]
        ]
      }
    },
    {
      "id": "loss-draft",
      "title": "Loss Draft / Insurance Inspections",
      "type": "steps",
      "content": "Verifying repairs after an insurance claim (e.g., storm damage).",
      "steps": [
        "Receive list of damages (roof, siding, etc.)",
        "Verify percentage of completion (0% -> 100%)",
        "Photograph materials on site",
        "Interior access often required"
      ]
    },
    {
      "id": "bankruptcy-driveby",
      "title": "Bankruptcy Drive-by",
      "type": "callout",
      "callout": {
        "type": "warning",
        "title": "STRICT NO-CONTACT",
        "content": "If an order says ''Bankruptcy'' or ''No Contact'', DO NOT get out of your car. DO NOT knock. You can violate federal law."
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "You handle different order types (food vs grocery).",
      "focus": "Learn the codes. Loss Drafts take 10x longer than Occupancy checks.",
      "warning": "Don''t treat all stops as equal time commitments."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Bankruptcy inspections have legal implications similar to notary laws.",
      "warning": "Respect the No Contact rules strictly."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "You know standard agency interactions.",
      "focus": "Forget ''Previewing''. You are strictly validating specific data points.",
      "warning": "Don''t leave a business card on a Bankruptcy drive-by."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Watch for ''Interior'' flags on standard Occupancy tickets.",
      "warning": "Missing an interior requirement on a rush order."
    }
  },
  "knowledgeCheck": {
    "question": "What is the most critical rule for a ''Bankruptcy Drive-by'' inspection?",
    "options": [
      "Get the occupant''s signature",
      "Verify the electric meter reading",
      "Strictly NO CONTACT - do not disturb the occupant",
      "Ask neighbors about the status"
    ],
    "correctIndex": 2,
    "explanation": "Bankruptcy protections are federal laws. Attempting contact can be considered harassment and cause legal liability."
  },
  "quickWin": "Create a cheat sheet of the 5 most common inspection codes for your main client.",
  "warningSign": "Knocking on a door for a drive-by only order."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 2)
AND lesson_number = 2;

-- Lesson 2.3: Reading Property Details & Access Instructions
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Access is everything. If you can''t get in, you can''t get paid.",
  "introduction": {
    "hook": "You drive 30 minutes to a property, only to find a gate code you don''t have. You just lost money.",
    "context": "Properties often have barriers: gates, guards, lockboxes, or hostile dogs. The work order contains the keys (sometimes literally).",
    "yourRole": "Pre-screen every order for access info before putting your car in drive."
  },
  "sections": [
    {
      "id": "gate-codes",
      "title": "Gate Codes & Guard Shacks",
      "type": "tips",
      "content": "Look for these specifically in the comments.",
      "tips": [
        { "title": "# vs *", "content": "Know if the code requires a pound or star key." },
        { "title": "Guard Names", "content": "Sometimes you need to give a specific name at the gate." },
        { "title": "Universal Codes", "content": "Keep a log of delivery codes for major neighborhoods (0911, 1234, etc.)." }
      ]
    },
    {
      "id": "lockboxes",
      "title": "Lockbox Types",
      "type": "glossary",
      "content": "For vacant interiors, you need physically access keys.",
      "terms": [
        { "term": "Master Lock", "definition": "Standard dial or push-button box. Code usually in work order." },
        { "term": "SUPRA / SentriLock", "definition": "Electronic boxes used by realtors. Inspectors rarely have access to these." },
        { "term": "Loaner Key", "definition": "Key held by a local broker or contractor." }
      ]
    },
    {
      "id": "address-verification",
      "title": "Address Verification Checklist",
      "type": "checklist",
      "content": "Before you leave:",
      "items": [
        "Is the house number clearly visible?",
        "Is it a corner lot (address on wrong street)?",
        "Does GPS map to the alley or the front?",
        "Are there 2 units (Duplex A/B)?"
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "You know GPS fails.",
      "focus": "Look for the physical house numbers, not just the pin.",
      "warning": "Don''t drop the report at the wrong house - automatic fail."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Gate codes are often buried in footer notes.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "You know lockboxes.",
      "focus": "Warning: Setup is often jankier than MLS listings. Keys might be under mats.",
      "warning": "Don''t expect Supra access."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Update gate codes in the system if they change to help future you.",
      "warning": "Assuming the old code still works."
    }
  },
  "knowledgeCheck": {
    "question": "What should you do if the work order provides a lockbox code but no lockbox is found?",
    "options": [
      "Break a window to gain entry",
      "Immediately cancel the order",
      "Check common hiding spots (meter, hose bib, doormat) then call support",
      "Mark it as ''Completed''"
    ],
    "correctIndex": 2,
    "explanation": "Keys and boxes often migrate. Check the perimeter first, then call your coordinator for instructions."
  },
  "quickWin": "Download offline maps for your territory; rural access info is useless if you have no signal.",
  "warningSign": "Leaving a property without trying all access methods listed."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 2)
AND lesson_number = 3;

-- Lesson 2.4: Understanding SLAs & Priorities
UPDATE training_lessons 
SET content = '{
  "coreConcept": "SLA (Service Level Agreement) is the deadline. In this industry, on-time is late.",
  "introduction": {
    "hook": "Submitting a report 5 minutes past deadline can cut your pay by 50% or invalidate the job.",
    "context": "Clients (banks) have federal deadlines to inspect assets. If you miss your window, they miss theirs.",
    "yourRole": "Manage your queue. Oldest dates first, RUSH orders immediately."
  },
  "sections": [
    {
      "id": "timeline",
      "title": "The Lifecycle of an Order",
      "type": "timeline",
      "content": "Typical flow for a 3-day SLA.",
      "data": {
        "headers": ["Day", "Status", "Action"],
        "rows": [
          ["Day 1", "Received", "Accept & Map. Review special instructions."],
          ["Day 2", "Field Work", "Execute inspection. Upload photos."],
          ["Day 3", "Due Date", "Final QA and Submit before Noon."],
          ["Day 4", "Late", "Job jeopardized. Late fees apply."]
        ]
      }
    },
    {
      "id": "rush-orders",
      "title": "Priority Flags",
      "type": "info-table",
      "content": "Codes that mean ''Drop everything''.",
      "data": {
        "headers": ["Flag", "Meaning", "Response"],
        "rows": [
          ["RUSH", "24-hour turnaround", "Go today."],
          ["SAME DAY", "Due by 5 PM today", "Go NOW."],
          ["REOPEN / RE", "Correction needed", "Fix immediately (unpaid work)."]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "You understand on-demand.",
      "focus": "SLA isn''t just speed; it''s validity. An expired order is a dead order.",
      "warning": "Don''t accept orders you can''t finish in 24-48 hours."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "You live by appointment times.",
      "focus": "Inspections are windows (3 days), not hours. Use the flexibility wisely.",
      "warning": "Don''t let the window lull you into procrastination."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "These deadlines are harder than closings. No extensions.",
      "warning": "Ignoring a due date because ''you were busy showing houses''."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Clear your queue. Don''t sit on data.",
      "warning": "Uploading batches ONLY at night. Upload as you go."
    }
  },
  "knowledgeCheck": {
    "question": "If an order is due on Wednesday, when is the best time to complete the field work?",
    "options": [
      "Wednesday at 5 PM",
      "Wednesday morning",
      "Tuesday (or Monday)",
      "Thursday, if you call ahead"
    ],
    "correctIndex": 2,
    "explanation": "Always buffer 24 hours. Weather, traffic, or bad data can delay you. Wednesday submission leaves zero margin for error."
  },
  "quickWin": "Sort your job list by ''Due Date'' (Ascending) every single morning.",
  "warningSign": "Habitually submitting jobs on the due date."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 2)
AND lesson_number = 4;

-- Lesson 2.5: Special Instructions & Compliance Flags
UPDATE training_lessons 
SET content = '{
  "coreConcept": "The generic form is not enough. The ''Client Notes'' section overrides everything.",
  "introduction": {
    "hook": "You filled out 50 questions perfectly but missed the one note asking for a photo of the AC unit. Result: Rejection.",
    "context": "Clients add specific requests to generic forms to gather extra data without building a new form.",
    "yourRole": "Hunt for these overrides. They are often hidden in plain text blocks."
  },
  "sections": [
    {
      "id": "common-flags",
      "title": "Common Compliance Flags",
      "type": "steps",
      "content": "Watch for these keywords:",
      "steps": [
        "''DATED PHOTOS'' - Requires timestamp enabled on camera.",
        "''HIGH PRIORITY COMPLAINT'' - City violation involved.",
        "''BID ALL DAMAGES'' - Requires cost estimates (advanced).",
        "''Verify AC Unit presence'' - Common in summer."
      ]
    },
    {
      "id": "example-override",
      "title": "The Override Rule",
      "type": "comparison-table",
      "content": "When instructions conflict with the form.",
      "data": {
        "headers": ["Source", "Instruction", "Winner"],
        "rows": [
          ["Standard Form", "Take 1 front photo", "Lose"],
          ["Client Note", "Take 3 front photos (Left, Center, Right)", "WINNER"],
          ["Standard Form", "Contact Occupant", "Lose"],
          ["Client Note", "DO NOT DISTURB OCCUPANT", "WINNER"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Like ''Extra sauce'' notes.",
      "focus": "These are mandatory, not requests.",
      "warning": "Ignoring text blocks."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "You read documents carefully.",
      "focus": "Apply that scrutiny to the ''Comments'' field.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "Banks have specific obsession points (e.g., handrails). Read the notes.",
      "warning": "Assuming you know what''s important."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "New clients mean new quirks. Read the notes on every NEW client type.",
      "warning": "Muscle memory ignoring new text."
    }
  },
  "knowledgeCheck": {
    "question": "If the standard form says ''Occupancy Check'' but the Special Instructions say ''Do not get out of car'', what do you do?",
    "options": [
      "Get out and knock anyway",
      "Call the police",
      "Follow the Special Instructions (Stay in car)",
      "Cancel the order"
    ],
    "correctIndex": 2,
    "explanation": "Special Instructions overrides general form titles. Safety or legal issues often dictate these overrides."
  },
  "quickWin": "Read the ''Comments'' section out loud to yourself before starting the car.",
  "warningSign": "Thinking ''I know how to do an inspection'' and skipping the reading."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 2)
AND lesson_number = 5;

-- Lesson 2.6: Common Work Order Mistakes
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Mistakes cost time, gas, and reputation. Learn from the failures of others.",
  "introduction": {
    "hook": "The most expensive mistake isn''t missing a photo; it''s going to the wrong house.",
    "context": "Volume work (doing 10-20 jobs a day) leads to fatigue and simple errors.",
    "yourRole": "Build a mental checklist to error-proof your route."
  },
  "sections": [
    {
      "id": "wrong-house",
      "title": "The Cardinal Sin: Wrong Property",
      "type": "danger-list",
      "content": "Going to 123 Main St vs 123 Main Ave.",
      "items": [
        { "title": "Trusting the Pin", "content": "Google Maps is often wrong by 50 feet." },
        { "title": "Missing Unit Numbers", "content": " inspecting Unit A instead of Unit B." },
        { "title": "The Old Photo", "content": "Assuming the house looks like the reference photo (it might have been painted)." }
      ]
    },
    {
      "id": "incomplete-photos",
      "title": "Incomplete Photos (The ''Go Back'')",
      "type": "checklist",
      "content": "Never leave the driveway until you verify:",
      "items": [
        "Are all photos in focus?",
        "Did I get the house number?",
        "Did I simulate the street scene?",
        "Did I get the gate code photo (if required)?"
      ]
    },
    {
      "id": "blur-fail",
      "title": "Blurry or Dark Photos",
      "type": "tips",
      "content": "You can''t fix a blurry photo from your couch.",
      "tips": [
        { "title": "Review on Site", "content": "Take 5 seconds to look at your photos before driving away." },
        { "title": "Clean Your Lens", "content": "Pocket lint ruins more photos than bad lighting." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Speed.",
      "focus": "Slow down 10%. Speed causes the ''Wrong House'' error.",
      "warning": "Rushing the gps verification."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "You rarely have ''wrong person'' issues, but ''wrong house'' is real.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "Unit numbers. Apartments are tricky.",
      "warning": "Assuming you know the neighborhood."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Complacency. The 1000th house is where you make a mistake.",
      "warning": "Skipping the photo review."
    }
  },
  "knowledgeCheck": {
    "question": "What is the single most common cause of inspection rejections?",
    "options": [
      "Bad lighting",
      "Wrong address / Wrong house",
      "Mean homeowners",
      "Car breakdown"
    ],
    "correctIndex": 1,
    "explanation": "Visiting the wrong property renders 100% of your work useless. Always verify the house number visually."
  },
  "quickWin": "Wipe your phone camera lens with your shirt every time you get out of the car.",
  "warningSign": "Using Google Street View to verify your location instead of the physical house number."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 2)
AND lesson_number = 6;
