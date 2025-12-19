export const basicFieldInspectionModules = [
  {
    id: 'orientation',
    title: 'Orientation to mortgage field inspections',
    description:
      'Understand how lenders use your reports, the inspection types you will see most often, and how to keep routes predictable.',
    duration: '12 min',
    type: 'Lesson',
    syllabus: [
      'Where field reports fit in the lender workflow',
      'Common inspection categories you will accept',
      'Ground rules for safety, photos, and notes',
    ],
    videoUrl: 'https://www.youtube.com/embed/UAuJ8tqm9w4', // "The Unseen Inspector"
    flashcards: [
      { front: "What is the fundamental difference in purpose between a field inspection and a home inspection?", back: "Field inspections are targeted assessments for lenders and insurers, while home inspections are comprehensive evaluations for potential buyers." },
      { front: "Field inspectors operate with a much narrower scope than home inspectors and do not test drain lines, check thermostat functionality, or inspect _____.", back: "ductwork or ventilation systems" },
      { front: "What are the three essential pieces of equipment for a field inspector, often called the 'Holy Trinity'?", back: "A smartphone with a high-quality camera, a backup battery/charger, and a visibly worn ID badge." },
      { front: "According to standard photo requirements, all photos must be clear, readable, horizontal, not taken through glass, and must not contain _____.", back: "car parts" },
      { front: "For an occupied property, what two occupancy indicators are required?", back: "Two photos demonstrating that the property is occupied." },
      { front: "If a contact/interview is ordered for an occupied property, what specific photo must be taken to document the attempt?", back: "A photo of an arm knocking on the door OR feet on the front porch." },
      { front: "For a vacant property, how many photos of the vacancy posting are required, and what must they show?", back: "Two photos are required: one up close and readable, and one showing the posting on the front door." },
      { front: "What action must an inspector take at the water spigot of a vacant property?", back: "Turn it on and take a photo." },
      { front: "When an interior inspection is ordered, what must be photographed regarding the electric meter?", back: "The electric meter with a Volt Stick." },
      { front: "If an interior inspection is ordered and toilets are tapped down, what is the photo requirement?", back: "Photos of each toilet are required to show that they are tapped down." },
      { front: "What is the primary goal of an Occupancy / Property Condition Report (PCR)?", back: "To confirm whether the property appears occupied and capture condition indicators for servicing decisions." },
      { front: "What is the primary goal of a Draw Inspection?", back: "To verify completed work against a scope, which is used to release funds in stages." },
      { front: "A common pitfall in Draw Inspections is reporting _____ as completed work.", back: "materials on site" },
      { front: "What type of inspection documents repair progress after an insured loss so that funds can be disbursed appropriately?", back: "A Loss Draft Inspection." },
      { front: "In the context of mortgage servicing, what does the acronym 'PCR' stand for?", back: "Property Condition Report." },
      { front: "In report writing, what is the 'two-photo rule' for documentation discipline?", back: "Take a context shot first, then a detail shot." },
      { front: "What is a key principle of 'Access and Trespass Discipline' for field inspectors?", back: "Only enter when the work order authorizes entry and the access method is approved." },
      { front: "According to the 'Lender Workflow Overview', a coordinator or vendor management team performs what initial action on a submitted report?", back: "They conduct the first-pass review and make rejection decisions." },
      { front: "A key quality rule for inspectors is to never infer occupancy; instead, one must use _____ and state them neutrally.", back: "indicators" },
      { front: "What is the primary job of a field services coordinator?", back: "To prevent bad data from hitting the client." },
      { front: "A common reason for report rejection is 'Occupancy unsupported'; what is the fix pattern for this issue?", back: "Use an indicator list and document only observable facts." },
      { front: "What does the '6-Angle Rule' for photos typically require?", back: "Front, Left Angle, Right Angle, Street View Left, Street View Right, and House Number." },
      { front: "When writing notes, an inspector should use objective language like 'Siding is discolored' instead of subjective language like '_____'.", back: "Siding looks ugly and old" },
      { front: "What is a 'draw' in the context of a loss draft or construction inspection?", back: "A staged release of funds for verified completed work." }
    ],
    quiz: [
      {
        question: "What is the primary purpose of an occupancy inspection?",
        options: [
          "To evict the tenant",
          "To verify if the property is occupied or vacant",
          "To check the foundation stability",
          "To collect rent"
        ],
        correctIndex: 1
      },
      {
        question: "When should you mention you are there on behalf of the 'bank'?",
        options: [
          "Always directly states the bank name",
          "Never - use generic terms like 'mortgage servicer' or just 'occupancy check'",
          "Only if the neighbor asks",
          "When leaving a voicemail"
        ],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'field-kit',
    title: 'Field kit and photo standards',
    description:
      'Dial in the gear that keeps you efficient: bag setup, batteries, lighting, and the framing standards firms expect in every upload.',
    duration: '15 min',
    type: 'Checklist',
    syllabus: [
      'Bag layout for interior and exterior routes',
      'Angle, distance, and timestamp expectations',
      'File naming and backup habits that prevent rework',
    ],
    videoUrl: 'https://www.youtube.com/embed/7C141_zC9UI',
    flashcards: [
      { front: "What is the minimum acceptable resolution standard for submitted inspection photos?", back: "1024x768 (though 1600x1200 is preferred)." },
      { front: "Which piece of equipment is considered mandatory 'Core Tech' to prevent fieldwork failure from dead batteries?", back: "A portable power bank with at least 10,000mAh." },
      { front: "What is the 'Golden Rule' for documenting damage?", back: "Take a wide 'Context' shot first, then a close-up 'Detail' shot with scale (ruler/tape)." },
      { front: "True or False: It is acceptable to photograph through a window to see if a property is occupied.", back: "False. Never look or photograph inside windows or mailboxes; it is a major privacy violation." },
      { front: "If a utility meter is dirty or hard to read, what should you do instead of just noting it?", back: "Clean the face (if accessible), adjust your angle, or use a flashlight to get a readable photo." },
      { front: "What is the 'fix pattern' for a dark, blurry photo that gets rejected for quality?", back: "Ensure the image is sharp at 100% zoom and well-lit. Use flash if necessary, but step back to avoid washout." },
      { front: "What should you carry as a backup in case your inspection app crashes completely?", back: "A small notepad and pen to log field notes manually." },
      { front: "What constitutes an 'Obstruction' in photo framing that could lead to rejection?", back: "Fingers, camera straps, dashboard glare, or car mirrors appearing in the frame." },
      { front: "What is the recommended file naming convention to prevent data loss?", back: "ORDERID_ADDRESS_SECTION_SEQUENCE_DESC.jpg (e.g., 98765_45ELM_DMG_01_Peeling.jpg)" },
      { front: "If you encounter a high-liability hazard (e.g., missing porch rail > 3ft), what are your two obligations?", back: "1. Document it thoroughly (Context + Detail). 2. Communicate it immediately to your manager/client." },
      { front: "Why must photo metadata (time/date) be enabled even if visible stamps are prohibited?", back: "QC relies on the underlying metadata to validate when the fieldwork actually occurred." },
      { front: "When photographing a dark interior, what is the best lighting technique?", back: "Use the flash, but step back slightly to avoid 'blown highlights' (overexposure)." }
    ],
    quiz: [
      {
        question: "Which piece of equipment is mandatory for preventing fieldwork failure caused by a depleted mobile device battery?",
        options: [
          "GPS device with offline maps",
          "Laser measure",
          "Portable phone charger/power bank (10,000mAh minimum)",
          "Two-way radio"
        ],
        correctIndex: 2
      },
      {
        question: "What is the minimum acceptable resolution standard for submitted inspection photos?",
        options: [
          "1600x1200",
          "640x480",
          "1024x768",
          "1920x1080"
        ],
        correctIndex: 2
      },
      {
        question: "If you submit a photo that is dark and blurry, which core QC standard is being violated?",
        options: [
          "Photo must be 4:3 ratio",
          "Photo must be a JPEG file",
          "The image must be sharp and clear enough for someone else to identify the location/condition without notes",
          "The image must include a visible timestamp"
        ],
        correctIndex: 2
      },
      {
        question: "What two actions are strictly prohibited as privacy violations?",
        options: [
          "Photographing utility meters and climbing ladders",
          "Looking or photographing inside any windows or mailboxes",
          "Photographing the insured's car or trash can",
          "Documenting the address and nearest street sign"
        ],
        correctIndex: 1
      },
      {
        question: "What is the correct technique for documenting damage (e.g., wood rot)?",
        options: [
          "Take only a single close-up shot",
          "Take a photo from the street zoomed in",
          "Capture a wide wall shot (context) followed by a close-up using a ruler/tape for scale (detail)",
          "Only photograph if it exceeds 3 feet"
        ],
        correctIndex: 2
      },
      {
        question: "True or False: If your app crashes, you should rely solely on raw photos.",
        options: [
          "True",
          "False - maintain a notepad/pen backup for notes"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: If a meter is dirty, you should just note it as 'unreadable'.",
        options: [
          "True",
          "False - you must adjust framing, lighting, or angle to capture a readable face"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: You should sync photos to cloud immediately and copy to a second location at end of day.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 0
      },
      {
        question: "Why is the file naming convention (ORDERID_ADDRESS_DESC) superior to simple numbering?",
        options: [
          "It looks cooler",
          "It helps locate specific images quickly for review or resubmission",
          "It makes the files smaller",
          "It allows for faster upload speeds"
        ],
        correctIndex: 1
      },
      {
        question: "What are your obligations if you encounter a high-liability hazard (e.g., missing rail)?",
        options: [
          "Fix it immediately",
          "Ignore it if it wasn't on the work order",
          "Document it (Context+Detail) AND Contact management immediately",
          "Put caution tape around it"
        ],
        correctIndex: 2
      },
      {
        question: "How should you photograph a dark living room to avoid underexposure and noise?",
        options: [
          "Use flash from very close range",
          "Use flash but step back slightly to avoid blown highlights",
          "Turn on flashlight only",
          "Open all blinds only"
        ],
        correctIndex: 1
      },
      {
        question: "Which of the following is considered an obstruction that could lead to rejection?",
        options: [
          "A ruler for scale",
          "Shadow of a detached structure",
          "Dashboard glare, sun glare, or fingers/straps in frame",
          "The driveway curb"
        ],
        correctIndex: 2
      },
      {
        question: "What is the purpose of subfolders like '01-Exterior'?",
        options: [
          "To comply with resolution requirements",
          "To optimize data management and quickly locate photos by category",
          "To ensure GPS metadata is attached",
          "To make photos sync automatically"
        ],
        correctIndex: 1
      },
      {
        question: "Why must underlying metadata be accurate even if visible stamps are prohibited?",
        options: [
          "To confirm photo wasn't edited",
          "To confirm 4:3 ratio",
          "QC relies on it to validate when fieldwork occurred",
          "To distinguish vertical from horizontal"
        ],
        correctIndex: 2
      },
      {
        question: "What should you do immediately upon arriving at a property?",
        options: [
          "Knock on the door to determine if insured is present",
          "Take the Front photo",
          "Begin the exterior loop",
          "Put on safety vest"
        ],
        correctIndex: 0
      },
      {
        question: "True or False: Capturing occupancy indicators (car/trash) is acceptable if you avoid faces.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 0
      },
      {
        question: "True or False: The 'Context shot' must always be taken AFTER the 'Detail shot'.",
        options: [
          "True",
          "False - Always capture Context THEN Detail"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: Minimum photo resolution is 1600x1200.",
        options: [
          "True",
          "False - Minimum is 1024x768"
        ],
        correctIndex: 1
      },
      {
        question: "How do you document an 'Access Issue' like overgrown vegetation?",
        options: [
          "Skip the photo",
          "Write a note only",
          "Photograph the obstruction and note it, attempting alternate angles",
          "Cut down the vegetation"
        ],
        correctIndex: 2
      },
      {
        question: "If you have no cell signal, what is the crucial backup step?",
        options: [
          "Drive until you find signal immediately",
          "Use notepad to log key photos as backup and sync immediately upon return to signal",
          "Wait until tomorrow",
          "Send via snail mail"
        ],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'core-inspections',
    title: 'Complete your first occupancy and loss draft inspections',
    description:
      'Walk through a sample job from dispatch to submission with scripts, photo sets, and customer etiquette baked in.',
    duration: '18 min',
    type: 'Walkthrough',
    syllabus: [
      'Pre-call checklist and arrival notes',
      'Exterior sweep, interior rooms, and measurements',
      'Uploading proofs that avoid lender callbacks',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    quiz: [
      {
        question: "If a property appears vacant but the lawn is mowed, how do you verify occupancy?",
        options: [
          "Mark it as occupied immediately",
          "Check for personal items through windows, or check utility meters",
          "Ask the mailman and take his word for it",
          "Guess based on the neighbors' houses"
        ],
        correctIndex: 1
      },
      {
        question: "What is a 'Loss Draft' inspection?",
        options: [
          "Checking for lost mail",
          "Verifying repairs are being made after an insurance claim payout",
          "Drafting a letter to the homeowner",
          "Inspection of a lost property"
        ],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'preferred-list',
    title: 'Submitting reports that keep you on the preferred list',
    description:
      'Turn in polished reports that coordinators can approve quickly so you keep getting the best routes.',
    duration: '14 min',
    type: 'Review',
    syllabus: [
      'Structuring notes for different firm templates',
      'Double-checks before you hit send',
      'What happens after submission and how to follow up',
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    quiz: [
      {
        question: "How quickly should you submit a routine inspection report?",
        options: [
          "Whenever you get around to it",
          "Within 24-48 hours of the site visit",
          "At the end of the month",
          "Before the sun sets"
        ],
        correctIndex: 1
      },
      {
        question: "What is the best way to handle a dispute from a coordinator?",
        options: [
          "Argue and shout",
          "Calmly provide photo evidence that supports your finding",
          "Delete the order",
          "Ignore the email"
        ],
        correctIndex: 1
      }
    ]
  },
]
