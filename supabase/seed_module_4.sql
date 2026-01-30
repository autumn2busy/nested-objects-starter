-- ============================================================================
-- MODULE 4: Technical Photography Mastery
-- ============================================================================

-- Add video URL to module
UPDATE training_modules 
SET video_url = 'https://youtu.be/REoW8dINYoI'
WHERE module_number = 4;

-- Lesson 4.1: Camera Settings & Metadata Configuration
UPDATE training_lessons 
SET content = '{
  "coreConcept": "If the photo doesn''t have a timestamp and geo-tag, it didn''t happen.",
  "introduction": {
    "hook": "A perfect photo is worthless if the bank can''t prove WHEN and WHERE it was taken.",
    "context": "Fraud prevention relies on metadata. Every photo file must contain EXIF data proving you were at the property.",
    "yourRole": "Technician. Configure your tool correctly before the job starts."
  },
  "sections": [
    {
      "id": "required-settings",
      "title": "Mandatory Camera Settings",
      "type": "checklist",
      "content": "Check these before every shift:",
      "items": [
        "Location Services (GPS) = ON for Camera App",
        "Timestamp Watermark = ON (Time + Date)",
        "Orientation = Landscape (Horizontal) ONLY",
        "Flash = Auto (or Fill Flash for shadows)"
      ]
    },
    {
      "id": "apps-vs-native",
      "title": "Native Camera vs Apps",
      "type": "comparison-table",
      "content": "Why use specific apps?",
      "data": {
        "headers": ["Feature", "Native Phone Camera", "Timestamp Camera Apps"],
        "rows": [
          ["Metadata", "Hidden in file", "Visible on image (Watermark)"],
          ["File Size", "Huge (4MB+)", "Optimized (200KB-500KB)"],
          ["GPS accuracy", "Basic", "Shows Address & Map on photo"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "You use apps all day.",
      "focus": "Download a dedicated ''Timestamp Camera'' app. Don''t rely on your default camera.",
      "warning": "Uploading vertical (portrait) photos."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Geo-tagging is your digital notary seal.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "You take glamour shots.",
      "focus": "Stop trying to make it look pretty. Make it look TRUE. Turn on the ugly timestamp.",
      "warning": "Using wide-angle lenses that distort reality."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Check your date settings if you get a new phone!",
      "warning": "Submitting photos with last year''s date because you didn''t sync."
    }
  },
  "knowledgeCheck": {
    "question": "Why must inspection photos be taken in Landscape (Horizontal) orientation?",
    "options": [
      "It looks more cinematic",
      "Computer monitors are horizontal, and vertical photos get cropped/distorted in reports",
      "It uses less battery",
      "It''s a suggestion, not a rule"
    ],
    "correctIndex": 1,
    "explanation": "Report generation software is designed for horizontal images. Vertical photos leave black bars or get zoomed incorrectly."
  },
  "quickWin": "Download ''Timestamp Camera Basic'' (or similar) right now and take a test photo of your desk.",
  "warningSign": "Sending a photo without a date stamp."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 4)
AND lesson_number = 1;

-- Lesson 4.2: The Complete Photo Sequence
UPDATE training_lessons 
SET content = '{
  "coreConcept": "You tell a story: Arrival -> Street -> House -> Detail -> Departure.",
  "introduction": {
    "hook": "Don''t just walk up and shoot the front door.",
    "context": "The sequence proves you were there and provides context for the property''s condition.",
    "yourRole": "Cinematographer. Establish the scene first."
  },
  "sections": [
    {
      "id": "exterior-flow",
      "title": "The Exterior Flow",
      "type": "six-angle",
      "content": "Walk this circle every time:",
      "steps": [
        "1. Street Scene (Left/Right)",
        "2. Front View (Whole House)",
        "3. Address Verification (Number)",
        "4. Left Side",
        "5. Rear View",
        "6. Right Side"
      ]
    },
    {
      "id": "context-photos",
      "title": "Context is King",
      "type": "tips",
      "content": "How to frame the shot.",
      "tips": [
        { "title": "Don''t crop the roof", "content": "Get the sky and the ground. We need to see the roofline and the grading." },
        { "title": "Step back", "content": "If you can''t fit the house in the frame, cross the street." },
        { "title": "No obstructed views", "content": "Don''t take a photo through your car windshield." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Proof of delivery.",
      "focus": "This is ''Proof of Condition''. The sequence matters.",
      "warning": "Staying in the car."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Think of it as reading every page of the document. Walk every side of the house.",
      "warning": "Skipping the back yard."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "We need the ''bad'' sides too. The alley, the AC unit side.",
      "warning": "Only taking the ''Front'' photo."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Consistency. Do it clockwise every time.",
      "warning": "Missing a side because a gate was locked (take a photo OF the locked gate)."
    }
  },
  "knowledgeCheck": {
    "question": "What is the ''Street Scene'' photo used for?",
    "options": [
      "To see if neighbors have nice cars",
      "To verify the neighborhood condition and location context",
      "It''s not required",
      "To inspect the road pavement"
    ],
    "correctIndex": 1,
    "explanation": "The Street Scene proves you are at the right location and shows the general upkeep of the neighborhood (declining/stable)."
  },
  "quickWin": "Practice the ''Clockwise Walk'' on your own house today.",
  "warningSign": "Taking the ''Front View'' photo from the driveway (too close)."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 4)
AND lesson_number = 2;

-- Lesson 4.3: Documenting Damages & Defects
UPDATE training_lessons 
SET content = '{
  "coreConcept": "If it''s broken, we need 3 photos: Wide, Medium, Tight.",
  "introduction": {
    "hook": "A close-up of a hole in the wall looks like... a hole in ANY wall. Where is it?",
    "context": "Clients make repair decisions based on your photos. They need to know the location and severity.",
    "yourRole": "Forensic Analyst."
  },
  "sections": [
    {
      "id": "wmt-rule",
      "title": "The Rule of 3 (Wide, Medium, Tight)",
      "type": "examples",
      "content": "Example: Broken Window.",
      "data": {
        "headers": ["Shot", "Purpose", "Example"],
        "rows": [
          ["Wide", "Location", "Photo of the whole side of the house showing where the window is."],
          ["Medium", "Context", "Photo of the window frame and broken glass."],
          ["Tight", "Detail", "Close-up of the impact point or lock damage."]
        ]
      }
    },
    {
      "id": "damage-scale",
      "title": "Use a Scale",
      "type": "tips",
      "content": "How big is the mold spot?",
      "tips": [
        { "title": "Reference Object", "content": "Use a pen, ruler, or tape measure in the photo for scale." },
        { "title": "Point to it", "content": "Use your finger (or a pen) to point to hairline cracks." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Damaged goods.",
      "focus": "Document it like a damaged box. Show the extent.",
      "warning": "Taking one blurry close-up."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Detail oriented.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "Don''t hide the defects! Highlight them.",
      "warning": "Using angles that minimize the damage (we want to SEE the damage)."
    }
  },
  "knowledgeCheck": {
    "question": "Why is a single close-up photo of a damage insufficient?",
    "options": [
      "It uses too much memory",
      "It lacks context - the reviewer can''t tell where the damage is located",
      "It''s fine, close-ups are best",
      "It requires a flash"
    ],
    "correctIndex": 1,
    "explanation": "Without a ''Wide'' shot, a close-up of a stain could be on the floor, ceiling, or a different house entirely."
  },
  "quickWin": "Keep a small tape measure on your belt.",
  "warningSign": "describing damage in comments but forgetting the photo."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 4)
AND lesson_number = 3;

-- Lesson 4.4: Occupancy Indicator Photography
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Photograph the clues of life (or lack thereof).",
  "introduction": {
    "hook": "A car in the driveway proves nothing if it has flat tires and moss growing on it.",
    "context": "We need *current* indicators of occupancy.",
    "yourRole": "Gathering evidence."
  },
  "sections": [
    {
      "id": "good-indicators",
      "title": "What to Shoot",
      "type": "checklist",
      "content": "Verify these:",
      "items": [
        "Utilities: Electric Meter (digital display on?)",
        "Personal Property: Patio furniture, grill, toys.",
        "Maintenance: Fresh mulch, mowed grass.",
        "Mail: Empty mailbox (good) or overflowing (bad)."
      ]
    },
    {
      "id": "bad-indicators",
      "title": "False Positives",
      "type": "danger-list",
      "content": "Don''t be fooled by:",
      "items": [
        { "title": "The ''Zombie'' Car", "content": "A car that never moves. Check for dust/cobwebs on tires." },
        { "title": "Timed Lights", "content": "Lights on at 2 PM is a sign of vacancy (timers), not occupancy." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Observation.",
      "focus": "Look continuously.",
      "warning": "Ignoring the 3-foot stack of phone books."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "This is identity verification for a building.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Staging.",
      "focus": "You know what a lived-in home looks like versus a staged one.",
      "warning": "Assuming ''For Sale'' means empty (owners often live there)."
    }
  },
  "knowledgeCheck": {
    "question": "Which photo best proves a home is OCCUPIED?",
    "options": [
      "A car in the driveway",
      "A detailed shot of the electric meter spinning/digital display active",
      "A closed front door",
      "A For Sale sign"
    ],
    "correctIndex": 1,
    "explanation": "Active utilities are the hardest thing to fake. A car can be abandoned; a spinning meter means someone is paying the bill."
  },
  "quickWin": "Zoom in on the car registration sticker. Is it expired?",
  "warningSign": "Photographing a neighbor''s car and claiming it belongs to the subject property."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 4)
AND lesson_number = 4;

-- Lesson 4.5: Interior Photography Standards
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Room-by-room, systematic coverage. Do not miss the basement or attic.",
  "introduction": {
    "hook": "The one room you skip is the one with the mold value.",
    "context": "Interior inspections are invasive. Be quick, respectful, and thorough.",
    "yourRole": "Real Estate Photographer (but for damages)."
  },
  "sections": [
    {
      "id": "interior-checklist",
      "title": "Room Checklist",
      "type": "checklist",
      "content": "Every room needs:",
      "items": [
        "1 General View (from doorway)",
        "Ceiling shot (for leaks)",
        "Floor shot (for carpets/damage)",
        "Under sink (kitchen/bath) for plumbing leaks"
      ]
    },
    {
      "id": "mechanicals",
      "title": "The Mechanicals",
      "type": "info-table",
      "content": "High-value items.",
      "data": {
        "headers": ["Item", "Photo Requirement"],
        "rows": [
          ["Furnace/HVAC", "Wide shot + Manufacturer Label"],
          ["Water Heater", "Wide shot + Date of Manufacture"],
          ["Electric Panel", "Door open (breakers) + Panel Schedule"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "This is entering private space. Be professional.",
      "warning": "Photography of personal items (family photos, valuables)."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "You do this daily.",
      "focus": "Focus on the mechanicals (HVAC/Water Heater). Banks care about the systems.",
      "warning": "Skipping the attic."
    }
  },
  "knowledgeCheck": {
    "question": "What is proper etiquette regarding personal items in photos?",
    "options": [
      "Move them out of the way",
      "Photograph them to prove who lives there",
      "Avoid photographing family photos, gun safes, or valuables if possible",
      "Zoom in on them"
    ],
    "correctIndex": 2,
    "explanation": "Privacy is key. Avoid PII (Personally Identifiable Information) in photos unless necessary for verification."
  },
  "quickWin": "Turn on all lights as you enter a room to improve photo quality.",
  "warningSign": "Selfies in the bathroom mirror."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 4)
AND lesson_number = 5;

-- Lesson 4.6: Common Photo Rejections & Fixes
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Get it right the first time. Re-trips are unpaid.",
  "introduction": {
    "hook": "Driving 40 minutes back to a house to take ONE photo of a house number is painful.",
    "context": "QA rejects photos that are blurry, dark, or incorrectly framed.",
    "yourRole": "Quality Control."
  },
  "sections": [
    {
      "id": "rejection-reasons",
      "title": "Top Rejection Reasons",
      "type": "danger-list",
      "content": "Avoid these:",
      "items": [
        { "title": "Blurry", "content": "Hold steady. Let autofocus lock." },
        { "title": "Dark / Backlit", "content": "Shooting into the sun. Adjust your angle." },
        { "title": "Car in Shot", "content": "Don''t take the photo from inside your car." },
        { "title": "Missed Angle", "content": "Forgot the rear of the house." }
      ]
    },
    {
      "id": "fixes",
      "title": "The Fix",
      "type": "tips",
      "content": "Save the trip.",
      "tips": [
        { "title": "Review before leaving", "content": "Scroll through your gallery in the driveway." },
        { "title": "Backup shots", "content": "Take 2 of everything important." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Speed kills quality. Slow down the shutter.",
      "warning": "Driving away before checking photos."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "You know quality. Apply it here.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "You take a photo of the front of the house, but the sun is behind it, making the house look like a black silhouette. What should you do?",
    "options": [
      "Submit it, they can adjust brightness",
      "Change your angle, block the sun with your hand/tree, or use ''Fill Flash''",
      "Skip the photo",
      "Come back at night"
    ],
    "correctIndex": 1,
    "explanation": " Backlit photos obscure details. Adjusting your position or tapping the screen to expose for the shadows fixes this."
  },
  "quickWin": "Clean your lens. Seriously. Do it now.",
  "warningSign": " finger in the frame."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 4)
AND lesson_number = 6;
