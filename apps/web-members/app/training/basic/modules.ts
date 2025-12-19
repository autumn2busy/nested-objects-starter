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
    videoUrl: 'https://www.youtube.com/embed/lBFR2W_skrU',
    flashcards: [
      { front: "What is the first photo you should take to establish a 'context-first' workflow?", back: "The nearest street sign or intersection (establishes indisputable location)." },
      { front: "On a digital electric meter, what does 'OPN' indicate?", back: "Open Circuit = Power is OFF." },
      { front: "On a digital electric meter, what does 'CLS' indicate?", back: "Closed Circuit = Power is ON." },
      { front: "What are the 'forbidden words' you must never use with a homeowner?", back: "Delinquency, Foreclosure, or Bank." },
      { front: "What are valid 'Indicators of Life' for occupancy?", back: "Mowed lawn, fresh trash in bins, active utilities (lights), or personal property." },
      { front: "In a Loss Draft inspection, do materials on site (e.g., stack of windows) count towards completion?", back: "No. Materials must be permanently installed to count. Uninstalled = 0%." },
      { front: "If a house is visible 100 yards away behind a locked gate, should you mark 'No Access'?", back: "No. Take a photo of the gate and a zoomed-in photo of the house." },
      { front: "What is the standard for proving a property is 'First Time Vacant'?", back: "A 'through-the-window' photo showing an empty interior (no furniture)." },
      { front: "How should you document a hole in the wall to make it 'dispute-proof'?", back: "Use a scale reference (ruler/tape) in the close-up photo to show exact dimensions." },
      { front: "What does 'weblike' cracking paint indicate in a home built before 1978?", back: "A potential Lead-Based Paint hazard (Critical Habitability Violation)." },
      { front: "What is the 'Partial Vacant' status used for?", back: "Multi-family units where at least one unit is occupied and one is vacant." },
      { front: "Where is the most reliable place to use a volt stick to avoid false positives?", back: "On the wiring leading to the exterior AC condensing unit (avoid the meter base)." }
    ],
    quiz: [
      {
        question: "Which tech step is most critical before losing cell signal in a rural area?",
        options: [
          "Charge phone to 100%",
          "Set camera to portrait mode",
          "Log into portal and download offline templates",
          "Check weather forecast"
        ],
        correctIndex: 2
      },
      {
        question: "What is the first photo you should take to establish 'context-first'?",
        options: [
          "The front door",
          "The electric meter",
          "The nearest street sign or intersection",
          "A close-up of the house number"
        ],
        correctIndex: 2
      },
      {
        question: "A digital meter flashes 'OPN'. What does this indicate?",
        options: [
          "The meter is broken",
          "The power is shut off (Open)",
          "The power is active (Closed)",
          "It is a Smart Meter"
        ],
        correctIndex: 1
      },
      {
        question: "A homeowner asks 'Am I behind on my mortgage?'. What is the only allowed response?",
        options: [
          "Yes, I'm here for the delinquency",
          "I'm not sure, I just take photos",
          "I am completing a property inspection on behalf of the bank/servicer",
          "Check your mail for foreclosure"
        ],
        correctIndex: 2
      },
      {
        question: "Which constitutes an 'Indicator of Life'?",
        options: [
          "Mowed lawn",
          "Fresh trash in bin",
          "Lit porch light",
          "All of the above"
        ],
        correctIndex: 3
      },
      {
        question: "You see 50 new windows in the garage, but old windows are still installed. What % complete are Windows?",
        options: [
          "50% (materials present)",
          "100% (money spent)",
          "0% (materials on-site do not equal installed)",
          "25%"
        ],
        correctIndex: 2
      },
      {
        question: "Your photo is rejected as 'too dark'. How do you fix it?",
        options: [
          "Argue it was shady",
          "Return to site, retake with flash/better light, resubmit as Revision",
          "Brighten in Photoshop",
          "Ignore it"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: If you see the house 100 yards away behind a locked gate, mark 'No Access'.",
        options: [
          "True",
          "False - Zoom in and photograph house + gate"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: Measure walls wall-to-wall at floor level.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 0
      },
      {
        question: "True or False: It is acceptable to include your shadow if the house is visible.",
        options: [
          "True",
          "False - No distractions allowed"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: Taking a screenshot of the 'Submission Successful' screen is optional.",
        options: [
          "True",
          "False - It is your only proof"
        ],
        correctIndex: 1
      },
      {
        question: "A neighbor says the owners moved out 3 weeks ago. What do you do?",
        options: [
          "Mark Occupied (neighbor was there)",
          "Mark Vacant, document neighbor's statement and address as audit trail",
          "Ask neighbor for owner's number",
          "Mark Unknown"
        ],
        correctIndex: 1
      },
      {
        question: "An aggressive dog prevents access to the rear. What do you do?",
        options: [
          "Climb fence anyway",
          "Use deterrent spray",
          "Maintain safety, photograph dog/barrier, inspect from safe vantage point",
          "Leave immediately"
        ],
        correctIndex: 2
      },
      {
        question: "To prove 'First Time Vacant', what specific photo is required?",
        options: [
          "Empty mailbox",
          "Through-the-window shot showing empty interior",
          "Beware of Dog sign",
          "Front door lock"
        ],
        correctIndex: 1
      },
      {
        question: "A contractor threatens you to mark plumbing 100%. What do you do?",
        options: [
          "Change to 100%",
          "Argue back",
          "Politely state you must report only what is visible; the bank decides",
          "Cancel order"
        ],
        correctIndex: 2
      },
      {
        question: "What should be in a close-up photo of a hole in the wall?",
        options: [
          "Business card",
          "Scale reference (ruler/tape)",
          "Homeowner",
          "Entire room"
        ],
        correctIndex: 1
      },
      {
        question: "You see 'weblike' cracking paint in a 1950s home. What is this?",
        options: [
          "Just old paint",
          "Critical Violation (Lead-Based Paint hazard)",
          "Cleaning issue",
          "Sample needed"
        ],
        correctIndex: 1
      },
      {
        question: "What is the minimum photo count for a vacant property?",
        options: [
          "1-3",
          "7-10",
          "12-20+ (Full loop, all meters, vacancy proof)",
          "50 exactly"
        ],
        correctIndex: 2
      },
      {
        question: "Unit A is occupied, Unit B is vacant. What is the status?",
        options: [
          "Occupied",
          "Vacant",
          "Partial Vacant",
          "Unknown"
        ],
        correctIndex: 2
      },
      {
        question: "Where is the best place to test with a volt stick?",
        options: [
          "Meter base",
          "Ceiling wire",
          "Wiring to exterior AC condensing unit",
          "Front door handle"
        ],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'report-writing',
    title: 'Submitting reports that keep you on the preferred list',
    description:
      'Master the technical submission standards, avoid common rejections, and learn the specific "Language of Lending" that coordinators trust.',
    duration: '20 min',
    type: 'Certification',
    syllabus: [
      'The "Gold Standard" for objective notes vs. subjective opinions',
      'Photo requirements: Resolution, metadata, and the "Two-Photo Rule"',
      'Handling rejections and "Access Denial" scenarios professionally',
    ],
    videoUrl: 'https://www.youtube.com/embed/gPHmP0PiGUo',
    flashcards: [
      { front: "What does the acronym GPM stand for in property inspection?", back: "Gallons per minute (used for faucet/showerhead efficiency ratings)." },
      { front: "What is the 'faulty workmanship exclusion' (Exclusion j(6))?", back: "A CGL policy exclusion for property damage to the specific part of work that must be restored because it was performed incorrectly." },
      { front: "According to FHA guidelines, what must an appraiser do if there is evidence of infestation?", back: "Mark 'Evidence of Infestation' and make the appraisal subject to inspection by a pest control specialist." },
      { front: "What organization develops data standards for the U.S. mortgage industry (including ULDD)?", back: "MISMO (Mortgage Industry Standards Maintenance Organization)." },
      { front: "Freddie Mac requires two distinct ratings: one for quality of construction and another for _____.", back: "condition of improvements" },
      { front: "What is the key principle of CGL exclusion 'l. Damage To Your Work'?", back: "It eliminates coverage for damage to the insured's own work after operations are complete (unless performed by a subcontractor)." },
      { front: "Per FHA, what must an appraisal for a methamphetamine-contaminated property be made 'subject to'?", back: "The property being certified safe for habitation." },
      { front: "What is a 'root cause' of workplace incidents according to OSHA?", back: "Failure to identify or recognize hazards that strictly speaking could have been anticipated." },
      { front: "In fire protection, what is a 'Hidden Impairment'?", back: "The most serious impairment type, where a protective system is shut down unknowingly, leaving the facility vulnerable." },
      { front: "What is the 'Two-Photo Rule' for reporting defects?", back: "Take a wide 'Context' shot first to locate the issue, then a close-up 'Detail' shot with scale." },
      { front: "What is the 'Two-Photo Rule' for reporting defects?", back: "Take a wide 'Context' shot first to locate the issue, then a close-up 'Detail' shot with scale." },
      { front: "What are the only three tools defined as 'Holy Trinity' essentials for field inspectors?", back: "Smartphone (camera), Fuel-efficient vehicle, and High-speed internet computer." },
      { front: "True or False: You should always compare a property's curb appeal to its neighbors.", back: "False. 'Neighborhood comparison' can violate Fair Lending laws; stick to the subject property." },
      { front: "What is 'Wrench time'?", back: "A metric measuring the time a craftsperson spends productively working (vs. travel/admin)." }
    ],
    quiz: [
      {
        question: "According to NAMFS standards, what are the mandatory technical specifications for photo submissions?",
        options: [
          "PNG format, 1024x768 resolution",
          "JPG format, 640x480 resolution, red-font date/timestamp in lower right",
          "HEIC format, GPS hidden",
          "GIF format, 320x240"
        ],
        correctIndex: 1
      },
      {
        question: "Which of these notes follows the 'Gold Standard' for objectivity?",
        options: [
          "The property management team is very friendly.",
          "The unit has a beautiful new kitchen.",
          "Kitchen drywall and cabinets installed; bathroom tile incomplete; 10 of 12 LED lighting upgrades verified.",
          "I think the owner is neglecting the roof."
        ],
        correctIndex: 2
      },
      {
        question: "When using the UAD rating scale, what is the primary difference between a C3 and C4 rating?",
        options: [
          "C3 is for new construction.",
          "C3 represents limited depreciation; C4 indicates minor deferred maintenance or components near end of life.",
          "C3 requires a written defense.",
          "C3 is commercial only."
        ],
        correctIndex: 1
      },
      {
        question: "In systems like PRS, what action causes an automatic file rejection?",
        options: [
          "Using a tablet.",
          "Deleting or renaming any tabs from the original Excel template.",
          "Uploading more than 50 photos.",
          "Including full name."
        ],
        correctIndex: 1
      },
      {
        question: "Which metadata component is required to establish 'Digital Trust'?",
        options: [
          "Personal cell number",
          "Certified GPS latitude/longitude and Order ID associated with each photo",
          "Digital watermark",
          "Occupant name"
        ],
        correctIndex: 1
      },
      {
        question: "Under GLBA privacy guidelines, what can you share with a curious neighbor?",
        options: [
          "The property is in foreclosure.",
          "The homeowner is 90 days delinquent.",
          "Nothing; maintain confidentiality.",
          "Only exterior condition results."
        ],
        correctIndex: 2
      },
      {
        question: "For insurance adjustments, what is the required 'ID Photo' sequence?",
        options: [
          "Damage close-up then address.",
          "Overview of the building followed by its address or signage.",
          "Kitchen interior then roof.",
          "Metadata screenshot."
        ],
        correctIndex: 1
      },
      {
        question: "What is the 'Two-Photo Rule' for documenting property defects?",
        options: [
          "One front, one back.",
          "One with flash, one without.",
          "One wide-angle context shot and one tight detail shot with a scale reference.",
          "One defect, one repair estimate."
        ],
        correctIndex: 2
      },
      {
        question: "What is 'Management of Change' (MOC)?",
        options: [
          "Training new managers.",
          "A formal procedure to ensure modifications do not introduce unacceptable risks.",
          "Increasing inspection speed.",
          "Switching inspection firms."
        ],
        correctIndex: 1
      },
      {
        question: "What is the benchmark turnaround time (TAT) for a standard '4-point' insurance inspection?",
        options: [
          "5-7 days",
          "24 hours",
          "72 hours",
          "10 days"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: You should always compare a property’s curb appeal to its neighbors to determine its rating.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: In an Annual Inspection Form, yellow input cells must change color before submission.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 0
      },
      {
        question: "True or False: If you find a potential life-safety hazard, wait until the full report to notify the client.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: A property rated C1 is essentially in the same condition as a property rated C2.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 1
      },
      {
        question: "True or False: 'Wrench time' measures the time a craftsperson spends productively.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 0
      },
      {
        question: "True or False: Professional rejection handling means logging errors to prevent recurrence.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 0
      },
      {
        question: "True or False: It is acceptable to adjust photo brightness in editing software before submission.",
        options: [
          "True",
          "False"
        ],
        correctIndex: 1
      },
      {
        question: "You have 3 jobs left and blurry photos on the current one. What do you do?",
        options: [
          "Submit and hope.",
          "Return immediately and retake, even if late for next job.",
          "Note the blur in comments."
        ],
        correctIndex: 1
      },
      {
        question: "Photo rejected for 'Damage not documented'. You sent 10 close-ups. What was missing?",
        options: [
          "Higher resolution.",
          "A wide-angle context shot showing location of damage.",
          "Building ID label."
        ],
        correctIndex: 1
      },
      {
        question: "Aggressive pet blocks access. Instructions say 'complete exterior'. What do you do?",
        options: [
          "Hop the fence.",
          "Upload photos of barrier and notify coordinator of Access Denial.",
          "Call homeowner to complain."
        ],
        correctIndex: 1
      }
    ]
  }
]
