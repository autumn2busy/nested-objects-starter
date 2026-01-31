-- ============================================================================
-- ENSURE INTERACTIVE TABLES EXIST
-- Based on Module 1 schema usage
-- ============================================================================

-- 1. MODULE SECTIONS
CREATE TABLE IF NOT EXISTS module_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES training_modules(id),
    slug TEXT NOT NULL,
    section_type TEXT NOT NULL, -- 'flashcards', 'quiz', 'tool', 'scenario'
    title TEXT NOT NULL,
    description TEXT,
    estimated_duration_minutes INTEGER,
    content JSONB DEFAULT '{}'::jsonb,
    is_required BOOLEAN DEFAULT false,
    passing_score INTEGER,
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, slug)
);

-- 2. FLASHCARD DECKS
CREATE TABLE IF NOT EXISTS flashcard_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES module_sections(id),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FLASHCARDS
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES flashcard_decks(id),
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    category TEXT,
    lesson_reference INTEGER, -- Which lesson number this relates to
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES training_modules(id),
    question_number INTEGER,
    question_type TEXT NOT NULL, -- 'multiple-choice', 'true-false', 'scenario'
    question_text TEXT NOT NULL,
    options JSONB, -- Array of strings
    correct_answer TEXT, -- Index (as string '0', '1') or value
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SCENARIOS (New table to support dynamic scenarios)
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES training_modules(id),
    title TEXT NOT NULL,
    subtitle TEXT,
    audience_type TEXT, -- e.g., 'realtor', 'gig-worker'
    icon_name TEXT, -- e.g., 'Home', 'Car'
    accent_color TEXT, -- 'amber', 'blue'
    situation JSONB NOT NULL, -- { character, background, context, complication, instinct }
    decisions JSONB NOT NULL, -- Array of decision objects
    debrief JSONB NOT NULL, -- { keyLesson, coreRule, audienceWarning }
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE module_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
DROP POLICY IF EXISTS "Public can view module_sections" ON module_sections;
CREATE POLICY "Public can view module_sections" ON module_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view flashcard_decks" ON flashcard_decks;
CREATE POLICY "Public can view flashcard_decks" ON flashcard_decks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view flashcards" ON flashcards;
CREATE POLICY "Public can view flashcards" ON flashcards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view quiz_questions" ON quiz_questions;
CREATE POLICY "Public can view quiz_questions" ON quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view scenarios" ON scenarios;
CREATE POLICY "Public can view scenarios" ON scenarios FOR SELECT USING (true);
