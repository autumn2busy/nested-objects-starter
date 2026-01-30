-- ============================================================================
-- MODULE 6: Advanced Routing & Efficiency
-- ============================================================================

-- Add video URL to module
UPDATE training_modules 
SET video_url = 'https://youtu.be/4EB3BQ6KB9o'
WHERE module_number = 6;

-- Lesson 6.1: Territory Analysis & ZIP Code Strategy
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Your territory is your factory floor. Define it strictly or you will lose money on gas.",
  "introduction": {
    "hook": "Accepting a job 10 miles outside your zone doesn''t just cost gas; it costs you the opportunitity to do 3 jobs INSIDE your zone along with it.",
    "context": "Firms will try to push you further out. You must know your profitable boundaries.",
    "yourRole": "Logistics Manager."
  },
  "sections": [
    {
      "id": "defining-territory",
      "title": "Defining Your Zone",
      "type": "steps",
      "content": "Draw your lines.",
      "steps": [
        "Pick a ''Home Base'' (your house).",
        "Determine max radius (e.g., 20 miles).",
        "Identify high-density ZIP codes within that radius.",
        "Reject work outside this radius unless fees are tripled."
      ]
    },
    {
      "id": "density-math",
      "title": "Density vs Distance",
      "type": "comparison-table",
      "content": "Why density wins.",
      "data": {
        "headers": ["Scenario", "Distance", "Pay", "Profit/Hour"],
        "rows": [
          ["Scenario A", "1 job, 30 miles away", "$30", "$10/hr (Loser)"],
          ["Scenario B", "5 jobs, 5 miles away", "$15 each ($75 total)", "$50/hr (Winner)"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "You know hot zones.",
      "focus": "Apply your ''surge zone'' mentality here. Stick to the dense areas.",
      "warning": "Chasing a high-dollar job into the middle of nowhere."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Don''t let your signing radius dictate your inspection radius. Inspections pay less per stop, so the radius must be smaller.",
      "warning": "Driving 40 mins for a $15 inspection."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Farming area.",
      "focus": "Align your inspection territory with your real estate farm area. Two birds, one stone.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "What is the ''Density'' strategy?",
    "options": [
      "Inspecting heavier houses",
      "Prioritizing clusters of low-pay jobs close together over single high-pay jobs far away",
      "Only working in cities",
      "Filling your car with gas"
    ],
    "correctIndex": 1,
    "explanation": "Five $10 jobs on the same street (50 mins total) is $50/hr. One $30 job that takes 90 mins to drive to is $20/hr. Density is King."
  },
  "quickWin": "List out the 5 ZIP codes closest to your house. Make these your ''Auto-Accept'' list.",
  "warningSign": "Saying ''Yes'' to every zip code the recruiter asks about."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 6)
AND lesson_number = 1;

-- Lesson 6.2: Route Optimization Software & Techniques
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Using Google Maps one-by-one is for amateurs. Pros use multi-stop routing.",
  "introduction": {
    "hook": "The ''Traveling Salesman Problem'' is hard math. Humans are bad at it. Computers are good at it.",
    "context": "Zig-zagging across town wastes hours. A route optimizer straightens the line.",
    "yourRole": "Navigator."
  },
  "sections": [
    {
      "id": "optimization-tools",
      "title": "The Tools",
      "type": "comparison-table",
      "content": "What to use.",
      "data": {
        "headers": ["Tool", "Cost", "Best For"],
        "rows": [
          ["Google Maps", "Free", "< 9 stops (Manual reordering)"],
          ["Circuit / RoadWarrior", "$20/mo", "10+ stops (Automatic optimization)"],
          ["Nested Objects App", "Included", "Integrated routing (Coming Soon)"]
        ]
      }
    },
    {
      "id": "loop-strategy",
      "title": "The Cloverleaf Strategy",
      "type": "tips",
      "content": "How to structure the day.",
      "tips": [
        { "title": "Start furthest out", "content": "Drive to the furthest point first, then work your way back home." },
        { "title": "Right turns only", "content": "Like UPS, minimizing left turns saves time and gas (advanced)." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Amazon Flex drivers know this.",
      "focus": "Use the same apps you use for delivery. The logic is identical.",
      "warning": "Manually typing addresses while driving."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "Group inspections BETWEEN your fixed-time appointments.",
      "warning": "Letting a $20 inspection make you late for a $100 signing."
    }
  },
  "knowledgeCheck": {
    "question": "What is the primary benefit of ''Start Furthest Out'' routing?",
    "options": [
      "It warms up the car engine",
      "You do the longest drive while fresh, and your commute home gets shorter as the day goes on",
      "Traffic is better",
      "It avoids tolls"
    ],
    "correctIndex": 1,
    "explanation": "Psychologically and physically, ending the day with short hops near home is better than facing a 60-minute commute after your last job."
  },
  "quickWin": "Download the Circuit app (free trial) and input 5 dummy addresses to see how it reorders them.",
  "warningSign": "Entering addresses into GPS one at a time after every stop."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 6)
AND lesson_number = 2;

-- Lesson 6.3: Batching Strategies for Maximum Efficiency
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Context switching kills productivity. Batch similar tasks together.",
  "introduction": {
    "hook": "Do not inspect, then upload, then inspect, then upload. Inspect all day. Upload all night.",
    "context": "Field work requires different brain/gear than computer work. Separate them.",
    "yourRole": "Factory Line Worker."
  },
  "sections": [
    {
      "id": "batch-workflow",
      "title": "The Batch Workflow",
      "type": "workflow-steps",
      "content": "The Ideal Day:",
      "data": {
        "headers": ["Phase", "Activity", "Location"],
        "rows": [
          ["Morning (8-9am)", "Route & Prep. Sync apps.", "Home Office"],
          ["Day (9am-3pm)", "Drive & Inspect. NO EDITING.", "Field"],
          ["Afternoon (4-6pm)", "Upload & Edit. QA checks.", "Home Office/WiFi"]
        ]
      }
    },
    {
      "id": "exceptions",
      "title": "Exceptions to Batching",
      "type": "callout",
      "callout": {
        "type": "warning",
        "title": "Rush Orders",
        "content": "RUSH or Same-Day orders must be uploaded immediately from the field. Do not hold these."
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "You don''t stop delivery to edit photos. Treat this the same.",
      "warning": "Sitting in the driveway for 10 minutes editing photos after every stop."
    },
    "inspector": {
      "title": "For Existing Inspectors",
      "edge": "",
      "focus": "Trust your photo taking skills. Edit later.",
      "warning": "Burning daylight hours on data entry."
    }
  },
  "knowledgeCheck": {
    "question": "Why is it generally better to upload photos at home rather than in the field?",
    "options": [
      "Home internet is faster/stable",
      "Field uploading drains battery and eating daylight hours",
      "Computer screens are bigger for QA checks",
      "All of the above"
    ],
    "correctIndex": 3,
    "explanation": "Efficiency, Battery, Speed, and Quality Control are all improved by batching computer work to a controlled environment."
  },
  "quickWin": "Get a car mount for your phone so you can see your route without holding the device.",
  "warningSign": "Trying to write detailed comments on a phone keyboard in the sun."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 6)
AND lesson_number = 3;

-- Lesson 6.4: Time Management: The Inspector''s Day
UPDATE training_lessons 
SET content = '{
  "coreConcept": "You manage the schedule. Do not let the schedule manage you.",
  "introduction": {
    "hook": "Freedom is the perk of this job. But freedom without discipline is poverty.",
    "context": "You have no boss watching the clock. If you start at 11am, you fail.",
    "yourRole": "Project Manager."
  },
  "sections": [
    {
      "id": "day-structure",
      "title": "Sample Schedule (High Earner)",
      "type": "timeline",
      "content": "How the pros do it.",
      "data": {
        "headers": ["Time", "Activity"],
        "rows": [
          ["7:00 AM", "Review new orders, accept work, map route."],
          ["8:00 AM", "Wheels rolling. Start first job."],
          ["12:00 PM", "Lunch + Battery check."],
          ["3:00 PM", "Last inspection done. Head home."],
          ["4:00 PM", "Uploads and invoicing."]
        ]
      }
    },
    {
      "id": "time-traps",
      "title": "Time Traps",
      "type": "danger-list",
      "content": "Avoid these:",
      "items": [
        { "title": "Over-chatting", "content": "Occupants love to talk. Be polite but leave. ''I have a tight schedule'' is your mantra." },
        { "title": "Lunch detours", "content": "Driving 15 mins off-route for food." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Hustle.",
      "focus": "Maintain that delivery pace.",
      "warning": "Starting the day late."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "Stop networking. Inspection time is production time.",
      "warning": "Talking to the homeowner for 30 minutes."
    }
  },
  "knowledgeCheck": {
    "question": "What is the polite way to exit a conversation with a talkative homeowner?",
    "options": [
      "Walk away while they are talking",
      "''I''m sorry, I have a very tight schedule and good luck with the house.''",
      "Pretend to get a phone call",
      "Ask them to help you inspect"
    ],
    "correctIndex": 1,
    "explanation": "Honesty and professionalism. Most people understand ''I am working''."
  },
  "quickWin": "Pack a cooler. Eating lunch in the car keeps you on route and saves money.",
  "warningSign": "Starting your route at Noon."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 6)
AND lesson_number = 4;

-- Lesson 6.5: Managing Multiple Clients Simultaneously
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Standardize your process so you can serve multiple masters without confusion.",
  "introduction": {
    "hook": "Client A wants 6 photos. Client B wants 20. Confusing them gets you fired from both.",
    "context": "You will eventually work for 3-5 platforms. Each has an app.",
    "yourRole": "Traffic Controller."
  },
  "sections": [
    {
      "id": "client-management",
      "title": "The ''Stacking'' Method",
      "type": "tips",
      "content": "How to handle it.",
      "tips": [
        { "title": "Universal Photo Set", "content": "Take the MAXIMUM required photos for *every* house. Better to have it and not need it." },
        { "title": "One Calendar", "content": "Do not rely on the apps. Put ALL due dates in YOUR calendar." }
      ]
    },
    {
      "id": "app-overload",
      "title": "App Logistics",
      "type": "info-table",
      "content": "Managing the tech.",
      "data": {
        "headers": ["Challenge", "Solution"],
        "rows": [
          ["Different Logins", "Password Manager (LastPass/1Password)"],
          ["Different Deadlines", "Sort by Earliest Due Date regardless of client"],
          ["Battery Drain", "Car charger is mandatory"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Multi-apping.",
      "focus": "You do this with Uber/Lyft/DoorDash. Same concept. Highest priority wins.",
      "warning": "Mixing up the requirements."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "You are used to different lender requirements. Apply that discipline here.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "If Client A requires 10 photos and Client B requires 30 photos, what is the safest strategy?",
    "options": [
      "Take 10 for everyone",
      "Take 30 for everyone (Standardize to the highest common denominator)",
      "Try to remember who wants what",
      "Quit Client B"
    ],
    "correctIndex": 1,
    "explanation": "It takes less energy to just take the extra photos than to constantly switch your mental filter. Standardize your workflow."
  },
  "quickWin": "Create a ''Master Password'' for your phone.",
  "warningSign": "Logging into an app and realizing you forgot the password."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 6)
AND lesson_number = 5;

-- Lesson 6.6: Weather, Seasonality & Demand Patterns
UPDATE training_lessons 
SET content = '{
  "coreConcept": "This is an outdoor sport. Respect the elements.",
  "introduction": {
    "hook": "Inspection volume spikes when the economy dips. Rain delays paychecks.",
    "context": "You need to plan financially for slow months and physically for bad weather.",
    "yourRole": "Forecaster."
  },
  "sections": [
    {
      "id": "seasonality",
      "title": "The Calendar",
      "type": "timeline",
      "content": "Typical flow.",
      "data": {
        "headers": ["Season", "Volume", "Conditions"],
        "rows": [
          ["Spring", "High (Tax refunds = movement)", "Wet/Muddy"],
          ["Summer", "High", "Hot (Overheating phones/cars)"],
          ["Winter", "Low (Holiday moratoriums)", "Short daylight hours"]
        ]
      }
    },
    {
      "id": "weather-prep",
      "title": "Weather Gear",
      "type": "checklist",
      "content": "Keep in the trunk:",
      "items": [
        "Rain boots (Mud is eternal)",
        "Umbrella (Large golf style)",
        "Towel (for drying hands/phone screen)",
        "Hand warmers"
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Rain slows you down. Factor that into your speed.",
      "warning": "Driving in unsafe conditions for a $15 job."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "You know the market cycles. Inspections are often counter-cyclical (more foreclosures when sales drop).",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "How does winter affect inspection capacity?",
    "options": [
      "It doesn''t",
      "You can do more because it''s cooler",
      "Daylight ends at 5 PM, reducing your working hours by 30%",
      "Banks close in winter"
    ],
    "correctIndex": 2,
    "explanation": "You need daylight for exterior photos. In winter, your workday ends at sunset. Plan accordingly."
  },
  "quickWin": "Check the weather forecast every Sunday night to plan your week.",
  "warningSign": "Wearing sneakers in Spring (Mud season)."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 6)
AND lesson_number = 6;
