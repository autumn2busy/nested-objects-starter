export type Lesson = {
    id: string
    title: string
    description: string
    duration: string // e.g. "10 min"
    content: string // Markdown
    callouts?: {
        type: 'notary' | 'realtor' | 'gig-worker' | 'inspector'
        text: string
    }[]
}

export type Scenario = {
    id: string
    title: string
    situation: string
    decisionPoints: {
        question: string
        options: {
            text: string
            isOptimal: boolean
            feedback: string
        }[]
    }[]
    outcome: {
        optimal: string
        suboptimal: string
    }
    debrief: string
}

export type DownloadableResource = {
    title: string
    description: string
    fileName: string
    fileSize: string
    icon: 'pdf' | 'spreadsheet' | 'doc'
}

export const advancedFieldInspectionModules = [
    {
        id: 'threat-recognition',
        title: 'Module 5: Threat Recognition & Safety Protocols',
        description:
            'Master situational awareness, refusal documentation, and de-escalation scripts to handle aggressive dogs, hostile occupants, and unsafe structures.',
        duration: '1.5 hours',
        type: 'Advanced',
        unlock_requirement: 'module_4_quiz_pass',
        syllabus: [
            'The Threat Recognition Matrix: When to walk away',
            'De-escalation Script Library for hostile encounters',
            'Refusal Documentation that prevents callbacks',
            'Handling No-Contact and Bankruptcy orders',
            'The Exit and Report Protocol'
        ],
        videoUrl: 'https://www.youtube.com/embed/B6gCrwPaLyk',
        lessons: [
            {
                id: '1',
                title: 'Recognizing Immediate Safety Threats',
                description: 'Your primary authority is the decision of personal safety.',
                duration: '10 min',
                content: `## Recognizing Immediate Safety Threats
                
> **Core Concept:** Your primary authority is the decision of personal safety: "Is it safe for ME to enter?". You are not a habitability expert; you are an observer of facts.

### Step-by-Step Instructions
1. **Conduct a Perimeter Sweep:** Before exiting your vehicle, scan for "Beware of Dog" signs, drug paraphernalia, or unusual security measures.
2. **Identify Behavioral Zones:** Categorize the environment into Green (Baseline), Yellow (Concerning), or Red (Imminent).
3. **Execute the "Probe" Method:** Use a stick or tool to probe tall grass for snakes or hidden hazards before stepping.
4. **Confirm Ignition Safety:** If you smell "rotten eggs" (mercaptan), do not touch any electrical switch, phone, or flashlight.

### Audience-Specific Examples
* **Notaries:** Just as you verify an ID, you are verifying the safety of the "signing room" (the property). If the environment is hostile, the transaction stops.
* **Realtors:** This is a perimeter sweep you already do for showings, but here, the data is for a lender, not a buyer.

### Quick Win
Keep your vehicle running and pointed toward the exit for a three-second departure if a Red flag appears.

### Warning Signs
* **Red Flag (Exit Immediately):** Clenched fists, verbal threats, or a **gun visible in an occupant's waistband**.
* **Biological Flag:** A "beeline" of insects flying toward a wall cavity—indicates an active swarm.
* **Meth Flag:** Windows blackened or covered in foil with a strong smell of "cat urine" or ammonia.`
            },
            {
                id: '2',
                title: 'De-escalating Aggressive Occupants',
                description: 'Use purposeful actions to move an individual from the emotional "right brain" back to the rational "left brain".',
                duration: '10 min',
                content: `## De-escalating Aggressive Occupants

> **Core Concept:** Use purposeful actions to move an individual from the emotional "right brain" back to the rational "left brain" to complete your 15-minute job without conflict.

### Step-by-Step Instructions
1. **Maintain Physical Stance:** Stand 4–6 feet away, positioned off to the side (not directly in front), with hands visible and open.
2. **Acknowledge Without Agreeing:** Use the phrase, "I realize this situation is frustrating".
3. **Frame the Identity:** State clearly: "I am here to provide a property condition update for the lender's records".
4. **Strategic Silence:** Allow the occupant to vent for 30 seconds without interruption to lower their "temperature".

### Audience-Specific Examples
* **Gig Workers:** This is similar to a difficult delivery drop-off. Keep it professional, document the interaction, and move to the next high-paying job.
* **Existing Inspectors:** Refresh your script to avoid "debt talk" which triggers hostility.

### Quick Win
If an occupant is uncooperative, offer a choice: "Would you prefer I take the exterior photos first while you wait inside?".

### Warning Signs
* **Squatter Encounter:** A person who refuses to identify themselves but is living in a property marked as "Vacant".
* **Agitation Flags:** Pacing, heavy breathing, or a flushed complexion.`
            },
            {
                id: '3',
                title: 'Handling Sensitive Bankruptcy and No-Contact Orders',
                description: 'Navigating legally sensitive jobs where contact could violate a court order.',
                duration: '10 min',
                content: `## Handling Sensitive Bankruptcy and No-Contact Orders

> **Core Concept:** High-paying $100–150 jobs often involve legal sensitivities where any contact could violate a court order.

### Step-by-Step Instructions
1. **Review Work Order Tags:** Look for "No-Contact" or "Legal/Bankruptcy" status before starting.
2. **Street-Side Documentation:** Take all required photos from the sidewalk or street using a zoom lens if necessary.
3. **Verify Occupancy Silently:** Look for "silent indicators" like curtains, mowed lawns, or porch lights instead of knocking.
4. **No Door Hangers:** Do not leave cards or envelopes unless the work order explicitly commands it for that specific date.

### Audience-Specific Examples
* **Notaries:** This is the property equivalent of a "Confidentiality Agreement." Follow the instructions strictly to maintain your vetted status.
* **Realtors:** Think of this as a "Pocket Listing." Minimal visibility is the goal.

### Quick Win
If you see someone in the yard of a No-Contact property, document "Person present, no contact made per instructions," and leave.

### Warning Signs
* **Police Presence:** If the **police are called on you** while observing from the street, remain calm and present your ID badge and work order.`
            },
            {
                id: '4',
                title: 'Documenting Refusals and Hostile Neighbors',
                description: 'Objective documentation ensures you get paid even if you can’t fully access the property.',
                duration: '10 min',
                content: `## Documenting Refusals and Hostile Neighbors

> **Core Concept:** A refusal is still a completed job. Objective documentation ensures you get paid even if you can’t get on the grass.

### Step-by-Step Instructions
1. **Initiate the "OHNO" Framework:** Observe, initiate a Hello, navigate the risk, and obtain help if needed.
2. **Document Verbal Refusals Verbatim:** Record the exact words of a hostile neighbor or occupant.
3. **Capture Environmental Context:** If you cannot photograph the house, photograph the "Street Sign" and the "Refusal Location" to prove you were on-site.
4. **Avoid Personal Opinions:** Use objective language only. Do not say "Neighbor was crazy"; say "Neighbor yelled and gestured for me to leave".

### Audience-Specific Examples
* **Gig Workers:** A refusal is a "Delivery Attempted" status. You still put in the miles and time; ensure your report reflects the facts so the fee is processed.
* **Realtors:** You know neighbors can be protective. Use your local rapport but maintain the lender's legal boundary.

### Quick Win
If a neighbor follows you, drive to a nearby public parking lot before completing your data entry in the InspectorADE app.

### Warning Signs
* **Occupant blocks your vehicle** in the driveway. This is an immediate trigger to contact your coordinator.`
            },
            {
                id: '5',
                title: 'The "Exit and Report" Protocol',
                description: 'Knowing when to leave is as vital as knowing how to inspect.',
                duration: '10 min',
                content: `## The "Exit and Report" Protocol

> **Core Concept:** Your role is the "eyes and ears" for the client, not a hero or a problem-solver. Knowing when to leave is as vital as knowing how to inspect.

### Step-by-Step Instructions
1. **The 3-Second Rule:** If you feel your pulse rise or see a Red Flag, you have 3 seconds to reach your vehicle and lock the doors.
2. **Exit First, Call Second:** Do not call your coordinator from the front porch of a hostile site.
3. **Formalize the Incident:** Complete an incident report using the "5 Ws" (Who, What, Where, When, Why).
4. **Notify the Coordinator:** Once safe, call your Account Manager to describe the hazard (e.g., "Active **dog attack** prevented entry" or "Structural ridgeline sagging 2 feet").

### Audience-Specific Examples
* **Existing Inspectors:** Avoid "Gold Plating"—don't try to fix a situation to get the photos. If it's unsafe, it's a "Hazard Refusal".
* **Notaries:** This is the same as a "Refusal to Sign." Document the reason and close the file.

### Quick Win
Flag the property in your personal notes so you remember to approach with caution if the client sends you back next month.

### Warning Signs
* **Booby Traps:** Unnatural ground features (e.g., a pile of leaves in a clear yard) or trip wires across a path.
* **Imminent Hazard:** An audible "hissing" near a gas meter or a pool of septic waste in the yard.`
            }
        ] as Lesson[],
        quiz: [
            {
                question: "What is the primary authority of a mortgage field inspector regarding property access?",
                options: [
                    "Assessing the habitability of a structure for future tenants.",
                    "Deciding if it is safe for the professional to personally enter the property.",
                    "Determining if a property meets local building codes and standards.",
                    "Verifying if the systems are functional and ready for occupancy."
                ],
                correctIndex: 1
            },
            {
                question: "Which of the following is a 'Red Level' behavioral flag requiring an immediate exit?",
                options: [
                    "The occupant is pacing and breathing heavily.",
                    "The occupant has a flushed complexion and avoids eye contact.",
                    "The occupant has clenched fists, makes verbal threats, or has a visible weapon.",
                    "The occupant speaks in a raised voice but remains on the porch."
                ],
                correctIndex: 2
            },
            {
                question: "If you detect a 'rotten egg' smell (mercaptan) at a property, which action is the most dangerous?",
                options: [
                    "Leaving the premises immediately.",
                    "Using a cell phone or turning on a flashlight.",
                    "Calling the utility company from your vehicle once you are a safe distance away.",
                    "Documenting the odor in your final report."
                ],
                correctIndex: 1
            },
            {
                question: "For a 'No-Contact' bankruptcy work order, how should you conduct the inspection?",
                options: [
                    "Knock briefly to confirm if the occupant is home before taking photos.",
                    "Conduct the inspection after dark to avoid being seen by the homeowner.",
                    "Snap all required photos from the street or sidewalk to avoid any contact.",
                    "Leave a door hanger asking the occupant to call the bank."
                ],
                correctIndex: 2
            },
            {
                question: "What is the goal of using de-escalation scripts when dealing with an agitated occupant?",
                options: [
                    "To win the argument and complete the interior inspection.",
                    "To explain the legal process of foreclosure to the homeowner.",
                    "To move the individual from the emotional 'right brain' back to the rational 'left brain'.",
                    "To convince the occupant that you are on their side against the bank."
                ],
                correctIndex: 2
            },
            {
                question: "According to the 'Installed vs. Delivered' rule, how should you report new kitchen cabinets sitting in boxes in the garage?",
                options: [
                    "100% complete since the materials are on-site.",
                    "50% complete because the project is in progress.",
                    "0% complete because they are not physically installed.",
                    "Complete if the contractor promises to install them by the end of the day."
                ],
                correctIndex: 2
            },
            {
                question: "When documenting a hostile encounter or a structural hazard, what framework should you use?",
                options: [
                    "The 'Right Brain' emotional assessment.",
                    "The 'OHNO' framework (Observe, Hello, Navigate, Obtain Help).",
                    "The 'Diagnostic Diagnosis' method.",
                    "The 'Habitability Assessment' protocol."
                ],
                correctIndex: 1
            },
            {
                question: "When approaching a property with overgrown vegetation, what is the safest way to scan for hazards?",
                options: [
                    "Walk quickly to minimize the time spent in the grass.",
                    "Use a stick or tool to 'probe' tall grass for snakes or booby traps before stepping.",
                    "Assume the property is vacant and proceed to the backyard.",
                    "Rely on your heavy boots to protect you from any hidden biological risks."
                ],
                correctIndex: 1
            },
            {
                question: "True or False: Field inspectors should use diagnostic language like 'the foundation is failing' to ensure the lender understands the severity of the damage.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 1
            },
            {
                question: "True or False: If attacked by a swarm of bees, you should jump into the nearest body of water for protection.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 1
            },
            {
                question: "True or False: A verbal refusal from a hostile neighbor or occupant is still considered a completed job, provided it is documented properly.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 0
            },
            {
                question: "Scenario: You are at an REO property and observe the ridgeline of the roof dipping into a 'U' shape and significant mold growth visible through the windows. The work order requires interior photos. What is your protocol?",
                options: [
                    "Proceeed with caution.",
                    "Report: 'Entry not attempted due to structural sagging and heavy visible mold'.",
                    "Call the police.",
                    "Use a ladder to inspecting the roof."
                ],
                // Answer key from text says: "This is an 'Exterior Observation Only' scenario..."
                // I will map this to the best option based on the text. Rationale: "Entry not attempted..."
                correctIndex: 1
            },
            {
                question: "Scenario: While conducting an occupancy check, a homeowner screams that you are trespassing and calls the police. You are on the sidewalk. How do you handle the police encounter?",
                options: [
                    "Run to your car and leave.",
                    "Argue with the homeowner.",
                    "Remain calm, maintain distance, present ID/work order.",
                    "Hide until police leave."
                ],
                // Answer key: "Remain calm..."
                correctIndex: 2
            },
            {
                question: "Scenario: You knock on a door as part of a contact inspection. A man answers but refuses to identify himself and becomes verbally aggressive when you ask about the homeowner. What is your next move?",
                options: [
                    "Demand identification.",
                    "Identify as 'Yellow Flag', use de-escalation, exit if becomes 'Red Flag'.",
                    "Call the police immediately.",
                    "Walk past him into the house."
                ],
                // Answer key: "Identify as Yellow Flag... de-escalation..."
                correctIndex: 1
            },
            {
                question: "Scenario: You are walking the perimeter of a fenced yard when a dog you didn't see begins charging and barking aggressively. What is your safety action?",
                options: [
                    "Run as fast as you can.",
                    "Flail your arms to scare it.",
                    "Stand still or retreat slowly back to vehicle.",
                    "Try to pet the dog."
                ],
                // Answer key: "Do not run... Stand still or retreat slowly..."
                correctIndex: 2
            }
        ]
    },
    {
        id: 'ai-automation',
        title: 'Module 6: AI & Automation Mastery',
        description:
            'Leverage AI tools to validate photo quality in real-time and automate routine reporting tasks.',
        duration: '1 hour',
        type: 'Advanced',
        unlock_requirement: 'module_5_quiz_pass',
        syllabus: [
            'AI Tools Comparison: What works for field data',
            'Photo Quality Validation: Automating the QC check',
            'Voice Documentation: Speaking your notes effectively',
            'AI Chat Assistants for Protocol Guidance',
            'Workflow Automation and Routing'
        ],
        videoUrl: 'https://www.youtube.com/embed/4EB3BQ6KB9o',
        lessons: [
            {
                id: '1',
                title: 'AI-Powered Report Generation',
                description: 'Transforming field notes into objective reports using NLP.',
                duration: '10 min',
                content: `## AI-Powered Report Generation and Objective Language Refinement

> **Core Concept:** Transforming fragmented field notes into high-fidelity, objective reports required by financial institutions using Natural Language Processing (NLP).

### Step-by-Step Instructions
1. **Input Data:** Upload raw observations or voice memos into your AI-integrated report writer.
2. **Review Suggestions:** The AI identifies issues like wear or moisture and suggests pre-written, standardized comments.
3. **Verify and Edit:** Accept the comment as-is or adjust it to ensure it perfectly matches the on-site reality.
4. **Finalize:** Click to add refined comments directly into the report template.

### Audience-Specific Examples
* **Notaries:** Use your eye for detail to verify that the AI’s "drafted" property narrative matches your physical observations.
* **Realtors:** Shift from "selling a home" language to "lender-ready" objective language instantly.

### Quick Win
Use an "Image Defect Detector" to automatically generate descriptions for common issues like roof wear or foundation cracks, saving 15 minutes of typing per report.

### Critical AI Limitations & Warnings
* **Hallucination Risk:** AI may generate plausible-sounding but false facts; always review AI-generated reports against on-site observations.
* **Scope Limitation:** AI might suggest a "repair recommendation." **Never** include this. Your role is objective documentation only.`
            },
            {
                id: '2',
                title: 'Photo Quality Analysis',
                description: 'Using real-time computer vision to validate image clarity.',
                duration: '10 min',
                content: `## Photo Quality Analysis and Computer Vision Validation

> **Core Concept:** Using real-time computer vision to validate image clarity, framing, and lighting before you leave the property, eliminating costly re-trips.

### Step-by-Step Instructions
1. **Capture:** Take required photos (front, address, street sign) through the InspectorADE app.
2. **Automated Check:** The AI analyzes the "Blur Score" and "Brightness Score" instantly.
3. **Immediate Correction:** If an image is flagged as blurry or underexposed, the app prompts an immediate retake.
4. **Geospatial Verification:** The system confirms the photo GPS metadata matches the subject property address.

### Audience-Specific Examples
* **Gig Workers:** Treat this like a high-stakes delivery photo. The AI ensures your "proof of work" is incontestable.
* **Existing Inspectors:** Reduce your "returned report" rate to near zero by letting AI catch fingers in the frame or blurry rooflines.

### Quick Win
Enable "Live Feedback" in your app to receive an instant alert if your front-of-house shot is missing the roofline.`
            },
            {
                id: '3',
                title: 'Voice-to-Text Documentation',
                description: 'Utilizing NLU to fill inspection fields hands-free.',
                duration: '10 min',
                content: `## Voice-to-Text and Hands-Free Field Documentation

> **Core Concept:** Utilizing Natural Language Understanding (NLU) to fill inspection fields through speech, allowing you to document safely while navigating ladders or crawlspaces.

### Step-by-Step Instructions
1. **Activate:** Tap the microphone icon within the field note screen.
2. **Dictate Naturally:** Speak your observations (e.g., "Standing water in basement, tag as plumbing, due Friday").
3. **Smart Mapping:** The AI interprets your "intent" and populates the 'Status,' 'Tag,' and 'Description' fields automatically.
4. **Confirm:** Review the auto-filled fields for accuracy before saving.

### Audience-Specific Examples
* **Notaries:** Document property conditions with the same precision you use for loan signing notes, but without the paperwork.
* **Gig Workers:** Use the same voice-to-text skills you use for navigation to complete high-value inspections 20% faster.

### Quick Win
Use "Audio FastFill" to map voice input to checkboxes and numbers, allowing you to finish the "heavy lifting" of data entry while walking back to your car.`
            },
            {
                id: '4',
                title: 'AI Chat Assistants',
                description: 'Accessing instant, client-specific instructions via chatbots.',
                duration: '10 min',
                content: `## AI Chat Assistants for Real-Time Protocol Guidance

> **Core Concept:** Accessing instant, client-specific instructions and troubleshooting via 24/7 AI chatbots, reducing the need for phone calls to coordinators.

### Step-by-Step Instructions
1. **Query:** Ask the bot a natural language question (e.g., "Does Client A require a water meter photo for this order?").
2. **Receive Guidance:** The AI pulls the specific requirement from thousands of pages of lender guidelines.
3. **Verify:** Click the provided citation to see the exact page in the client manual for 100% compliance.
4. **Escalate:** If the situation is an "edge-case," use the bot to route a concise summary to a human coordinator.

### Critical AI Limitations & Warnings
* **Domain Specificity:** General bots (like standard ChatGPT) don't know lender-specific overlays. Only use "mortgage-native" assistants trained on industry data.
* **Human-in-the-Loop Mandate:** If guidelines are unclear, **stop and ask the coordinator**. AI is a guide, not the rule-maker.`
            },
            {
                id: '5',
                title: 'Workflow Automation',
                description: 'Leveraging AI for route optimization and communication.',
                duration: '10 min',
                content: `## Workflow Automation: Routing, Scheduling, and Coordinator Communication

> **Core Concept:** Leveraging AI to automatically optimize your daily route and handle occupant communication, maximizing your jobs-per-day.

### Step-by-Step Instructions
1. **Download Orders:** Hit "download" in your app to sync new assignments and check for cancellations.
2. **Optimize Route:** The AI analyzes job priority and traffic to create the most fuel-efficient sequence.
3. **Automate Pre-Calls:** AI voice agents confirm appointments and share prep instructions with occupants.
4. **Track Status:** Real-time updates keep coordinators informed of your ETA without you needing to text or call.

### Audience-Specific Examples
* **Gig Workers:** Move from $5 deliveries to $50-150 inspections by using AI routing that matches your existing driving skills to higher-paying territory.
* **Realtors:** Integrate your field work into your existing calendar seamlessly, using AI to fill "gaps" in your schedule with vetted jobs.`
            },
            {
                id: '6',
                title: 'AI Learning Tools',
                description: 'Using AI-powered training modules for continuous development.',
                duration: '10 min',
                content: `## AI Learning Tools and Continuous Professional Development

> **Core Concept:** Using AI-powered training modules and scenario practice to master new lender requirements (like NSPIRE or FHA) and increase your earning potential.

### Step-by-Step Instructions
1. **Analyze Requirements:** Upload new lender matrices or property preservation guides to an AI quiz generator.
2. **Practice Scenarios:** Use "Scenario AI" to simulate complex borrower interactions or unusual property conditions.
3. **Review Performance:** Use AI-driven dashboards to identify which of your "tags" or "statuses" are most frequently corrected.
4. **Upskill:** Complete AI-powered certification courses to gain access to higher-paying specialty inspection networks.

### Quick Win
Turn a 100-page lender PDF into a 10-question interactive quiz to master their specific photo requirements in 5 minutes.`
            }
        ] as Lesson[],
        quiz: [
            {
                question: "What is the primary purpose of using Natural Language Processing (NLP) in field report generation?",
                options: [
                    "To replace the need for an inspector to visit the site.",
                    "To transform fragmented field notes into high-fidelity, objective language required by lenders.",
                    "To allow the inspector to provide diagnostic repair recommendations.",
                    "To automatically submit reports without human review."
                ],
                correctIndex: 1
            },
            {
                question: "Which metric best indicates that an augmented inspector is effectively using AI tools?",
                options: [
                    "A 50% increase in diagnostic repair opinions.",
                    "Spending 45 minutes typing each report after leaving the property.",
                    "A near-zero photo rejection rate and instant on-site report submission.",
                    "Using manual paper checklists to verify AI outputs."
                ],
                correctIndex: 2
            },
            {
                question: "In AI photo analysis, what does a 'Blur Score' of 4 out of 5 typically indicate?",
                options: [
                    "The photo has perfect lighting.",
                    "The photo is high-quality and ready for submission.",
                    "The photo has significant motion blur or focus issues and must be retaken.",
                    "The photo is correctly geocoded."
                ],
                correctIndex: 2
            },
            {
                question: "What is an 'AI Hallucination' in the context of field services?",
                options: [
                    "When an inspector imagines a defect that isn't there.",
                    "When a generative AI produces an output that is factually incorrect but presented with high confidence.",
                    "When the GPS metadata on a photo is slightly off.",
                    "A feature that allows AI to see through walls using thermal imaging."
                ],
                correctIndex: 1
            },
            {
                question: "Implementing AI-driven route optimization typically results in which of the following efficiency gains?",
                options: [
                    "A 100% reduction in vehicle maintenance.",
                    "A 20% increase in utilization and a 15% decrease in mileage.",
                    "The ability to perform inspections via drone only.",
                    "Eliminating the need for a smartphone on-site."
                ],
                correctIndex: 1
            },
            {
                question: "How does 'Audio FastFill' technology differ from standard talk-to-text tools?",
                options: [
                    "It records your voice but does not transcribe it.",
                    "It can only be used when connected to high-speed office Wi-Fi.",
                    "It intelligently maps spoken 'intent' to specific fields like status, tags, and due dates.",
                    "It automatically calls the homeowner for you."
                ],
                correctIndex: 2
            },
            {
                question: "Why should a field inspector use an AI chatbot for protocol assistance?",
                options: [
                    "To ask for investment advice on the subject property.",
                    "To receive 24/7, cited guidance on specific lender requirements without calling a coordinator.",
                    "To negotiate higher pay for a specific work order.",
                    "To bypass the client's mandatory photo requirements."
                ],
                correctIndex: 1
            },
            {
                question: "What is the 'Force Multiplier' framework regarding AI in field services?",
                options: [
                    "AI acts as a replacement for human observation.",
                    "AI handles data processing/formatting while the inspector focuses on observation, safety, and judgment.",
                    "AI multiplies the number of people required to perform a single inspection.",
                    "AI forces the inspector to follow a rigid, non-customizable path."
                ],
                correctIndex: 1
            },
            {
                question: "True or False: Field inspectors should use AI tools to diagnose the structural integrity of a foundation if the AI suggests a repair is needed.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 1
            },
            {
                question: "True or False: 'Human-in-the-Loop' means the inspector must verify and approve AI-generated data before it is submitted to the lender.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 0
            },
            {
                question: "True or False: AI photo analysis tools can automatically cross-reference GPS coordinates with the subject address to prevent documentation errors.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 0
            },
            {
                question: "Scenario: During a basement inspection, you record a voice note saying 'Small pool of water in the corner.' The AI report generator refines this to 'Basement flooding due to catastrophic pipe failure.' What is your correct response?",
                options: [
                    "Accept the AI suggestion.",
                    "Delete diagnostic language and replace with 'Visible standing water in the southwest corner'.",
                    "Leave the property to call a plumber.",
                    "Submit as-is."
                ],
                correctIndex: 1
            },
            {
                question: "Scenario: You have finished taking your 10 required photos. The AI Photo Quality API flags 3 photos as 'unusable'. What is your correct response?",
                options: [
                    "Submit anyway.",
                    "Drive to next job and return later.",
                    "Retake the 3 photos immediately while on-site.",
                    "Edit the photos to be sharper."
                ],
                correctIndex: 2
            },
            {
                question: "Scenario: You document a roof from a ladder. You say: 'The roof looks dangerous.' The AI asks for details. How do you refine?",
                options: [
                    "Roof is in disrepair.",
                    "Observed roof wear with missing shingles and minor ponding at rear.",
                    "Recommend replacement.",
                    "Roof is high risk."
                ],
                correctIndex: 1
            },
            {
                question: "Scenario: Your AI routing software indicates your next job is at 123 Main St, but the GPS metadata shows 125 Main St. The system flags a 'Geospatial Mismatch.' What is your correct response?",
                options: [
                    "Ignore the flag.",
                    "Change GPS coordinates manually.",
                    "Stop, verify house number, and ensure you are at the correct property.",
                    "Call homeowner."
                ],
                correctIndex: 2
            }
        ],
        flashcards: [
            { front: "In the context of AI, what is an Automated Valuation Model (AVM)?", back: "An algorithm that estimates a property’s value using data like comparable sales, tax assessments, and property features." },
            { front: "How do AI scheduling assistants differ from traditional scheduling tools?", back: "AI assistants continuously learn and adapt based on real-time data, while traditional tools rely on static rules or manual input." },
            { front: "What is 'digital redlining' in AI?", back: "Algorithmic bias where an AI model perpetuates historical discrimination." },
            { front: "What is an AI Hallucination?", back: "When a generative model produces factually incorrect or fabricated information but presents it confidently." },
            { front: "What is Retrieval-Augmented Generation (RAG)?", back: "A solution to mitigate AI hallucinations by grounding the model in a trusted knowledge base." },
            { front: "What is Audio FastFill?", back: "Replaces manual typing with real-time, structured voice dictation for hands-free data entry." },
            { front: "How much more likely are high-performing teams to use intelligent scheduling?", back: "2.6 times more likely." },
            { front: "What is a benefit of computer vision in inspections?", back: "Automatically detects physical defects like cracks and water damage from images." },
            { front: "What is the 'black box' problem?", back: "Users can see inputs and outputs but cannot see how the AI model arrived at its conclusions." },
            { front: "What is Shadow AI?", back: "Unsanctioned use of personal AI apps by employees for work-related tasks." }
        ],
        scenarios: [
            {
                id: '1',
                title: 'Scenario A: The AI Report Hallucination',
                situation: 'You are completing a $150 inspection. You record: "Large crack on basement west wall, looks deep". The AI refines this to: "Foundation damage requires immediate structural assessment".',
                decisionPoints: [
                    {
                        question: "What is your action?",
                        options: [
                            {
                                text: "Submit the report as 'Foundation damage requires assessment'.",
                                isOptimal: false,
                                feedback: "This is a scope violation! You are diagnosing, not observing."
                            },
                            {
                                text: "Delete diagnostic language and replace with observable facts: '4-inch horizontal crack observed'.",
                                isOptimal: true,
                                feedback: "Correct. You stuck to facts and avoided liability."
                            }
                        ]
                    }
                ],
                outcome: {
                    optimal: "Report accepted. You protected yourself from liability.",
                    suboptimal: "Report rejected for subjective language. You risk professional liability."
                },
                debrief: "AI can 'hallucinate' plausible conclusions. You are the verifyer."
            },
            {
                id: '2',
                title: 'Scenario B: Photo Quality Rejection',
                situation: 'You are rushing to the next job. The AI flags 3 of your photos as "unusable" (Blur Score 4/5).',
                decisionPoints: [
                    {
                        question: "What do you do?",
                        options: [
                            {
                                text: "Leave and fix it later or hope it passes.",
                                isOptimal: false,
                                feedback: "This will result in a rejected report and an unpaid return trip."
                            },
                            {
                                text: "Retake the photos immediately while on-site.",
                                isOptimal: true,
                                feedback: "Correct. You ensured 'first-time right' submission."
                            }
                        ]
                    }
                ],
                outcome: {
                    optimal: "Submission accepted instantly. No rework.",
                    suboptimal: "Report returned. You have to drive back for free."
                },
                debrief: "Use AI to catch errors on-site to protect your margins."
            }
        ]
    },
    {
        id: 'risk-management',
        title: 'Module 7: Income Diversification & Risk',
        description:
            'Expand your service lines into commercial, insurance, and specialty inspections while managing professional liability.',
        duration: '2 hours',
        type: 'Advanced',
        unlock_requirement: 'module_6_quiz_pass',
        syllabus: [
            'Mystery Shopping & Compliance Audits',
            'Medical Courier Field Verification',
            'Property Preservation Services',
            'Insurance Loss Draft Inspections',
            'FEMA/Disaster Inspections',
            'REO Property Services'
        ],
        videoUrl: 'https://www.youtube.com/embed/24YaMwxp26Q',
        lessons: [
            {
                id: '1',
                title: 'Mystery Shopping & Compliance',
                description: 'Act as a covert auditor to evaluate brand standards.',
                duration: '20 min',
                content: `## Mystery Shopping & Compliance Audits

> **Core Concept:** Act as a covert auditor to evaluate brand standards, operational compliance, and legal mandates (e.g., tobacco ID checks or ADA accessibility).

### Application
* **Hiring Entities:** IntelliShop, BestMark, Market Force.
* **Documentation:** Time-stamped photos, time measurements (checkout duration), and adherence to strict "shop guidelines".
* **Rate Range:** $25 (basic retail) to $200+ for specialized video shops or ADA audits.

### Workflow
1. Claim shop.
2. Study guidelines.
3. Visit covertly.
4. Document facts.
5. Submit web report.`
            },
            {
                id: '2',
                title: 'Medical Courier Verification',
                description: 'Transport and document secure delivery of medical items.',
                duration: '20 min',
                content: `## Medical Courier Field Verification

> **Core Concept:** Transport and document the secure delivery of lab specimens, pharmaceuticals, and medical devices while maintaining "cold chain" integrity.

### Application
* **Hiring Entities:** Go2 Delivery, DeVries Business Services, Pillow Logistics.
* **Rate Range:** $15–$25 per hour or per-parcel rates depending on the contract.
* **Required Credentials:** **HIPAA Certification** (mandatory) and **Bloodborne Pathogens (BBP) Certification**.

### Workflow
1. Secure pickup.
2. Verify PHI-confidentiality.
3. Monitor temperature.
4. Scan at transfer.
5. Secure delivery signature.`
            },
            {
                id: '3',
                title: 'Property Preservation',
                description: 'Oversee maintenance of vacant assets.',
                duration: '20 min',
                content: `## Property Preservation Services

> **Core Concept:** Oversee the maintenance of vacant assets to ensure "conveyance condition" (e.g., winterization, debris removal, lawn care).

### Application
* **Hiring Entities:** MCS, Safeguard, ServiceLink, National Field Representatives (NFR).
* **Rate Range:** Grass cuts ($28–$50), Dry Winterization ($70–$100), Wet Winterization ($105–$250).
* **Required Credentials:** **ShieldID (ABC#)** via Aspen Grove/ShieldHub.

### Workflow
1. Verify vacancy.
2. Document pre-existing damage.
3. Execute work per investor guidelines.
4. Complete photo documentation.
5. Submit report.`
            },
            {
                id: '4',
                title: 'Insurance Loss Drafts',
                description: 'Verify percentage of completion for property repairs.',
                duration: '20 min',
                content: `## Insurance Loss Draft Inspections

> **Core Concept:** Verify the percentage of completion for property repairs to facilitate the release of escrowed insurance funds.

### Application
* **Hiring Entities:** Mortgage servicers and third-party loss draft providers like GIS Field Services and Pat Neff & Associates (PNA).
* **Documentation:** Math-based calculation of % complete against an official Scope of Work (SOW).
* **Rate Range:** $100–$300 per job.

### Required Credentials
Mastery of the **"Materials vs. Installed Doctrine"** (shingles on the ground = 0%; shingles on roof = complete).`
            },
            {
                id: '5',
                title: 'FEMA/Disaster Inspections',
                description: 'Deploy to disaster zones to document property damage.',
                duration: '20 min',
                content: `## FEMA/Disaster Inspections

> **Core Concept:** Deploy to disaster zones to document property damage and residential habitability for federal aid eligibility.

### Application
* **Hiring Entities:** WSP USA Inspection Services and Vanguard EM.
* **Rate Range:** $26–$29 hourly (WSP) or high per-inspection volume rates.
* **Required Credentials:** **Moderate Risk Background Investigation (MBI)** (includes neighbors/fingerprints) and U.S. Citizenship.

### Workflow
1. Pass MBI.
2. Complete readiness training.
3. Deploy within 24 hours.
4. Document habitability.
5. Submit ACE report.`
            },
            {
                id: '6',
                title: 'REO Property Services',
                description: 'Manage transition of bank-owned properties.',
                duration: '20 min',
                content: `## REO Property Services

> **Core Concept:** Manage the transition of bank-owned properties, including lockouts, utility verification, and Cash-for-Keys (CFK) negotiations.

### Application
* **Hiring Entities:** Radian, ServiceLink, ROI Properties, Consolidated Analytics.
* **Rate Range:** $75 (lockouts) to premium negotiation fees.

### Workflow
1. Verify occupant identity.
2. Propose CFK deal.
3. Formalize written agreement.
4. Conduct walkthrough.
5. Exchange keys for check and change locks.`
            }
        ] as Lesson[],
        quiz: [
            {
                question: "Under the 'materials vs. installed doctrine' in an Insurance Loss Draft inspection, which of the following can be counted toward the percentage of completion?",
                options: [
                    "A pallet of roofing shingles sitting in the driveway.",
                    "New kitchen cabinets stored in the garage awaiting installation.",
                    "Hardwood flooring that has been nailed to the subfloor.",
                    "The contractor’s verbal confirmation that the windows have been ordered."
                ],
                correctIndex: 2
            },
            {
                question: "What is the mandatory primary credential for any field professional seeking work in medical courier field verification?",
                options: [
                    "ShieldID (ABC#).",
                    "HIPAA Certification.",
                    "Home Inspector License.",
                    "Commercial Driver’s License (CDL)."
                ],
                correctIndex: 1
            },
            {
                question: "In a Brand Compliance Mystery Shop, which documentation requirement is most likely to be requested to verify service speed?",
                options: [
                    "A subjective review of the cashier’s 'vibe.'",
                    "A 24-inch digital level measurement.",
                    "A time-stamped photo and recorded checkout duration.",
                    "A sketch of the building’s interior layout."
                ],
                correctIndex: 2
            },
            {
                question: "What is the core objective of Property Preservation Services?",
                options: [
                    "To diagnose structural failures for potential buyers.",
                    "To keep vacant assets in 'conveyance condition' for investors.",
                    "To manage active rental properties for landlords.",
                    "To perform major structural plumbing repairs."
                ],
                correctIndex: 1
            },
            {
                question: "Which software is the government standard for documenting property damage during a FEMA deployment?",
                options: [
                    "InspectorADE.",
                    "ACE Field Software.",
                    "ShieldHub.",
                    "Google Maps timeline."
                ],
                correctIndex: 1
            },
            {
                question: "Which background check rating is universally required by major national firms for on-site property inspections?",
                options: [
                    "IC04.",
                    "IC01.",
                    "BCL03.",
                    "MBI Level 1."
                ],
                correctIndex: 1
            },
            {
                question: "When conducting a 'Cash-for-Keys' (CFK) negotiation for an REO property, what is an illegal 'self-help' action?",
                options: [
                    "Proposing a voluntary move-out date in writing.",
                    "Changing the locks while the tenant is still occupying the property.",
                    "Verifying the occupant’s identification.",
                    "Inspecting the property on move-out day."
                ],
                correctIndex: 1
            },
            {
                question: "What is the typical daily income difference between a single-stream occupancy inspector and a diversified multi-stream professional?",
                options: [
                    "$50 vs $100.",
                    "$150 vs $400+.",
                    "$500 vs $600.",
                    "There is no significant difference."
                ],
                correctIndex: 1
            },
            {
                question: "True or False: Field inspectors are authorized to diagnose mechanical failures or recommend structural repairs if they have construction experience.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 1
            },
            {
                question: "True or False: Cold chain integrity in medical verification refers to the uninterrupted series of distributions that keep materials within a specific temperature range.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 0
            },
            {
                question: "True or False: A homeowner can personally endorse an insurance loss check if they intend to do the repairs themselves.",
                options: [
                    "True",
                    "False"
                ],
                correctIndex: 1
            },
            {
                question: "Scenario: You are offered a rapid-deployment FEMA disaster contract but have not completed an MBI. What is your correct action?",
                options: [
                    "Deploy immediately and get background check later.",
                    "Decline until MBI and training are complete.",
                    "Use a friend's credentials.",
                    "Ask for an exception."
                ],
                correctIndex: 1
            },
            {
                question: "Scenario: In a mystery shop report, you include subjective opinions about 'bad attitude'. What is the correct action?",
                options: [
                    "Submit as is.",
                    "Revise to replace opinions with objective observations.",
                    "Call the manager to complain.",
                    "Post about it on social media."
                ],
                correctIndex: 1
            },
            {
                question: "Scenario: A hurricane strikes. You have orders for disaster damage assessments. How do you price them?",
                options: [
                    "Standard $15 rate.",
                    "Discounted rate for charity.",
                    "Premium pricing ($100-$300+) for specialized high-liability work.",
                    "Hourly minimum wage."
                ],
                correctIndex: 2
            },
            {
                question: "Scenario: You are verifying a CFK agreement. A sub-tenant demands payment before removing belongings from garage. What do you do?",
                options: [
                    "Pay them to get them to leave.",
                    "Refuse payment until 100% vacated.",
                    "Call the locksmith immediately.",
                    "Offer half now, half later."
                ],
                correctIndex: 1
            }
        ],
        flashcards: [
            { front: "What is the 'materials vs. installed doctrine'?", back: "Inspectors only credit work that is permanently attached to the structure, not materials sitting on-site." },
            { front: "What credential is mandatory for medical courier verification?", back: "HIPAA Certification." },
            { front: "What is 'Chain of Custody'?", back: "A protocol documenting every handoff of a sensitive item to ensure accountability." },
            { front: "What is the core objective of Property Preservation?", back: "To keep vacant assets in 'conveyance condition' for investors." },
            { front: "What is 'Winterization'?", back: "Draining plumbing systems and adding antifreeze to prevent freeze damage." },
            { front: "What is a 'Loss Draft Inspection'?", back: "Verifies repairs are being made after an insurance claim before releasing funds." },
            { front: "What is 'Cash for Keys'?", back: "A deal where a landlord offers money to a tenant to voluntarily vacate a property." },
            { front: "What software do FEMA inspectors use?", back: "ACE Field Software." },
            { front: "What is an IC01 rating?", back: "A standard background check rating representing a clean record for field inspectors." },
            { front: "What is 'Revenue Stream Stacking'?", back: "Combining multiple specialized inspection types to maximize daily earnings and stability." }
        ],
        scenarios: [
            {
                id: '1',
                title: 'Scenario A: Schedule Gap Filling',
                situation: 'You have a 3.5-hour "dead zone" between mortgage inspections. You see two retail compliance audits nearby.',
                decisionPoints: [
                    {
                        question: "Do you take the audits?",
                        options: [
                            {
                                text: "No, wait for the next mortgage job.",
                                isOptimal: false,
                                feedback: "You miss out on recovering lost time and revenue."
                            },
                            {
                                text: "Yes, claim the shops to turn dead time into $50 extra revenue.",
                                isOptimal: true,
                                feedback: "Correct. You increased your effective hourly rate."
                            }
                        ]
                    }
                ],
                outcome: {
                    optimal: "You earn $80 total instead of $30 for the same route.",
                    suboptimal: "You earn only $30 and waste time."
                },
                debrief: "Stacking low-complexity work eliminates travel cost drag."
            },
            {
                id: '2',
                title: 'Scenario B: Disaster Opportunity',
                situation: 'A hurricane stalls mortgage work. You have an MBI credential.',
                decisionPoints: [
                    {
                        question: "What is your move?",
                        options: [
                            {
                                text: "Wait for mortgage work to return.",
                                isOptimal: false,
                                feedback: "You suffer income loss during the pause."
                            },
                            {
                                text: "Pivot to FEMA inspections for $200+/job.",
                                isOptimal: true,
                                feedback: "Correct. You leverage your diverse skills for high surge income."
                            }
                        ]
                    }
                ],
                outcome: {
                    optimal: "You earn weeks of income in a few days.",
                    suboptimal: "You have no income for the duration of the disaster response."
                },
                debrief: "Diversification protects you from market pauses."
            }
        ]
    },
    {
        id: 'advanced-operations',
        title: 'Module 8: Advanced Operational Standards',
        description:
            'Optimize your route density, manage seasonal equipment, and build a scorecard to become a preferred vendor.',
        duration: '2 hours',
        type: 'Advanced',
        unlock_requirement: 'module_7_quiz_pass',
        syllabus: [
            'Logistical Engineering & Route Optimization',
            'Environmental Adaptability & Seasonal Standards',
            'Specialized Property Type Mastery',
            'Advanced Damage Documentation',
            'Administrative Resilience & Dispute Resolution',
            'Sustainable Business Growth'
        ],
        videoUrl: 'https://www.youtube.com/embed/VSwh4ECowc4',
        lessons: [
            {
                id: '1',
                title: 'Logistical Engineering',
                description: 'Geospatial clustering and route optimization.',
                duration: '20 min',
                content: `## Logistical Engineering & Route Optimization

> **Core Concept:** Moving beyond chronological work orders to **Geospatial Clustering**.

### Efficiency Gains
* **Clustering:** Use software to organize stops into 1–3 mile intervals.
* **"One-and-Done":** Complete the report and upload before shifting the vehicle into drive.
* **Real Math:** Algorithmic Planning: 6–8+ stops/hr @ $15 = **$90–$120/hr**.`
            },
            {
                id: '2',
                title: 'Seasonal Standards',
                description: 'Maintaining documentation regardless of weather.',
                duration: '20 min',
                content: `## Environmental Adaptability & Seasonal Standards

> **Core Concept:** Maintaining unassailable documentation regardless of the weather.

### Workflow
1. **Winterization Verification:** Document that water is off, faucets are open, antifreeze is in traps.
2. **Heat Management:** Use thermal-insulated bags.
3. **Low-Light Mastery:** Use "fast" prime lenses ($f/1.8$) and tripods.`
            },
            {
                id: '3',
                title: 'Specialized Property Mastery',
                description: 'Expertise in complex assignments like Multi-Family and Loss Drafts.',
                duration: '20 min',
                content: `## Specialized Property Type Mastery

> **Core Concept:** Developing expertise in complex assignments like Multi-Family, Rural, and Loss Draft inspections.

### Workflow
* **Multi-Family:** Use a "top-down" approach (Roof -> Common Areas -> Unit-by-Unit PCR).
* **Rural:** Use GIS-enabled platforms (Acres.com).
* **Loss Draft:** Verify "Installed Completion" only.`
            },
            {
                id: '4',
                title: 'Advanced Damage Documentation',
                description: 'Constructing a visual narrative using the Context + Detail framework.',
                duration: '20 min',
                content: `## Advanced Damage Documentation

> **Core Concept:** Moving from random photos to **Narrative Photography**.

### The 4-Shot Sequence
1. **Establishing Shot:** Wide-angle view showing the defect relative to the structure/grade.
2. **Relationship Shot:** Mid-range view showing proximity to environmental factors.
3. **Detail Shot:** Close-up with a measurement tool.
4. **Comparison Shot:** Photo of an unaffected area.`
            },
            {
                id: '5',
                title: 'Administrative Resilience',
                description: 'Managing rejections and conflicts professionally.',
                duration: '20 min',
                content: `## Administrative Resilience & Dispute Resolution

> **Core Concept:** Managing rejections and conflicts through clinical, professional protocols.

### Workflow
1. **Clinical Rebuttal:** Submit responses using objective scripts.
2. **Management Escalation:** Escalate to regional supervisor with evidence.
3. **Conflict Management:** Maintain objective distance.`
            },
            {
                id: '6',
                title: 'Sustainable Business Growth',
                description: 'Transitioning from vendor to Strategic Partner.',
                duration: '20 min',
                content: `## Sustainable Business Growth

> **Core Concept:** Transitioning from an on-demand vendor to a **Strategic Partner**.

### Strategies
* **Diversify:** Maintain active contracts with 3–5 clients.
* **Negotiate:** Implement **Tiered Pricing**.
* **Credentialing:** Maintain ABC# via Shield Hub.`
            }
        ] as Lesson[],
        quiz: [
            {
                question: "What is the 'Elite' benchmark for 'stops per hour' when using advanced algorithmic routing software versus manual planning?",
                options: [
                    "1–2 stops per hour",
                    "2–4 stops per hour",
                    "6–8+ stops per hour",
                    "10–12 stops per hour"
                ],
                correctIndex: 2
            },
            {
                question: "During a winterization verification protocol, if utilities are active, at what temperature range must the thermostat be documented?",
                options: [
                    "$32^{\\circ}F$ to $40^{\\circ}F$",
                    "$55^{\\circ}F$ to $60^{\\circ}F$",
                    "$65^{\\circ}F$ to $70^{\\circ}F$",
                    "It must be turned completely off."
                ],
                correctIndex: 1
            },
            {
                question: "When documenting a large multi-family complex, which logistical strategy ensures the highest reporting efficiency?",
                options: [
                    "A 'bottom-up' approach starting with individual units.",
                    "Inspecting common areas only and skipping units.",
                    "An 'exterior-to-interior, top-down' approach starting at the roof.",
                    "Inspecting only the units that appear vacant from the outside."
                ],
                correctIndex: 2
            },
            {
                question: "In a Loss Draft/Draw inspection, how should an inspector document $10,000 worth of high-end cabinetry sitting in the garage?",
                options: [
                    "100% complete for the kitchen section.",
                    "50% complete because the materials are on-site.",
                    "0% complete because they are not permanently affixed.",
                    "100% complete but noted as 'portable.'"
                ],
                correctIndex: 2
            },
            {
                question: "Which shot in the Narrative Photography Technique is used to show the defect’s proximity to environmental factors like a downspout or a tree?",
                options: [
                    "The Establishing Shot",
                    "The Relationship Shot",
                    "The Detail Shot",
                    "The Comparison Shot"
                ],
                correctIndex: 1
            },
            {
                question: "To capture a sharp image in a dark room without electricity, which technique is essential to avoid 'digital noise'?",
                options: [
                    "Increasing ISO to the maximum setting.",
                    "Using a 'fast' prime lens (f/1.8) and a tripod for stability.",
                    "Taking a handheld photo with a high shutter speed.",
                    "Using a flashlight pointed directly at the lens smudges."
                ],
                correctIndex: 1
            },
            {
                question: "Strategic rate negotiation for Elite inspectors should be based on:",
                options: [
                    "Annual cost-of-living increases.",
                    "Value delivery and volume-based tiers.",
                    "The lowest price a competitor is offering.",
                    "Fuel price fluctuations only."
                ],
                correctIndex: 1
            },
            {
                question: "Which action is strictly WITHIN the legal scope of a master field inspector?",
                options: [
                    "Estimating the cost of a roof replacement.",
                    "Diagnosing the cause of a mold outbreak.",
                    "Certifying that a property line is accurate.",
                    "Documenting the percentage of completion versus a Scope of Work."
                ],
                correctIndex: 3
            },
            {
                question: "True or False: Implementing geospatial clustering via algorithmic software can result in a 30% ROI by reducing fuel consumption and vehicle wear.",
                options: ["True", "False"],
                correctIndex: 0
            },
            {
                question: "True or False: A field inspector should verbally authorize the release of insurance funds to a contractor if the work looks professionally done.",
                options: ["True", "False"],
                correctIndex: 1
            },
            {
                question: "True or False: To ensure sustainable business growth, an inspector should maintain active contracts with at least 3–5 different client firms.",
                options: ["True", "False"],
                correctIndex: 0
            },
            {
                question: "Scenario: You use GIS-enabled software to point out property corners to an owner, stating you are 'officially certifying' the lot size. Why is this a violation?",
                options: [
                    "The software is not accurate enough.",
                    "Only a licensed surveyor can certify property lines.",
                    "The owner already knows the lot size.",
                    "You should charge extra for this."
                ],
                correctIndex: 1
            },
            {
                question: "Scenario: You write 'The foundation is failing because the soil is too dry'. Why is this a mistake?",
                options: [
                    "You should use more technical terms.",
                    "It's too vague.",
                    "You are diagnosing the cause, which is out of scope (acting as an engineer).",
                    "You should recommend a specific repair company."
                ],
                correctIndex: 2
            },
            {
                question: "Scenario: You ignore emails from three other firms because you are busy with one. What principle are you violating?",
                options: [
                    "Client loyalty.",
                    "Sustainable business resilience through diversification.",
                    "Email etiquette.",
                    "Time management."
                ],
                correctIndex: 1
            },
            {
                question: "Scenario: A coordinator rejects a report for a missing photo you sent. You respond angrily. What is the correct protocol?",
                options: [
                    "Demand to speak to the CEO.",
                    "Ignore the rejection.",
                    "Submit a clinical, professional rebuttal with evidence.",
                    "Post a bad review of the firm."
                ],
                correctIndex: 2
            }
        ],
        flashcards: [
            { front: "What is the inspector's responsibility regarding Winterization?", back: "Verify compliance with guidelines, do NOT perform the service." },
            { front: "What is the purpose of Winterization verification?", back: "To prevent burst pipes and structural damage." },
            { front: "What is the first step in appealing a rejection?", back: "Verify original work order instructions." },
            { front: "What is the 'Materials vs. Installed' rule?", back: "Materials on-site do NOT constitute a completed repair." },
            { front: "What is the purpose of the 'Relationship Shot'?", back: "To show the defect's proximity to environmental factors." },
            { front: "What is the estimated ROI of Route Optimization?", back: "30% (reduced fuel/wear)." },
            { front: "What is the 'One-and-Done' philosophy?", back: "Complete report and upload BEFORE driving to the next stop." },
            { front: "How do you document 50% completion if $10k cabinets are in the garage?", back: "Mark as 0% for that line item (materials not installed)." },
            { front: "What is the 'Elite' benchmark for stops/hour?", back: "6-8+ stops per hour." },
            { front: "What is the key to 'Sustainable Business Growth'?", back: "Client diversification (3-5 active contracts)." }
        ],
        scenarios: [
            {
                id: '1',
                title: 'Scenario A: The 40-Order Challenge',
                situation: 'You have 40 orders in a 150-mile radius. Manual planning limits you to 2-4 stops/hr.',
                decisionPoints: [
                    {
                        question: "How do you plan your route?",
                        options: [
                            {
                                text: "Use Google Maps and go chronologically.",
                                isOptimal: false,
                                feedback: "Inefficient. You'll waste fuel and time."
                            },
                            {
                                text: "Use algorithmic routing software for geospatial clustering.",
                                isOptimal: true,
                                feedback: "Correct. This increases capacity to 6-8+ stops/hr."
                            }
                        ]
                    }
                ],
                outcome: {
                    optimal: "You complete 40 jobs in one day ($2000 revenue).",
                    suboptimal: "It takes 2-3 days to complete the same work."
                },
                debrief: "Algorithmic optimization turns non-billable drive time into revenue."
            },
            {
                id: '2',
                title: 'Scenario B: Rejection Appeal',
                situation: 'Coordinator rejects your report for a "missing photo" which you actually sent. Contractor pressured you to inflate completion %.',
                decisionPoints: [
                    {
                        question: "How do you respond?",
                        options: [
                            {
                                text: "Argue with the coordinator emotionally.",
                                isOptimal: false,
                                feedback: "Unprofessional and risks your vendor status."
                            },
                            {
                                text: "File a clinical rebuttal with evidence (Photo #7 timestamp/GPS).",
                                isOptimal: true,
                                feedback: "Correct. This overturns the rejection and protects your status."
                            }
                        ]
                    }
                ],
                outcome: {
                    optimal: "Rejection overturned, Preferred Vendor status maintained.",
                    suboptimal: "Rejection stands, potential loss of work."
                },
                debrief: "Clinical rebuttals defend your data integrity."
            }
        ]
    }
]
