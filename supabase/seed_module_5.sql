-- ============================================================================
-- MODULE 5: The Business of Inspections
-- ============================================================================

-- Add video URL to module
UPDATE training_modules 
SET video_url = 'https://youtu.be/B6gCrwPaLyk'
WHERE module_number = 5;

-- Lesson 5.1: Setting Up Your Business Entity
UPDATE training_lessons 
SET content = '{
  "coreConcept": "You are not an employee. You are a business owner. Act like one from Day 1.",
  "introduction": {
    "hook": "Using your personal bank account for business assumes you want to get audited.",
    "context": "Field inspection firms hire business entities, not people. To get the best contracts, you need the right structure.",
    "yourRole": "CEO of [Your Name] Inspections LLC."
  },
  "sections": [
    {
      "id": "entity-types",
      "title": "Sole Prop vs LLC",
      "type": "comparison-table",
      "content": "Why upgrade?",
      "data": {
        "headers": ["Feature", "Sole Proprietorship", "LLC (Limited Liability Co)"],
        "rows": [
          ["Cost", "Free (usually)", "$50-$800 depending on state"],
          ["Liability", "Personal assets at risk", "Business assets separated"],
          ["Credibility", "Low", "High (Required by some major firms)"]
        ]
      }
    },
    {
      "id": "ein",
      "title": "Get an EIN",
      "type": "steps",
      "content": "Never give your Social Security Number to 50 different vendors.",
      "steps": [
        "Go to IRS.gov (It''s free, takes 5 minutes).",
        "Apply for an EIN (Employer Identification Number).",
        "Use this number on all W9 forms."
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "You''re already a 1099.",
      "focus": "Move from ''gig'' to ''business''. Get an LLC to protect your personal car/assets.",
      "warning": "Mixing Uber eats money with Inspection money in one personal account."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "You likely have this.",
      "focus": "Ensure your LLC name is broad enough (e.g., ''Smith Field Services'', not ''Smith Notary'').",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "You have a brokerage structure.",
      "focus": "Check with your broker. They may demand you run inspections separate from your RE license.",
      "warning": "Running inspections through your Brokerage without permission."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Audit your W9s. Are you still using your SSN?",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "What is the primary benefit of using an EIN instead of your Social Security Number on W9 forms?",
    "options": [
      "It lowers your taxes",
      "Identity theft protection and separating business identity",
      "It allows you to hire employees immediately",
      "It is required by law for all tasks"
    ],
    "correctIndex": 1,
    "explanation": "Spreading your SSN around to dozens of vendors increases theft risk. An EIN keeps your personal identity secure."
  },
  "quickWin": "Apply for your EIN on IRS.gov right now. It is instant.",
  "warningSign": "Paying for an EIN. It is a free government service."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 5)
AND lesson_number = 1;

-- Lesson 5.2: Tax Basics for Independent Contractors
UPDATE training_lessons 
SET content = '{
  "coreConcept": "If you don''t save for taxes, you are effectively taking a 30% loan from the IRS at high interest.",
  "introduction": {
    "hook": "April 15th is the worst day of the year for rookie inspectors.",
    "context": "No one withholds taxes for you. You must track expenses to offset your income.",
    "yourRole": "CFO (Chief Financial Officer)."
  },
  "sections": [
    {
      "id": "deductions",
      "title": "The Magic of Deductions",
      "type": "info-table",
      "content": "What lowers your taxable income?",
      "data": {
        "headers": ["Expense", "Deductible?", "Notes"],
        "rows": [
          ["Mileage", "YES (Huge)", "Track every mile driving to/from jobs."],
          ["Home Office", "Maybe", "Exclusive use area only."],
          ["Equipment", "YES", "Cameras, poles, computers."],
          ["Lunch", "NO (Usually)", "Unless it is a business meeting."]
        ]
      }
    },
    {
      "id": "mileage-tracking",
      "title": "Track the Miles",
      "type": "tips",
      "content": "Your biggest deduction.",
      "tips": [
        { "title": "Use an App", "content": "Stride, MileIQ, or stored in your car." },
        { "title": "Log dates", "content": "IRS requires a contemporaneous log (made at the time), not a guess at year-end." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "You drive A LOT. Mileage deduction often wipes out a huge chunk of tax liability.",
      "warning": "Forgetting to turn the tracker on."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Combine trips. Information stack the miles.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "Separate your RE miles from Inspection miles for clarity.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "Which of these is typically your largest tax deduction as a field inspector?",
    "options": [
      "Home Office",
      "Vehicle Mileage",
      "Office Supplies",
      "Meals"
    ],
    "correctIndex": 1,
    "explanation": "At current IRS rates (approx 65 cents/mile), driving 20,000 miles is a $13,000 deduction."
  },
  "quickWin": "Open a separate savings account and auto-transfer 25% of every deposit for taxes.",
  "warningSign": "Thinking ''I''ll just figure out my miles in December''."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 5)
AND lesson_number = 2;

-- Lesson 5.3: Insurance & Liability Requirements
UPDATE training_lessons 
SET content = '{
  "coreConcept": "You need General Liability (GL) and Errors & Omissions (E&O). Your car insurance is not enough.",
  "introduction": {
    "hook": "You back into a mailbox. Or you step through an attic ceiling. Who pays?",
    "context": "Professional firms require proof of insurance (Certificate of Insurance - COI) to onboard you.",
    "yourRole": "Risk Manager."
  },
  "sections": [
    {
      "id": "insurance-types",
      "title": "GL vs E&O",
      "type": "comparison-table",
      "content": "Know the difference.",
      "data": {
        "headers": ["Type", "Covers", "Example"],
        "rows": [
          ["General Liability (GL)", "Physical damage you cause", "Breaking a vase, falling off a ladder."],
          ["Errors & Omissions (E&O)", "Mistakes in your report", "Claiming a roof is good when it is leaking."],
          ["Auto (Commercial)", "Driving for work", "Accident between jobs."]
        ]
      }
    },
    {
      "id": "aspen-grove",
      "title": "Background Checks (ABC#)",
      "type": "steps",
      "content": "The Aspen Grove ABC number is the industry standard background check.",
      "steps": [
        "Register with Aspen Grove Solutions.",
        "Pay for the background check (Levels 1-2).",
        "Receive your ABC Number.",
        "Provide this number to all firms (universal)."
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Uber covers you while driving. Here, YOU cover you.",
      "warning": "Thinking personal auto insurance covers commercial use."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "You have E&O.",
      "focus": "Your Notary E&O might NOT cover Field Inspection. Check the policy.",
      "warning": "Under-insuring."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "You have E&O.",
      "focus": "Same warning. Realtor insurance usually excludes preservation work.",
      "warning": "Assuming coverage."
    }
  },
  "knowledgeCheck": {
    "question": "What is an Aspen Grove (ABC) Number?",
    "options": [
      "Your insurance policy number",
      "A universal industry background check ID",
      "Your tax ID",
      "A score of your inspection quality"
    ],
    "correctIndex": 1,
    "explanation": "Aspen Grove is the centralized clearinghouse for background checks in the mortgage field service industry."
  },
  "quickWin": "Get a quote for a ''Business Owners Policy'' (BOP) that bundles GL and E&O.",
  "warningSign": "Accepting work without liability coverage."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 5)
AND lesson_number = 3;

-- Lesson 5.4: Equipment Investment Strategy
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Buy gear that pays for itself. Don''t buy toys.",
  "introduction": {
    "hook": "A $50 pole can make you $5,000 faster.",
    "context": "You need tools to access roofs, measure grass, and verify systems.",
    "yourRole": "Procurement."
  },
  "sections": [
    {
      "id": "essential-gear",
      "title": "The Starter Kit (Under $100)",
      "type": "checklist",
      "content": "Do not start without these:",
      "items": [
        "Camera Pole (12ft+): For roof photos from the ground.",
        "High-lumen Flashlight: For dark basements.",
        "Tape Measure (25ft): For determining room sizes.",
        "Voltage Tester (Non-contact): Safety check for wires."
      ]
    },
    {
      "id": "pro-gear",
      "title": "The Pro Upgrades",
      "type": "info-table",
      "content": "When you have cash flow.",
      "data": {
        "headers": ["Item", "Benefit", "ROI"],
        "rows": [
          ["Laser Measure", "Instant room dimensions", "Saves 5 min/house"],
          ["Generator/Inverter", "Charge laptop/phone in car", "Never stop working"],
          ["Drone", "Roof inspections (if licensed)", "Access impossible roofs"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Your phone is your life. Get a rugged case and a rapid charger.",
      "warning": "Running out of battery at 2 PM."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Laser measure.",
      "focus": "You probably have this gear. Put it in the trunk.",
      "warning": "Using your luxury car for gravel road inspections."
    }
  },
  "knowledgeCheck": {
    "question": "Why is a Camera Pole essential for new inspectors?",
    "options": [
      "It looks professional",
      "It allows you to photograph high roofs without carrying/climbing a ladder",
      "It doubles as a walking stick",
      "It helps improved cell signal"
    ],
    "correctIndex": 1,
    "explanation": "Carrying a ladder slows you down and increases liability. A pole gets the roof shot simply and safely."
  },
  "quickWin": "Buy a car inverter (plug outlet for car) to keep your laptop charged.",
  "warningSign": "Buying a drone before you have a flashlight."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 5)
AND lesson_number = 4;

-- Lesson 5.5: Pricing, Negotiation & When to Walk Away
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Volume x Rate = Income. Know your minimum viable rate.",
  "introduction": {
    "hook": "Would you drive 20 miles for $3? Some inspectors do.",
    "context": "Firms will offer low rates. You must calculate if it is profitable.",
    "yourRole": "Contract Negotiator."
  },
  "sections": [
    {
      "id": "math",
      "title": "The Profit Equation",
      "type": "steps",
      "content": "Calculate your cost per stop.",
      "steps": [
        "Estimate Time (Drive + Inspect + Report).",
        "Estimate Mileage Cost ($0.65/mile).",
        "Subtract expenses from Fee.",
        "Divide by Hours = Hourly Wage."
      ]
    },
    {
      "id": "negotiation",
      "title": "When to Negotiate",
      "type": "tips",
      "content": "You can ask for more.",
      "tips": [
        { "title": "Rural/Distance", "content": "Ask for a ''Trip Fee'' or ''Rural Surcharge''." },
        { "title": "Rush", "content": "If they need it TODAY, the price goes up." },
        { "title": "Bulk", "content": "Accept lower rates if you get 10 houses in one neighborhood (density)." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Don''t accept $5 tasks unless they are next door to a $20 task.",
      "warning": "Chasing low-pay volume that burns gas."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Value of time.",
      "focus": "$15 BPO? No. $50 Rush Inspection? Yes. Know your hourly goal.",
      "warning": "Assuming fees are fixed. They are often negotiable."
    }
  },
  "knowledgeCheck": {
    "question": "When is it smart to accept a lower-than-usual fee?",
    "options": [
      "Always, to make the client happy",
      "When the order is right next to another order you are already doing (Route Density)",
      "When you are bored",
      "Never"
    ],
    "correctIndex": 1,
    "explanation": "Density is key. $10 profit is bad if you drive 20 mins. It''s great if you are already on the street."
  },
  "quickWin": "Set a ''Minimum Stop Fee''. If a job pays less than $X, decline it unless it''s mapped with others.",
  "warningSign": "Being afraid to decline work. ''No'' is a business tool."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 5)
AND lesson_number = 5;

-- Lesson 5.6: Scaling: From Part-Time to Full-Time Pro
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Scaling requires systems, not just hustle.",
  "introduction": {
    "hook": "You can only inspect so many houses in a day. To grow, you need efficiency or coverage.",
    "context": "Moving from $1k/month to $5k+/month requires route density and client diversification.",
    "yourRole": "Growth Strategist."
  },
  "sections": [
    {
      "id": "more-clients",
      "title": "The Client Portfolio",
      "type": "danger-list",
      "content": "Don''t rely on one firm.",
      "items": [
        { "title": "Eggs in one basket", "content": "If your only client loses their contract, you lose 100% of income." },
        { "title": "The Plateau", "content": "One client only has so much work in your zip code." }
      ]
    },
    {
      "id": "scaling-steps",
      "title": "Phases of Growth",
      "type": "timeline",
      "content": "The roadmap.",
      "data": {
        "headers": ["Phase", "Activity", "Income Goal"],
        "rows": [
          ["Rookie", "1-2 Clients, Learning ropes", "$500-$1500/mo"],
          ["Pro", "3-5 Clients, Optimized Routes", "$2000-$4000/mo"],
          ["Elite", "Direct Contracts, Coverage Area Expansion", "$5000+/mo"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Stack this with other gig work until inspection volume takes over.",
      "warning": "Quitting your day job too soon."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Use inspections to fill the gaps between signings.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "What is the safest way to increase your monthly income stability?",
    "options": [
      "Drive faster",
      "Work 7 days a week",
      "Diversify with multiple clients/platforms",
      "Only take high-pay/high-complexity jobs"
    ],
    "correctIndex": 2,
    "explanation": "Diversification protects you from dry spells with any single vendor."
  },
  "quickWin": "Sign up with 3 new firms this weekend. It takes time to get approved, so start now.",
  "warningSign": "Getting comfortable with one client."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 5)
AND lesson_number = 6;
