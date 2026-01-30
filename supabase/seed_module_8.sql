-- ============================================================================
-- MODULE 8: Scaling & Career Growth
-- ============================================================================

-- Add video URL to module
UPDATE training_modules 
SET video_url = 'https://youtu.be/VSwh4ECowc4'
WHERE module_number = 8;

-- Lesson 8.1: From Inspector to Territory Manager
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Stop thinking like a worker bee. Start thinking like the Queen Bee.",
  "introduction": {
    "hook": "You have hit the ceiling of how many houses you can personally visit. Now what?",
    "context": "The natural evolution of a successful inspector is to control a territory, not just a car.",
    "yourRole": "Regional Director."
  },
  "sections": [
    {
      "id": "mindset-shift",
      "title": "The Mindset Shift",
      "type": "comparison-table",
      "content": "Solo vs Manager.",
      "data": {
        "headers": ["Solo Inspector", "Territory Manager"],
        "rows": [
          ["Focus", "Getting the job done", "Getting the job accepted"],
          ["Income Limit", "Time/Gas constrained", "Volume constrained (Scalable)"],
          ["Skill", "Photography", "Logistics & QA"]
        ]
      }
    },
    {
      "id": "owning-zipcodes",
      "title": "Owning the Zip Code",
      "type": "tips",
      "content": "Become the preferred vendor.",
      "tips": [
        { "title": "Never turn down work", "content": "If you say YES to everything in your zone, the dispatcher stops calling others." },
        { "title": "Be the solution", "content": "Solve their weekend coverage problems." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "This is moving from Uber Driver to Fleet Manager.",
      "warning": "Thinking small."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Automate your route so you can handle 20% more volume.",
      "warning": "Burning out."
    }
  },
  "knowledgeCheck": {
    "question": "What is the key to becoming a Territory Manager?",
    "options": [
      "Buying a faster car",
      "Becoming the ''Auto-Assign'' choice for dispatchers by never rejecting work in your zone",
      "Hiring a secretary",
      "Charging double fees"
    ],
    "correctIndex": 1,
    "explanation": "Dispatchers want easy buttons. If they know assigning work to you means it gets done 100% of the time, you own that territory."
  },
  "quickWin": "Email your best client: ''I have extra capacity in [Zip Code]. Send me everything you have there.''",
  "warningSign": "Complaining about volume."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 8)
AND lesson_number = 1;

-- Lesson 8.2: Adding Revenue Streams (Notary, REO, Preservation)
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Diversify. Don''t just look at the house; look at the documents and the lawn.",
  "introduction": {
    "hook": "You are already driving to the house. Why not get paid for the signature and the lock change too?",
    "context": "Stacking credentials increases revenue per mile.",
    "yourRole": "Multi-Service provider."
  },
  "sections": [
    {
      "id": "stacking-services",
      "title": "The Service Stack",
      "type": "info-table",
      "content": "Complementary skills.",
      "data": {
        "headers": ["Service", "Difficulty", "Pay"],
        "rows": [
          ["Field Inspection", "Low", "$15-$40"],
          ["Mobile Notary", "Medium (License req)", "$75-$150"],
          ["Preservation (Locks/Lawns)", "High (Labor intensive)", "$50-$200+"]
        ]
      }
    },
    {
      "id": "cross-selling",
      "title": "Cross-Platform Strategy",
      "type": "tips",
      "content": "How to mix them.",
      "tips": [
        { "title": "Anchor Day", "content": "Schedule inspections around your fixed Notary appointments." },
        { "title": "Tool Synergy", "content": "You already have the camera and the car. Preservation just adds a drill and mower." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Get your Notary commission. It is the highest ROI upgrade you can make.",
      "warning": "Staying unskilled."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "You are already at the top of the food chain for per-hour. Use inspections for fill-in.",
      "warning": "Doing manual labor preservation actions if you hate sweat."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "BPOs (Broker Price Opinions) are your unique add-on.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "Which additional revenue stream pairs best with Field Inspection for route density?",
    "options": [
      "Dog walking",
      "Mobile Notary / Loan Signing",
      "Catering",
      "Web Design"
    ],
    "correctIndex": 1,
    "explanation": "Both require travel to residential properties. Stacking a $100 signing with a route of five $20 inspections makes for a $200+ morning."
  },
  "quickWin": "Check your state''s Secretary of State website for Notary application requirements.",
  "warningSign": "Trying to do heavy construction (Preservation) without a truck."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 8)
AND lesson_number = 2;

-- Lesson 8.3: Building a Team & Subcontracting
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Clone yourself. (Legally).",
  "introduction": {
    "hook": "You make money when YOU work. You make WEALTH when OTHERS work.",
    "context": "Subcontracting is advanced. It requires contracts, insurance, and trust.",
    "yourRole": "Business Owner."
  },
  "sections": [
    {
      "id": "model",
      "title": "The Subcontractor Model",
      "type": "steps",
      "content": "How it works.",
      "steps": [
        "Find reliable drivers (retired cops/firefighters are great).",
        "Sign a Subcontractor Agreement (protects you).",
        "Take a percentage (e.g., You keep 20%, they get 80%).",
        "You do the QA, they do the driving."
      ]
    },
    {
      "id": "risks",
      "title": "The Risks",
      "type": "danger-list",
      "content": "What can go wrong.",
      "items": [
        { "title": "Theft", "content": "They steal your client list." },
        { "title": "Quality", "content": "They submit bad photos, YOU get fired." },
        { "title": "Taxes", "content": "You must issue them a 1099 form." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Don''t try this until you have 6 months experience.",
      "warning": "Hiring friends who are lazy."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "You already work with teams. Hire a junior agent to run inspections.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "What is the biggest risk when subcontracting work?",
    "options": [
      "They drive a nicer car than you",
      "Quality control - if they mess up, the client fires YOU, not them",
      "They eat your lunch",
      "Paperwork"
    ],
    "correctIndex": 1,
    "explanation": "You own the contract. The client doesn''t know your sub exists. You are responsible for every blurry photo they take."
  },
  "quickWin": "Draft a simple ''Non-Compete / Non-Solicit'' agreement template.",
  "warningSign": "Handing out work without a written contract."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 8)
AND lesson_number = 3;

-- Lesson 8.4: Technology & Automation for Growth
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Let robots do the boring work.",
  "introduction": {
    "hook": "If you are manually typing addresses into Excel, you are wasting your life.",
    "context": "Automation tools can handle routing, invoicing, and even photo sorting.",
    "yourRole": "Tech Optimist."
  },
  "sections": [
    {
      "id": "stack",
      "title": "The Tech Stack",
      "type": "checklist",
      "content": "Essential software.",
      "items": [
        "Route Optimizer (Circuit/RoadWarrior)",
        "Mileage Tracker (Stride/MileIQ)",
        "Password Manager (LastPass)",
        "Cloud Storage (Google Drive/Dropbox for photo backup)"
      ]
    },
    {
      "id": "hardware",
      "title": "Hardware Upgrades",
      "type": "tips",
      "content": "Spend money here.",
      "tips": [
        { "title": "Secondary Phone", "content": "Keep your personal phone separate. Deduct the work phone 100%." },
        { "title": "Mobile Hotspot", "content": "Don''t rely on McDonald''s WiFi." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "App savvy.",
      "focus": "Use those skills. Teach older inspectors how to use apps.",
      "warning": "Games draining battery."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Automate your invoicing. Don''t chase checks manually.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "Why is a secondary work phone recommended for serious inspectors?",
    "options": [
      "To play games",
      "Tax deduction clarity, battery management, and separating work/life balance",
      "It looks cool",
      "To hide calls"
    ],
    "correctIndex": 1,
    "explanation": "A dedicated tool that is 100% tax deductible and keeps your client data separate from your family photos is a professional necessity."
  },
  "quickWin": "Clean up your phone storage tonight. Delete old memes to make room for paid photos.",
  "warningSign": "Running out of storage space while at a job site."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 8)
AND lesson_number = 4;

-- Lesson 8.5: Industry Trends & Future-Proofing Your Career
UPDATE training_lessons 
SET content = '{
  "coreConcept": "The industry changes every 5 years. Adapt or die.",
  "introduction": {
    "hook": "In 2008, foreclosures were King. In 2026, it might be Rental Verified. What''s next?",
    "context": "Mortgage cycles dictate our work. When the economy is good, we do updates. When it''s bad, we do defaults.",
    "yourRole": "Market Analyst."
  },
  "sections": [
    {
      "id": "trends",
      "title": "Current Trends (2025-2026)",
      "type": "info-table",
      "content": "Where the money is moving.",
      "data": {
        "headers": ["Trend", "Opportunity"],
        "rows": [
          ["Single Family Rentals (SFR)", "Institutional investors buying homes need quarterly checks."],
          ["Remote Notary (RON)", "Digital closings reducing drive time."],
          ["Drone Inspections", "Roof specific certifications."]
        ]
      }
    },
    {
      "id": "survival",
      "title": "Recession Proofing",
      "type": "callout",
      "callout": {
        "type": "success",
        "title": "Counter-Cyclical",
        "content": "Field services usually GROWS during recessions because defaults increase. This is a hedge against a bad economy."
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Flexible.",
      "focus": "You can pivot fast. Follow the volume.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "When sales are down, inspections are up. Validate your income stability.",
      "warning": "Ignoring the default market."
    }
  },
  "knowledgeCheck": {
    "question": "How does the Field Service industry typically perform during an economic recession?",
    "options": [
      "It crashes like everything else",
      "It grows/stabilizes because defaults and bank-owned properties increase",
      "It disappears",
      "It relies on government grants"
    ],
    "correctIndex": 1,
    "explanation": "We are the cleanup crew. When the market makes a mess (defaults), we get paid to clean it up."
  },
  "quickWin": "Read one industry news article a week (DSNews or HousingWire).",
  "warningSign": "Thinking ''this will last forever''."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 8)
AND lesson_number = 5;

-- Lesson 8.6: The Nested Objects Elite Path
UPDATE training_lessons 
SET content = '{
  "coreConcept": "You are now part of an ecosystem. Use it.",
  "introduction": {
    "hook": "Nested Objects isn''t just a training, it''s a network.",
    "context": "We connect trained vendors (you) with firms looking for talent.",
    "yourRole": "Elite Member."
  },
  "sections": [
    {
      "id": "community",
      "title": "Leveraging the Network",
      "type": "steps",
      "content": "What to do next.",
      "steps": [
        "Complete your Nested Objects Profile (100%).",
        "Get your ''Verified'' badge.",
        "Network in the community forums.",
        "Apply for exclusive contracts posted on the job board."
      ]
    },
    {
      "id": "final-thought",
      "title": "The Infinite Game",
      "type": "tips",
      "content": "Keep playing.",
      "tips": [
        { "title": "Mentorship", "content": "Help a rookie. It builds your reputation." },
        { "title": "Quality", "content": "Never lower your standards." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Use the badge to get premium clients.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "What is the immediate next step after finishing this course?",
    "options": [
      "Sleep",
      "Complete your Profile and verification to become visible to clients",
      "Delete the app",
      "Demand a job"
    ],
    "correctIndex": 1,
    "explanation": "Your profile is your digital resume. Make it shine."
  },
  "quickWin": "Update your LinkedIn profile to include ''Certified Field Inspector''.",
  "warningSign": "Ghosting the community."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 8)
AND lesson_number = 6;
