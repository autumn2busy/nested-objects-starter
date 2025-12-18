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
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    quiz: [
      {
        question: "What is the most critical requirement for inspection photos?",
        options: [
          "They must be artistic and moody",
          "They must include a visible date/time stamp",
          "They must be taken with a DSLR camera",
          "They must include your smiling face"
        ],
        correctIndex: 1
      },
      {
        question: "How many angles should you capture for the 'Front of House' photo?",
        options: [
          "Just one from the driveway",
          "At least two angles (Street View & Direct View) to prove address context",
          "None, satellite view is enough",
          "Only the house number"
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
