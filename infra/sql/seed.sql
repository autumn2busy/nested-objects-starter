-- infra/sql/seed.sql
-- This script inserts sample data into the tables.
-- Run this AFTER running schema.sql and policies.sql.

-- ---------------------------------------------------------------------
-- 1. SEED: firms
-- ---------------------------------------------------------------------
INSERT INTO public.firms (name, niche, url, pay_range, requirements)
VALUES
  (
    'Acuity Field Services',
    'Residential & Commercial',
    'https://acuity.com',
    '$30 - $60 per inspection',
    'Background check, reliable transportation, smartphone'
  ),
  (
    'InspectorPro Connect',
    'Commercial Property',
    'https://inspectorpro.com',
    '$75 - $150 per inspection',
    '2+ years experience, E&O insurance, commercial certification'
  ),
  (
    'GigInspect USA',
    'Gig Economy / On-Demand',
    'https://giginspect.com',
    '$20 - $45 per task',
    'Smartphone with high-res camera, valid drivers license'
  ),
  (
    'Notary Asset Watch',
    'Notary / Financial',
    'https://notaryasset.com',
    '$25 - $50 per site visit',
    'Active Notary Public commission, background check'
  );

-- ---------------------------------------------------------------------
-- 2. SEED: firm_contacts
-- ---------------------------------------------------------------------
-- Get the IDs of the firms we just created
DECLARE
  acuity_id UUID;
  inspectorpro_id UUID;
BEGIN
  SELECT id INTO acuity_id FROM public.firms WHERE name = 'Acuity Field Services' LIMIT 1;
  SELECT id INTO inspectorpro_id FROM public.firms WHERE name = 'InspectorPro Connect' LIMIT 1;

  INSERT INTO public.firm_contacts (firm_id, name, role, email, linkedin_url)
  VALUES
    (
      acuity_id,
      'Sarah Jenkins',
      'Vendor Manager',
      'sarah.j@acuity.com',
      'https://linkedin.com/in/sarahjenkins'
    ),
    (
      inspectorpro_id,
      'Mark Chen',
      'Operations Lead',
      'm.chen@inspectorpro.com',
      'https://linkedin.com/in/markchen'
    );
END;
$$;

-- ---------------------------------------------------------------------
-- 3. SEED: resources
-- ---------------------------------------------------------------------
INSERT INTO public.resources (type, title, description, url, access_level)
VALUES
  (
    'guide',
    'Your First 5 Inspections: A Checklist',
    'A step-by-step guide to ensure you don''t miss anything on your first field jobs.',
    '/resources/guides/first-5-inspections',
    'free'
  ),
  (
    'video',
    'How to Write the Perfect Inspection Report',
    'A 10-minute video walkthrough of a perfect report that gets you paid faster.',
    '/resources/videos/perfect-report',
    'pro'
  ),
  (
    'guide',
    'Advanced Commercial Inspection Techniques',
    'Learn to spot high-value issues in commercial properties.',
    '/resources/guides/advanced-commercial',
    'elite'
  );

-- ---------------------------------------------------------------------
-- 4. SEED: jobs
-- ---------------------------------------------------------------------
DECLARE
  giginspect_id UUID;
BEGIN
  SELECT id INTO giginspect_id FROM public.firms WHERE name = 'GigInspect USA' LIMIT 1;

  INSERT INTO public.jobs (firm_id, title, location, compensation_meta, apply_url, description)
  VALUES
    (
      giginspect_id,
      'On-Demand Property Verifier',
      'Remote (Nationwide)',
      '{"type": "per-job", "range": "$20 - $45"}',
      'https://giginspect.com/apply/verifier',
      'We need reliable gig workers to perform quick property verifications. You will be asked to take 5-10 photos of a property exterior and answer a 3-question checklist on your phone. Must be able to complete tasks within 24 hours of acceptance.'
    );
END;
$$;
