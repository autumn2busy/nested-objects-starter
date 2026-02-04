import { LucideIcon } from 'lucide-react';
import {
    BookOpen, Camera, AlertTriangle, FileText, Target
} from 'lucide-react';

export interface LessonStep {
    id: string;
    title: string;
    content: string;
    critical?: boolean;
}

export interface Angle {
    angle: number;
    name: string;
    purpose: string;
    tip: string;
}

export interface AudienceWarning {
    mistake: string;
    correct: string;
}

export interface LessonData {
    id: number;
    title: string;
    subtitle: string;
    duration: string;
    videoUrl?: string; // YouTube URL
    coreConcept: string;
    sixAngleSequence?: Angle[]; // Specific to Lesson 4
    steps: LessonStep[];
    quickWin: string;
    warningSign: string;
    audienceWarnings: Record<string, AudienceWarning>;
}

export const lessonsData: Record<number, LessonData> = {
    1: {
        id: 1,
        title: "Field Services as High-Velocity Income",
        subtitle: "Lesson 1 of 6",
        duration: "12 min",
        videoUrl: "https://youtu.be/w_YEUvaZaOg",
        coreConcept: "Field services differs from gig work by requiring professional certification and adherence to strict bank instructions, but offers higher income potential.",
        steps: [
            {
                id: 'step-1-1',
                title: "Understand the Model",
                content: "(Content coming soon: Explanation of direct-to-bank vs preservation companies)",
                critical: true
            },
            {
                id: 'step-1-2',
                title: "Income Potential",
                content: "(Content coming soon: Breakdown of pay per job type)",
            }
        ],
        quickWin: "Complete your profile on a national preservation platform today.",
        warningSign: "Expecting instant payout like DoorDash/Uber - this is Net 30/15 billing.",
        audienceWarnings: {
            'gig-worker': {
                mistake: "Treating this like food delivery (speed over quality)",
                correct: "Quality is the only metric that matters. Speed comes later."
            },
            'realtor': {
                mistake: "Undervaluing the small jobs",
                correct: "Small jobs build volume and trust with vendors."
            },
            'notary': {
                mistake: "Waiting for the phone to ring",
                correct: "You must actively accept work orders in the queue."
            },
            'inspector': {
                mistake: "Ignoring the new platform requirements",
                correct: "Every vendor has different requirements. Read them."
            }
        }
    },
    2: {
        id: 2,
        title: "Mastering Industry Terminology",
        subtitle: "Lesson 2 of 6",
        duration: "10 min",
        videoUrl: "https://youtu.be/KtfUM9X5VMg",
        coreConcept: "Speaking the language of the bank establishes your credibility instantly.",
        steps: [
            {
                id: 'step-2-1',
                title: "Learn the Acronyms",
                content: "PCR (Property Condition Report), REO (Real Estate Owned), SOP (Standard Operating Procedure).",
                critical: true
            },
            {
                id: 'step-2-2',
                title: "Damage Classifications",
                content: "(Content coming soon: Definitions of vandalism vs wear and tear)",
            }
        ],
        quickWin: "Memorize the 'Big 5' acronyms: PCR, QC, bid, damages, int/ext.",
        warningSign: "Using layman's terms in official reports (e.g., 'broken window' vs 'glazing damage').",
        audienceWarnings: {
            'gig-worker': {
                mistake: "Using casual language in texts/notes",
                correct: "Always be professional. You are the eyes of the bank."
            },
            'realtor': {
                mistake: "Using sales terminology (curb appeal)",
                correct: "Use condition terminology (deferred maintenance)."
            },
            'notary': {
                mistake: "Over-formality",
                correct: "Be concise and direct. 'Front door lock broken' is sufficient."
            },
            'inspector': {
                mistake: "Using outdated terms",
                correct: "Stay current with client-specific glossaries."
            }
        }
    },
    3: {
        id: 3,
        title: "Scope of Practice (Field vs Home Inspector)",
        subtitle: "Lesson 3 of 6",
        duration: "8 min",
        videoUrl: "https://youtu.be/22oUdcEApi0",
        coreConcept: "Field Inspectors document *what they see*. Home Inspectors diagnose *why it's broken*. Do not cross the line.",
        steps: [
            {
                id: 'step-3-1',
                title: "Observation Only",
                content: "Report: 'Stain on ceiling'. DO NOT Report: 'Roof leak caused by flashing failure'.",
                critical: true
            },
            {
                id: 'step-3-2',
                title: "No Tools Required",
                content: "You generally do not need ladders or moisture meters for basic field inspections."
            }
        ],
        quickWin: "When in doubt, use the phrase 'appears to be' rather than stating absolutes.",
        warningSign: "Recommending repairs or estimating costs without being asked.",
        audienceWarnings: {
            'gig-worker': {
                mistake: "guessing at causes",
                correct: "Just take the photo. Don't play detective."
            },
            'realtor': {
                mistake: "Giving an opinion on value",
                correct: "Never discuss value or marketability unless ordered (BPO)."
            },
            'notary': {
                mistake: "Validating the condition",
                correct: "You are identifying facts, not certifying compliance."
            },
            'inspector': {
                mistake: "Doing a full home inspection",
                correct: "Stick to the form. You aren't paid for a 4-hour inspection."
            }
        }
    },
    4: {
        id: 4,
        title: "The 6-Angle Rule and Technical Photography",
        subtitle: "Lesson 4 of 6",
        duration: "15 min",
        videoUrl: "https://youtu.be/REoW8dINYoI",
        coreConcept: "Photographs are the primary unit of value; a report without forensic-quality photos is considered fraudulent.",
        sixAngleSequence: [
            {
                angle: 1,
                name: "Street Sign",
                purpose: "Proves you are in the correct neighborhood",
                tip: "Include the full street name and any cross-street if visible"
            },
            {
                angle: 2,
                name: "House Number",
                purpose: "Direct verification of the collateral address",
                tip: "Get close enough to read clearly, but include some context"
            },
            {
                angle: 3,
                name: "Front Elevation",
                purpose: "Straight-on shot including the entire roofline",
                tip: "Capture with 5% open space on all sides for full context"
            },
            {
                angle: 4,
                name: "Front Left Angle",
                purpose: "Perspective showing the front and left side",
                tip: "Step back far enough to show roof overhang and gutters"
            },
            {
                angle: 5,
                name: "Front Right Angle",
                purpose: "Perspective showing the front and right side",
                tip: "Mirror the left angle for consistency"
            },
            {
                angle: 6,
                name: "Street Views (L&R)",
                purpose: "Documents the neighborhood context",
                tip: "Show at least 2-3 neighboring properties in each direction"
            },
        ],
        steps: [
            {
                id: 'step-4-1',
                title: "Disable Orientation Lock",
                content: "All photos must be taken in landscape mode. Go to Settings > Display and turn off orientation lock.",
                critical: true,
            },
            {
                id: 'step-4-2',
                title: "Exit the Vehicle",
                content: "Never take photos through a windshield. Car parts (mirrors/dashboards) in a shot trigger immediate rejection.",
                critical: true,
            },
            {
                id: 'step-4-3',
                title: "Sync Metadata",
                content: "Ensure your app is embedding GPS, date/time stamps, and your Inspector ID in every photo.",
                critical: false,
            },
        ],
        quickWin: 'Capture the "Front Elevation" with 5% open space on all sides to provide full context.',
        warningSign: "Blurry images, fingers in the frame, or shadows of the inspector.",
        audienceWarnings: {
            'gig-worker': {
                mistake: "Taking photos from the driver's seat to save time",
                correct: "Exit the vehicle for every property, even in bad weather",
            },
            'realtor': {
                mistake: "Using your real estate listing photo style",
                correct: "This is documentation, not marketing. Straight-on, no staging",
            },
            'notary': {
                mistake: "Rushing through photos to get to the signature",
                correct: "Photos ARE the product here, not paperwork",
            },
            'inspector': {
                mistake: "Adding artistic angles or close-ups not required",
                correct: "Stick to the 6-angle sequence. Extra shots slow review",
            },
        },
    },
    5: {
        id: 5,
        title: "The Workflow",
        subtitle: "Lesson 5 of 6",
        duration: "12 min",
        videoUrl: "https://youtu.be/B6gCrwPaLyk",
        coreConcept: "A standardized workflow is the only way to scale without error.",
        steps: [
            {
                id: 'step-5-1',
                title: "Receive & Review",
                content: "(Content coming soon: Checklist for instructions before driving)",
                critical: true
            },
            {
                id: 'step-5-2',
                title: "Route Optimization",
                content: "Group orders by zip code to minimize windshield time."
            }
        ],
        quickWin: "Review all orders the night before to ensure you have necessary gate codes/keys.",
        warningSign: "Arriving at a property without reading the specific client instructions first.",
        audienceWarnings: {
            'gig-worker': {
                mistake: "Just following the GPS blindly",
                correct: "Plan your route. GPS doesn't know about rush hour or gate codes."
            },
            'realtor': {
                mistake: "spending too much time at the property",
                correct: "Get in, get the photos, get out. Efficiency is key."
            },
            'notary': {
                mistake: "Expecting a set appointment time",
                correct: "Most work is 'anytime' within a date range. You set the schedule."
            },
            'inspector': {
                mistake: "Over-documenting non-issues",
                correct: "Focus on the exceptions. If it's good, one photo proves it."
            }
        }
    },
    6: {
        id: 6,
        title: "Avoiding Beginner Mistakes",
        subtitle: "Lesson 6 of 6",
        duration: "10 min",
        videoUrl: "https://youtu.be/4EB3BQ6KB9o",
        coreConcept: "90% of chargebacks (unpaid work) come from three simply avoidable errors.",
        steps: [
            {
                id: 'step-6-1',
                title: "Wrong Address",
                content: "ALWAYS verify house number in the first photo. GPS can be wrong.",
                critical: true
            },
            {
                id: 'step-6-2',
                title: "Blurry Photos",
                content: "Tap to focus. Take a second shot if unsure."
            }
        ],
        quickWin: "Double-check your photo count before leaving the driveway.",
        warningSign: "Submitting reports late. Late = unpaid.",
        audienceWarnings: {
            'gig-worker': {
                mistake: "Speeding through the app",
                correct: "The app is your boss. If it asks for a photo, provide a good one."
            },
            'realtor': {
                mistake: "Assuming you can call the agent",
                correct: "You rarely have contact info. You are the boots on the ground."
            },
            'notary': {
                mistake: "Missing the 'action shot'",
                correct: "If you fixed something, photo the 'before', 'during', and 'after'."
            },
            'inspector': {
                mistake: "Argumentative notes",
                correct: "Just state the facts. Don't argue with the form requirements."
            }
        }
    }
};
