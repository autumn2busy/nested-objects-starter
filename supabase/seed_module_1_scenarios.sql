-- ============================================================================
-- MODULE 1: SCENARIOS MIGRATION
-- Extracts hardcoded React data into the scenarios table
-- ============================================================================

DO $$
DECLARE
    module1_id UUID := 'a1b2c3d4-e5f6-7890-abcd-000000000001';
BEGIN

    -- 1. The Career Transition Trap
    INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
    VALUES (
        module1_id,
        'The Career Transition Trap',
        'The "Helpful" Realtor',
        'realtor',
        'Home',
        'amber',
        '{
            "character": "Sarah",
            "background": "A seasoned Realtor diversifying her income with property condition reports (PCRs)",
            "context": "Sarah arrives at a property 90 days delinquent. While performing her exterior walk-around, she notices a massive horizontal crack in the west foundation wall and water stains on the living room ceiling visible through a window.",
            "complication": "The homeowner, visibly distraught, meets Sarah in the driveway. Knowing Sarah is a \"real estate professional,\" the owner begs for an assessment: \"Is the house falling apart? How much will it cost to fix? Am I going to lose everything?\"",
            "instinct": "Sarah''s realtor instincts kick in—she wants to provide a repair estimate and a professional diagnosis to ease the owner''s mind."
        }',
        '[
            {
                "id": "diagnosis",
                "question": "The homeowner asks about the foundation. What does Sarah say?",
                "options": [
                    {
                        "id": "a",
                        "text": "Tell the owner the foundation is \"failing\" and needs a $15,000 piering job",
                        "isCorrect": false,
                        "feedback": {
                            "title": "VIOLATION: Professional Overreach",
                            "message": "As a field inspector, you are a documentarian, not a consultant. Providing repair estimates or diagnoses exceeds your professional authority and creates liability for both you and the lender.",
                            "consequence": "The homeowner calls the lender citing your \"expert opinion,\" triggering an FDCPA review."
                        }
                    },
                    {
                        "id": "b",
                        "text": "Say \"I can''t give you that assessment, but I can document what I see\"",
                        "isCorrect": true,
                        "feedback": {
                            "title": "CORRECT: Maintaining Boundaries",
                            "message": "You correctly maintained the \"bright line\" between a home inspection and a field inspection. Your role is to document facts, not provide professional conclusions.",
                            "consequence": "The homeowner may be frustrated, but you''ve protected yourself and the lender from liability."
                        }
                    },
                    {
                        "id": "c",
                        "text": "Avoid the question and quickly finish the inspection",
                        "isCorrect": false,
                        "feedback": {
                            "title": "PARTIAL: Unprofessional Exit",
                            "message": "While avoiding the diagnosis is correct, rushing away without explanation damages your professional reputation and doesn''t help the homeowner understand the process.",
                            "consequence": "The homeowner may complain about your conduct, even if your report is technically correct."
                        }
                    }
                ]
            },
            {
                "id": "vocabulary",
                "question": "The homeowner asks why you''re there. What language do you use?",
                "options": [
                    {
                        "id": "a",
                        "text": "Explain that the house is in \"foreclosure\" and the bank sent you",
                        "isCorrect": false,
                        "feedback": {
                            "title": "VIOLATION: FDCPA Trigger Words",
                            "message": "Using terms like \"foreclosure\" or \"default\" with homeowners violates the Fair Debt Collection Practices Act. You are not authorized to communicate the status of their loan.",
                            "consequence": "The lender flags you for FDCPA violation. Your contract is under review."
                        }
                    },
                    {
                        "id": "b",
                        "text": "Say you''re conducting a \"property condition report\" for the servicer",
                        "isCorrect": true,
                        "feedback": {
                            "title": "CORRECT: Neutral Language",
                            "message": "Using neutral terms like \"property condition report\" and \"servicer\" communicates your purpose without making statements about the homeowner''s loan status.",
                            "consequence": "The homeowner understands your role without receiving debt collection information."
                        }
                    },
                    {
                        "id": "c",
                        "text": "Refuse to explain why you''re there",
                        "isCorrect": false,
                        "feedback": {
                            "title": "PARTIAL: Creates Suspicion",
                            "message": "While protecting information is important, refusing to explain your presence entirely may escalate the situation or cause the homeowner to call police.",
                            "consequence": "The interaction becomes confrontational, making documentation difficult."
                        }
                    }
                ]
            },
            {
                "id": "report",
                "question": "How do you describe the foundation damage in your report?",
                "options": [
                    {
                        "id": "a",
                        "text": "\"Property is in terrible condition with major structural damage\"",
                        "isCorrect": false,
                        "feedback": {
                            "title": "VIOLATION: Subjective Language",
                            "message": "\"Terrible\" and \"major\" are subjective terms. Your report should contain only observable facts, not interpretations or emotional language.",
                            "consequence": "Report rejected for subjective language. You must resubmit with objective prose."
                        }
                    },
                    {
                        "id": "b",
                        "text": "\"The foundation needs immediate repair to prevent collapse\"",
                        "isCorrect": false,
                        "feedback": {
                            "title": "VIOLATION: Professional Diagnosis",
                            "message": "Stating something \"needs repair\" or predicting \"collapse\" is a professional diagnosis. You are not qualified to make structural assessments.",
                            "consequence": "Report flagged for scope violation. Potential contract termination."
                        }
                    },
                    {
                        "id": "c",
                        "text": "\"A horizontal crack approximately 8 feet in length is visible on the west foundation wall\"",
                        "isCorrect": true,
                        "feedback": {
                            "title": "CORRECT: Objective Documentation",
                            "message": "This describes exactly what you observed with measurable details. The lender''s risk team can interpret the significance—that''s their job, not yours.",
                            "consequence": "Report accepted. Your professional, factual documentation is exactly what the lender needs."
                        }
                    }
                ]
            }
        ]',
        '{
            "keyLesson": "Maintain the \"bright line\" between field inspection and home inspection.",
            "coreRule": "You are a documentarian, not a consultant. Document facts, not diagnoses.",
            "audienceWarning": "Realtors: Your instinct to help with professional advice is your biggest liability in this role."
        }',
        1
    );

    -- 2. The Gig Worker Mindset
    INSERT INTO scenarios (module_id, title, subtitle, audience_type, icon_name, accent_color, situation, decisions, debrief, display_order)
    VALUES (
        module1_id,
        'The Gig Worker Mindset',
        'Speed vs. Quality',
        'gig-worker',
        'Car',
        'blue',
        '{
            "character": "Marcus",
            "background": "A former delivery driver used to a high-volume/low-pay model where speed is the only metric that matters",
            "context": "Marcus has a \"batch\" of 10 occupancy checks to complete before a 5:00 PM SLA deadline. It is raining, and he is behind schedule.",
            "complication": "At his fourth stop, Marcus considers staying in his dry car. He can see the front of the house from here. The grass is cut and a car is in the driveway.",
            "instinct": "Marcus assumes that as long as the photos show the house, he''ll get paid his $50 fee. Speed has always been the key to his income."
        }',
        '[
            {
                "id": "six-angle",
                "question": "It''s raining. Does Marcus exit the vehicle to capture the full 6-angle sequence?",
                "options": [
                    {
                        "id": "a",
                        "text": "Stay in the car and take photos through the window to save time",
                        "isCorrect": false,
                        "feedback": {
                            "title": "VIOLATION: \"Car Parts\" in Frame",
                            "message": "Photos with visible mirrors, dashboards, or window frames are automatically rejected. They prove you didn''t conduct the required physical survey.",
                            "consequence": "Report rejected. \"Car parts\" visible in Front Elevation shot."
                        }
                    },
                    {
                        "id": "b",
                        "text": "Exit quickly, snap 2-3 photos of just the front, and move on",
                        "isCorrect": false,
                        "feedback": {
                            "title": "INCOMPLETE: Missing Required Angles",
                            "message": "The 6-angle sequence exists for a reason—it provides complete documentation of the property''s exterior condition. Partial coverage is incomplete documentation.",
                            "consequence": "Report flagged for missing angles. Return trip required at your expense."
                        }
                    },
                    {
                        "id": "c",
                        "text": "Exit the vehicle and complete the full 6-angle sequence despite the rain",
                        "isCorrect": true,
                        "feedback": {
                            "title": "CORRECT: Professional Standards",
                            "message": "Weather doesn''t change the requirements. Proper gear (umbrella, rain jacket) is part of being a professional. The 6-angle sequence must be completed from outside the vehicle.",
                            "consequence": "Report meets technical standards. Payment confirmed."
                        }
                    }
                ]
            },
            {
                "id": "verification",
                "question": "There''s a car in the driveway and the grass is cut. How does Marcus determine occupancy?",
                "options": [
                    {
                        "id": "a",
                        "text": "Mark it \"Occupied\" based on the car and grass maintenance",
                        "isCorrect": false,
                        "feedback": {
                            "title": "VIOLATION: The \"Hamburger Without Meat\"",
                            "message": "A car in a driveway could belong to a neighbor. Cut grass could be HOA maintenance. \"Guessing\" occupancy based on assumptions provides useless information to the lender.",
                            "consequence": "The homeowner actually moved out 2 days ago. The car belongs to a neighbor. Your \"Occupied\" determination is wrong."
                        }
                    },
                    {
                        "id": "b",
                        "text": "Check utility meters and look for signs of life before making a determination",
                        "isCorrect": true,
                        "feedback": {
                            "title": "CORRECT: The Occupancy Hierarchy",
                            "message": "Signs of life: spinning electric meter, lit windows, mail being collected, trash cans at curb, pets, personal items. These are the indicators that prove occupancy—not assumptions.",
                            "consequence": "You discover the electric meter is stopped and mail is piling up. You correctly determine \"First-Time Vacant.\""
                        }
                    },
                    {
                        "id": "c",
                        "text": "Mark it \"Unknown\" since no one answered the door",
                        "isCorrect": false,
                        "feedback": {
                            "title": "VIOLATION: The Useless Report",
                            "message": "\"Unknown\" is unacceptable. Lenders pay for a definitive determination based on visual cues. \"No answer\" is not the same as \"unknown\"—you can still observe signs of life.",
                            "consequence": "Report rejected as incomplete. \"Unknown\" provides zero value to the lender."
                        }
                    }
                ]
            },
            {
                "id": "quality",
                "question": "Marcus is behind schedule. How does he handle photo quality in the rain?",
                "options": [
                    {
                        "id": "a",
                        "text": "Upload whatever he got—the lender will understand it was raining",
                        "isCorrect": false,
                        "feedback": {
                            "title": "REJECTION: Technical Standards Apply",
                            "message": "Blurry, rain-streaked, or dark photos are rejected regardless of weather. Weather conditions don''t excuse poor documentation.",
                            "consequence": "Multiple photos rejected for quality. Return trip required."
                        }
                    },
                    {
                        "id": "b",
                        "text": "Review each photo before leaving the property and retake any that are unclear",
                        "isCorrect": true,
                        "feedback": {
                            "title": "CORRECT: First-Time Pass Rate",
                            "message": "Success in field services comes from the \"First-Time Pass\" rate. Taking 30 extra seconds to verify quality saves the 30+ minutes of a return trip.",
                            "consequence": "All photos meet technical standards. Report accepted on first submission."
                        }
                    },
                    {
                        "id": "c",
                        "text": "Skip this property entirely and come back tomorrow when it''s sunny",
                        "isCorrect": false,
                        "feedback": {
                            "title": "VIOLATION: SLA Deadline",
                            "message": "Missing an SLA deadline means the report may be reassigned and your payment forfeited. Professional inspectors work in all weather conditions.",
                            "consequence": "You miss the 5:00 PM SLA. Report reassigned to another inspector."
                        }
                    }
                ]
            }
        ]',
        '{
            "keyLesson": "Field services rewards routing efficiency, not cutting technical corners.",
            "coreRule": "A report without high-quality, verifiable photos is considered incomplete or fraudulent.",
            "audienceWarning": "Gig Workers: Speed got you here, but quality keeps you earning. This is forensic data collection, not pizza delivery."
        }',
        2
    );

END $$;
