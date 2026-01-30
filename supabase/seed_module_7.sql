-- ============================================================================
-- MODULE 7: Professional Communication
-- ============================================================================

-- Add video URL to module
UPDATE training_modules 
SET video_url = 'https://youtu.be/24YaMwxp26Q'
WHERE module_number = 7;

-- Lesson 7.1: Coordinator Communication Excellence
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Your coordinator controls your income. Make their life easy, and they will give you the best work.",
  "introduction": {
    "hook": "If a coordinator has to call you to ask where a report is, you have already failed.",
    "context": "Coordinators manage hundreds of orders. They love inspectors who are proactive and hate inspectors who ghost them.",
    "yourRole": "Problem Solver."
  },
  "sections": [
    {
      "id": "communication-channels",
      "title": "Channels of Communication",
      "type": "comparison-table",
      "content": "When to use what.",
      "data": {
        "headers": ["Scenario", "Channel", "Responsiveness"],
        "rows": [
          ["Routine Update", "App Note / Email", "Within 4 hours"],
          ["Cannot Access Property", "Call Immediately from site", "Immediate"],
          ["Accepting Work", "App / Email", "Within 1 hour"]
        ]
      }
    },
    {
      "id": "bad-news",
      "title": "Delivering Bad News",
      "type": "tips",
      "content": "If you are going to be late.",
      "tips": [
        { "title": "Tell them early", "content": "''I will be late'' at 9 AM is fine. ''I am late'' at 5 PM is bad." },
        { "title": "Give a new ETA", "content": "Don''t just say late. Say ''Will be submitted by 9 AM tomorrow''." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "App reliability.",
      "focus": "There is a human behind the app. Reply to their messages effectively.",
      "warning": "Treating the coordinator like a chatbot."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "Professionalism.",
      "focus": "You know how signing services work. Same dynamic.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "",
      "focus": "You are not the client here. You are the vendor. Adjust tone accordingly.",
      "warning": "Acting superior to the coordinator."
    }
  },
  "knowledgeCheck": {
    "question": "If you encounter a locked gate and cannot complete the inspection, when should you contact the coordinator?",
    "options": [
      "When you get home",
      "The next day",
      "Immediately, while still at the property",
      "Never, just mark it incomplete"
    ],
    "correctIndex": 2,
    "explanation": "Call *while on site*. They may have the gate code on file or be able to call the homeowner to let you in, saving you a return trip."
  },
  "quickWin": "Save your coordinator''s direct line in your contacts as ''[Company] Dispatch'' so you recognize the call.",
  "warningSign": "Ignoring calls from numbers you don''t recognize (it might be work)."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 7)
AND lesson_number = 1;

-- Lesson 7.2: Occupant Interaction Scripts
UPDATE training_lessons 
SET content = '{
  "coreConcept": "De-escalate, Verify, Depart. You are not there to make friends or enemies.",
  "introduction": {
    "hook": "Homeowners are often scared of banks. You are the face of the bank. Tread lightly.",
    "context": "You will knock on doors of people in foreclosure. Tension is high.",
    "yourRole": "Neutral Messenger."
  },
  "sections": [
    {
      "id": "the-opener",
      "title": "The Opening Script",
      "type": "steps",
      "content": "Memorize this.",
      "steps": [
        "Step back 6 feet from the door (give space).",
        "Show ID immediately.",
        "''Hi, I''m [Name], an independent inspector verifying occupancy for a mortgage client.''",
        "''I do not have account details. I just need to verify who resides here.''"
      ]
    },
    {
      "id": "faq",
      "title": "Common Questions",
      "type": "info-table",
      "content": "How to answer.",
      "data": {
        "headers": ["Question", "Your Answer"],
        "rows": [
          ["''Are they kicking me out?''", "''I don''t know anything about the loan status. I''m just updating the property records.''"],
          ["''Who sent you?''", "''My work order is from [Mortgage Company/Servicer].''"],
          ["''Can you fix this?''", "''I will document the damage in my report so they know about it.''"]
        ]
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Speed.",
      "focus": "Don''t linger. Get the info and go.",
      "warning": "Trying to guess the homeowner''s situation."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "Verification.",
      "focus": "You are great at this. Use your ID verification skills.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Sales.",
      "focus": "DO NOT SELL. Do not offer to list the house. Huge conflict of interest.",
      "warning": "Giving a business card that says ''Realtor''."
    }
  },
  "knowledgeCheck": {
    "question": "If a homeowner asks ''Is the bank foreclosing on me?'', what is the correct response?",
    "options": [
      "''Yes, probably.''",
      "''I don''t have access to your account details. I am only here to verify the property condition.''",
      "''No, you are fine.''",
      "''Call your lawyer.''"
    ],
    "correctIndex": 1,
    "explanation": "Never speculate on loan status. You don''t know, and saying the wrong thing causes legal liability for the bank."
  },
  "quickWin": "Practice your opening line in the mirror. It must sound robotic and calm.",
  "warningSign": "Apologizing profusely. Be polite, but you have a right to be there."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 7)
AND lesson_number = 2;

-- Lesson 7.3: De-escalation & Difficult Situations
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Anger comes from fear. Reduce the fear to reduce the anger.",
  "introduction": {
    "hook": "A clipboard looks like a weapon to someone who is paranoid.",
    "context": "People are protective of their homes. 99% of interactions are fine; prepare for the 1%.",
    "yourRole": "Calm Professional."
  },
  "sections": [
    {
      "id": "body-language",
      "title": "Defensive Body Language",
      "type": "checklist",
      "content": "Project safety.",
      "items": [
        "Hands visible at all times (no hands in pockets).",
        "Stand sideways (bladed stance) - less aggressive target.",
        "Keep 6-10 feet of distance.",
        "Never block the doorway/exit."
      ]
    },
    {
      "id": "exit-strategy",
      "title": "The Exit Strategy",
      "type": "danger-list",
      "content": "When they yell ''Get off my property!'':",
      "items": [
        { "title": "Do not argue", "content": "You will not win." },
        { "title": "Say ''Okay''", "content": "''Okay, I''m leaving right now.'' Then walk away." },
        { "title": "Do not turn your back", "content": "Back away to your car." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Safety over speed. If it feels weird, leave.",
      "warning": "Argued back with a customer."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "",
      "focus": "You are usually in controlled environments. The porch is uncontrolled.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Confidence.",
      "focus": "Use your professional demeanor to calm them down.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "What is the first thing you should do if a homeowner screams at you to leave?",
    "options": [
      "Explain that you have a work order and a right to be there",
      "Call the police",
      "Leave immediately without arguing",
      "Take a photo of them yelling"
    ],
    "correctIndex": 2,
    "explanation": "The inspection is not worth your safety. Leave, go to a safe location, THEN valid the incomplete attempt with your coordinator."
  },
  "quickWin": "Park your car facing the exit so you don''t have to reverse out of a driveway under stress.",
  "warningSign": "Walking past a ''No Trespassing'' sign into a fenced yard."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 7)
AND lesson_number = 3;

-- Lesson 7.4: Written Communication Standards
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Your report is a legal document. Write facts, not feelings.",
  "introduction": {
    "hook": "''The roof looks bad'' is an opinion. ''The roof has missing shingles'' is a fact.",
    "context": "Banks make million-dollar decisions based on your text fields.",
    "yourRole": "Court Reporter."
  },
  "sections": [
    {
      "id": "obj-vs-subj",
      "title": "Objective vs Subjective",
      "type": "comparison-table",
      "content": "The Gold Standard.",
      "data": {
        "headers": ["Subjective (Bad)", "Objective (Good)"],
        "rows": [
          ["''The house is a dump.''", "''Debris observed in yard. Broken windows noted.''"],
          ["''It smells moldy.''", "''Musty odor detected in basement. Discoloration on walls.''"],
          ["''Angry homeowner.''", "''Occupant declined inspection and requested departure.''"]
        ]
      }
    },
    {
      "id": "grammar",
      "title": "Grammar Matters",
      "type": "tips",
      "content": "It affects credibility.",
      "tips": [
        { "title": "No Text Speak", "content": "Use ''You'' not ''u''. Capitalize sentences." },
        { "title": "Spell Check", "content": "''Vacant'' not ''Vacit''." }
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "This is a professional report. Write it like a resume.",
      "warning": "Using emojis or slang."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "Precision.",
      "focus": "You are great at this. Keep it formal.",
      "warning": "None."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Description.",
      "focus": "Avoid ''marketing'' language (''Cozy kitchen''). Use ''Small kitchen''.",
      "warning": "Flowery language."
    }
  },
  "knowledgeCheck": {
    "question": "Which comment is appropriate for an inspection report?",
    "options": [
      "''This place is a disaster zone.''",
      "''Trash and personal property accumulation observed in front yard.''",
      "''The owner is lazy and hasn''t mowed.''",
      "''Grass is high 👎''"
    ],
    "correctIndex": 1,
    "explanation": "Descriptive, factual, and non-judgmental. It describes the condition, not the character of the owner."
  },
  "quickWin": "Use voice-to-text, BUT proofread it. ''Soffit'' often auto-corrects to ''Soft it''.",
  "warningSign": "Typing in all caps (IT LOOKS LIKE YELLING)."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 7)
AND lesson_number = 4;

-- Lesson 7.5: Building Your Professional Reputation
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Reliability is the only currency that matters.",
  "introduction": {
    "hook": "There are inspectors who are faster than you. Be the one who is more RELIABLE.",
    "context": "Contractors are notorious for flaking. Being the one who always shows up makes you indispensable.",
    "yourRole": "The ''Go-To'' Guy/Gal."
  },
  "sections": [
    {
      "id": "reliability-score",
      "title": "The Vendor Scorecard",
      "type": "info-table",
      "content": "How firms grade you (secretly).",
      "data": {
        "headers": ["Metric", "Goal", "Impact"],
        "rows": [
          ["On-Time %", "98%+", "Access to RUSH orders"],
          ["Acceptance Rate", "90%+", "Priority routing"],
          ["Correction Rate", "< 5%", "Less QA scrutiny"]
        ]
      }
    },
    {
      "id": "appearance",
      "title": "Appearance Standards",
      "type": "checklist",
      "content": "Look the part.",
      "items": [
        "Collared Shirt (Polo) or clean T-shirt.",
        "Safety Vest (looks official).",
        "ID Badge visible (lanyard).",
        "Clean car (it''s your office)."
      ]
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "",
      "focus": "Dress up slightly. No pajamas or gym shorts.",
      "warning": "Looking like you just rolled out of bed."
    },
    "realtor": {
      "title": "For Realtors",
      "edge": "Polished.",
      "focus": "You don''t need a suit. Business casual / Field casual is fine.",
      "warning": "Overdressing (heels/dress shoes on a construction site)."
    }
  },
  "knowledgeCheck": {
    "question": "Why is wearing an ID Badge and Safety Vest recommended?",
    "options": [
      "It is required by law",
      "It projects authority and reduces homeowner suspicion",
      "It keeps you warm",
      "It isn''t recommended"
    ],
    "correctIndex": 1,
    "explanation": "Looking ''official'' disarms suspicious neighbors. A person in a vest with a clipboard belongs there; a person in a hoodie looks like a prowler."
  },
  "quickWin": "Order a generic ''Field Inspector'' vest on Amazon for $15.",
  "warningSign": "Wearing sandals or flip-flops to an inspection."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 7)
AND lesson_number = 5;

-- Lesson 7.6: Handling Complaints & Feedback
UPDATE training_lessons 
SET content = '{
  "coreConcept": "Feedback is not an attack. It is a correction course.",
  "introduction": {
    "hook": "You will get a ''Kickback'' (correction request). Everyone does. Don''t take it personally.",
    "context": "QA''s job is to protect the bank. If they ask for a new photo, just get it.",
    "yourRole": "Professional Learner."
  },
  "sections": [
    {
      "id": "rebuttal",
      "title": "The Rebuttal Process",
      "type": "steps",
      "content": "If you are right, prove it.",
      "steps": [
        "Read the rejection reason calmly.",
        "Check your backup photos (metadata proves you were there).",
        "Reply with facts: ''Photo 4 shows the address. Time stamped 2:00 PM.''",
        "If you are wrong, fix it fast."
      ]
    },
    {
      "id": "mindset",
      "title": "The 24-Hour Rule",
      "type": "callout",
      "callout": {
        "type": "info",
        "title": "Cool Down",
        "content": "Never reply to a negative email while angry. Draft it, wait 10 minutes, then send."
      }
    }
  ],
  "audienceGuidance": {
    "gig-worker": {
      "title": "For Gig Workers",
      "edge": "Ratings.",
      "focus": "This isn''t a 1-star review that ruins you. It''s just a fix request.",
      "warning": "Arguing with support."
    },
    "notary": {
      "title": "For Notaries",
      "edge": "Accuracy.",
      "focus": "You fix errors in docs. Fix errors in reports same way.",
      "warning": "None."
    }
  },
  "knowledgeCheck": {
    "question": "What is the best response if QA rejects a photo for being too dark?",
    "options": [
      "Argue that it looked fine on your phone",
      "Edit the photo brightness in Photoshop",
      "Return to the property (if needed) or upload a backup shot",
      "Email the CEO"
    ],
    "correctIndex": 2,
    "explanation": "Do not edit/alter photos digitally (fraud). Upload a better original or re-shoot."
  },
  "quickWin": "Thank the QA person when they catch a mistake. They saved you from a client rejection.",
  "warningSign": "Taking corrections personally."
}'
WHERE module_id = (SELECT id FROM training_modules WHERE module_number = 7)
AND lesson_number = 6;
