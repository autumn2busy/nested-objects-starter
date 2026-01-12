-- Auto-generated enrichment script


INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0054801b-88d1-49ef-9d7e-546e3c456db0',
    'Nationwide Virtual Site Inspections',
    'nationwide-virtual-site-inspections',
    'Technology-enabled inspection platform providing remote and virtual site inspections used by insurance carriers, lenders, and property services firms.',
    '["Virtual Inspections, Remote Property Assessments, Insurance Technology"]'::jsonb,
    'https://secure.virtualsiteinspections.com',
    33.248742,
    -111.865003,
    true,
    275,
    450,
    3.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0295c54c-3c49-4302-a73c-6808774f97f2',
    'WAVSYS',
    'wavsys',
    'WAVSYS is a professional services and contingent workforce provider focused on technology and network operations, including field deployment and engineering services. Roles often include field-oriented contractor opportunities.',
    '["Technology Services, Contingent Workforce & Field Support"]'::jsonb,
    'https://www.wavsys.com/',
    40.710575,
    -73.965102,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0314d45d-6da9-47f4-bd75-1c1bf9c5acac',
    'Turner Of The Century',
    'turner-of-the-century',
    'International construction services company providing building management, general contracting, and project consulting services.',
    '["Construction Monitoring"]'::jsonb,
    'https://www.turnerconstruction.com',
    40.755355,
    -74.000065,
    false,
    NULL,
    NULL,
    4.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '03e08f31-c635-498a-8883-5e19e467dcfb',
    'Credible Home Inspections',
    'credible-home-inspections',
    'Interior and Exterior property inspectionsphoto documentationsecuring of property to minimize safety hazardsand administrative reporting.',
    '["Field Services"]'::jsonb,
    'http://www.crediblehomeinspections.com',
    41.387203,
    -81.304222,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '03e58f3f-dce2-4006-8ada-57a0e139020e',
    'Alacrity Solutions',
    'alacrity-solutions',
    'Comprehensive insurance claims management, repair coordination, and recovery services for carriers and financial institutions.',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://www.alacritysolutions.com/',
    38.447553,
    -122.732113,
    false,
    15,
    40,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '042bb9c4-8ad6-48fb-bd56-7e0e973847c2',
    'NIIS',
    'niis',
    'National Inspection Services (NIIS) provides insurance underwriting inspections, loss control surveys, and risk assessment services for personal and commercial insurance carriers.',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://www.nationalis.com',
    36.837798,
    -119.771081,
    true,
    10,
    25,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '05d49ad7-cd15-4868-9242-fd0bc88d9523',
    'Package Research Laboratory LLC',
    'package-research-laboratory-llc',
    'PRL is the largest ISPM 15 / IPPC inspecting agency in the United States. We conduct heat treatment and fumigation inspections of wood processing companies under ALSC and WPM regulations. Our knowledgeable staff is always ready to help you with your questions of localnational and international package phytosanitary regulations. On this site you will find answers to many of your ISPM 15 issuesbut feel free to contact us if you require further information.',
    '["Field Services"]'::jsonb,
    'http://www.package-testing.com',
    40.905594,
    -74.504037,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '05ede11a-cd06-435c-80c5-abd24038161d',
    'GIS Field Services',
    'gis-field-services',
    'National mortgage field inspection firm based in Dallas, TX, providing full state direct coverage for lenders and servicers.',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://gisfieldservices.com',
    32.839871,
    -96.774837,
    false,
    20,
    300,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0763b772-6acf-4c4a-bb87-3f6e45cb78ad',
    'Spotless Chimney Sweeping & Solutions',
    'spotless-chimney-sweeping-solutions',
    'Chimney cleaning, sweeping, and repair service provider based in Connecticut.',
    '["Field Services"]'::jsonb,
    'https://spotlesschimney.com',
    41.641022,
    -72.725425,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '079e478e-00e1-498c-8da0-d01e5a0a1fb0',
    'edgemarksolutions',
    'edgemarksolutions',
    'Full service property preservation company focused on non-performing loan portfolios for brokers and banks.',
    '["Field Services"]'::jsonb,
    'https://www.edgemarksolutions.com/',
    33.613672,
    -111.925269,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '07d986b9-cf1e-42dd-a64e-3be6dc5f2c82',
    'Altisource',
    'altisource',
    'Integrated service provider offering mortgage, financial, and real estate solutions including field services and asset management.',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://www.altisource.com',
    34.058699,
    -84.290254,
    false,
    250,
    500,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '07ff0d6b-e092-42fa-840b-53926178f51f',
    'Associated Services InspectionsLTD',
    'associated-services-inspectionsltd',
    'Associated Services InspectionsLTD. is a premier commercial and residential inspection company that has been providing honest information and trusted services since 1981. Our team of licensed property inspection professionals will provide a full range of services from liability to commercial packages for our clients to provide them with superior decision-making in all matters pertaining to underwriting and property assessment. We pride ourselves on building meaningful relationships with eac...',
    '["Property Inspection"]'::jsonb,
    'https://www.associatedservicesinspections.net',
    29.867229,
    -95.582481,
    true,
    25,
    45,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0821ad8d-a798-4fe6-b165-a22574044a3d',
    'E2Value',
    'e2value',
    'Property valuation and analytics technology platform providing replacement cost estimates, inspections, and risk data solutions for insurance and financial services organizations.',
    '["Property Valuation Technology, Inspection Software, Risk Analytics"]'::jsonb,
    'https://www.e2value.com/',
    41.054082,
    -73.536216,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '08af77e2-a0f0-430c-a784-5f891220e9a1',
    'Sure Point Inspections',
    'sure-point-inspections',
    'Sure Point Inspections is a common brand name for property and home inspection services in local markets. Without a unique company website or confirmed national presence, no official URL or corporate details could be verified at this time.',
    '["Home & Property Inspections"]'::jsonb,
    'https://surepointinspection.com',
    39.522976,
    -119.81155,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '08dda74b-adb1-417a-bea6-199358d6d343',
    'CCDI LLC',
    'ccdi-llc',
    '',
    '["Field Services"]'::jsonb,
    'https://ccdiusa.com',
    28.375291,
    -80.604973,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '08e30418-a1eb-4f5a-b380-e72e12176b47',
    'TopBuild',
    'topbuild',
    'TopBuild is a leading U.S. installer and distributor of insulation and building material services for residential and commercial construction, operating through multiple subsidiaries nationwide.',
    '["Construction Services, Building Insulation & Installation"]'::jsonb,
    'https://www.topbuild.com/',
    29.197878,
    -81.084755,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '09629088-b3bd-48c7-b1ed-3cdef83c9dff',
    'Quiktrak',
    'quiktrak',
    'AT QUIKTRAKWE PROVIDE FIELD INSPECTIONSVERIFICATIONSINVENTORY AUDITINGAND PROPERTY DATA COLLECTION SERVICES FOR THE EQUIPMENT LEASINGCOMMERCIAL LENDINGWHOLESALE CREDITAND FLOOR PLAN FINANCING INDUSTRIES.',
    '["Asset Verification","Mystery Shopping","Market Research"]'::jsonb,
    'http://www.quiktrak.com',
    45.460498,
    -122.789555,
    true,
    20,
    50,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '09b7ad58-b376-4e62-b700-9a9e17db6575',
    'AMC Links',
    'amc-links',
    '',
    '["Property Inspection","Appraisal Services","Mortgage Services"]'::jsonb,
    'http://www.amclinks.com',
    39.746769,
    -75.550836,
    false,
    NULL,
    NULL,
    2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '09bfcdb6-c638-4b58-b4ae-6186b5438bbf',
    'Ivueit',
    'ivueit',
    '',
    '["Property Inspection","Appraisal Services","Valuation"]'::jsonb,
    'https://ivueit.com/',
    40.145164,
    -82.92254,
    false,
    NULL,
    NULL,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0aa2f5e2-6c5e-4989-b5e2-d1cd66cf5f1a',
    'Trinity Real Estate Solutions',
    'trinity-real-estate-solutions',
    'Trinity Real Estate Solutions provides nationwide mortgage field services including property inspections, valuations, REO support, and default servicing solutions for lenders and servicers.',
    '["Mortgage Field Services, Inspections, Valuations & REO"]'::jsonb,
    'https://www.trinityonline.com/',
    32.908319,
    -96.956403,
    true,
    30,
    55,
    3.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0aada0d7-823b-4e04-85b3-cfd6e033c2a0',
    'Simple Inspections',
    'simple-inspections',
    'Simple Inspections offers residential and commercial property inspection services including structural, roofing, and general condition reporting.',
    '["Property & Home Inspections"]'::jsonb,
    'https://simpleinspection.com/',
    35.07523,
    -89.856139,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0b4533d2-f2d3-40a3-8ca9-6314deda432d',
    'MSI (now part of MCS Mortgage Services)',
    'msi-now-part-of-mcs-mortgage-services',
    'MSI was a national property preservation and inspection services provider now acquired by MCS Mortgage Services, offering property inspection, preservation, repair management, and REO services.',
    '["Property Preservation, Field Services, Inspections"]'::jsonb,
    'https://www.mcs360.com/',
    32.991523,
    -96.983422,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0be462a4-68cc-4740-a2db-f38060e890cb',
    'Nspektr',
    'nspektr',
    '',
    '["Property Inspection","Customer Experience","Mystery Shopping"]'::jsonb,
    'https://nspektr.com/',
    44.099169,
    -123.468389,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0c011a99-ce3b-4027-ac39-3a2c352320b0',
    'Street Delivery',
    'street-delivery',
    'StreetDelivery provides next-business-day access to detailed vehicle impact photos, liability data, intersection imagery, and risk assessments for P&C insurance claims via an extensive online database and field team.}',
    '["Insurance Field Services, Liability & Vehicle Loss Data"]'::jsonb,
    'https://www.streetdelivery.com/',
    42.812315,
    -70.872532,
    true,
    25,
    24.7,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0c37d2df-ecac-4ec7-ba3c-6ca322077b53',
    'Allstate Appraisal',
    'allstate-appraisal',
    '',
    '["Appraisal Services"]'::jsonb,
    'https://www.allstateappraisal.net/',
    41.521623,
    -87.656232,
    false,
    30,
    50,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0d51036c-a418-43d5-860d-9ef64522b79e',
    'Wetherill Engineering',
    'wetherill-engineering',
    'Wetherill Engineering appears to be an engineering consulting and forensic services firm specializing in fire/explosion investigations and failure analysis. Without a definitive corporate website or vendor portal under this exact name, public enrichment cannot be verified.',
    '["Engineering Consulting, Fire & Explosion Investigation"]'::jsonb,
    'https://wetherilleng.com',
    35.76347,
    -78.726114,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0d8d3adf-7639-4ca0-a31c-896deef38ea2',
    'WC Field Service',
    'wc-field-service',
    'WC Field Service appears in field services directories as a provider of mortgage field inspections and related services, but no verified corporate website, vendor portal, or headquarters could be confirmed under this exact name at this time.',
    '["Mortgage Field Services, Property Inspections"]'::jsonb,
    'https://wcfieldservice.com',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0db19142-836f-4b25-a9db-1bfb1b63e09b',
    'Pivot Workforce',
    'pivot-workforce',
    'Staffing and workforce solutions company providing skilled and semi-skilled labor for construction, logistics, field services, and industrial operations.',
    '["Staffing, Workforce Management, Field Labor"]'::jsonb,
    'https://www.pivotworkforce.com/',
    32.931945,
    -96.840383,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0e563182-4231-46ed-87c1-0e23d455003d',
    'Williams Field Services',
    'williams-field-services',
    'Williams Field Services provides mortgage field service work including property inspections and reporting for lenders and servicers. [williamsfieldservices.com](https://williamsfieldservices.com/?utm_source=chatgpt.com)',
    '["Mortgage Field Services, Property Inspections"]'::jsonb,
    'https://williamsfieldservices.com/',
    36.058769,
    -95.861171,
    true,
    30,
    75,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0e655cc2-215d-4f11-96cf-2f574eedc30e',
    'Absolute Lending Logistics',
    'absolute-lending-logistics',
    '',
    '["Property Inspection","Appraisal Services","Asset Verification"]'::jsonb,
    'https://absolutell.com/',
    39.62181,
    -86.175319,
    false,
    300,
    600,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0ec230cb-50ca-46f2-8b21-a1f8effa2f1e',
    'Valutrust Solutions',
    'valutrust-solutions',
    'Valutrust Solutions provides valuation, appraisal support, and field service inspection solutions to lenders, servicers and real estate professionals across the United States.',
    '["Valuation & Inspection Services, Mortgage Field Services"]'::jsonb,
    'https://valutrust.com/',
    38.931093,
    -94.670713,
    true,
    275,
    425,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '0f2cc0ad-9182-4490-9112-bd0f8f853455',
    'Landgorilla',
    'landgorilla',
    'Construction finance technology and inspection coordination platform helping lenders manage construction loans safely and efficiently.',
    '["Insurance Inspection","Property Inspection","Risk Assessment"]'::jsonb,
    'https://landgorilla.com',
    35.28027,
    -120.661137,
    false,
    45,
    75,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '10e001bb-4674-45ec-a9b0-f4b6283c4429',
    'NMFS (National Mortgage Field Services)',
    'nmfs-national-mortgage-field-services',
    'National Mortgage Field Services (NMFS) provides property inspections, preservation, and REO services for mortgage servicers, lenders, and asset managers.',
    '["Mortgage Field Services, Property Inspections, Property Preservation"]'::jsonb,
    'https://nmfs.com',
    33.254191,
    -96.78524,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '11c36762-2ee9-41f7-aee6-4565b5325ffa',
    'Beacon Inspections',
    'beacon-inspections',
    'Beacon Inspections is searching for 1099 Independent Contractor Commercial Vehicle Field Inspectors in Lawrenceville, Georgia.

The ideal Independent Contractor will have experience as a diesel technician or in automotive repair industry and a knowledge of trucks, trailers, and equipment maintenance. Other common background includes auto inspectors, home inspectors, and insurance adjusters.',
    '["Field Services"]'::jsonb,
    'https://www.beaconinspection.com/',
    NULL,
    NULL,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '120c8702-d81a-4e93-9690-76fd7a6dca7e',
    'Globespec',
    'globespec',
    'GlobeSpec is a national home inspection firm providing the highest quality service to the relocation industry. GlobeSpec is one of the most respected names in the industryvalued by our clients as an integral partner in their quest for 100% client service satisfaction.

With more than 30 years of experience in the inspection business we have become an integral part of the service that our clients provide.',
    '["Insurance Inspection","Property Inspection","Risk Management"]'::jsonb,
    'https://www.globespec.com',
    42.722531,
    -73.800878,
    true,
    10,
    50,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '137e6ea9-4d98-4dc0-bd80-b61ca1c411f7',
    'First American Residential Value View',
    'first-american-residential-value-view',
    'Residential Value View is a First American valuation product offering exterior and interior property inspection reports used by lenders and servicers as appraisal alternatives.',
    '["Property Valuation, Mortgage Field Services, Inspection Products"]'::jsonb,
    'https://www.firstam.com/',
    33.701309,
    -117.865494,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '138c1a23-1cd8-420c-8034-4417759156e5',
    'USInspect',
    'usinspect',
    'USInspect appears to use a hosted hiring platform for inspection roles; no central corporate site was found. The ‘Breezy HR'' page reflects active recruitment postings for inspectors or related field roles.',
    '["Inspection Services Recruitment"]'::jsonb,
    'https://us-inspect.breezy.hr/',
    36.851844,
    -76.287909,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '15198507-0199-4aa6-82af-47f35fa3578a',
    'Five Brothers now merged with MCS 360',
    'five-brothers-now-merged-with-mcs-360',
    'MCS is Making Communities Shine with our comprehensive property services across Commercial PropertiesSingle-Family Rentals and the Property Preservation industry. For over 35 yearswe’ve been committed to responsive careindustry-leading service standards and end-to-end transparency to transform homes and businesses across the nation.',
    '["Insurance Inspection","Field Services"]'::jsonb,
    'https://mcs360.com',
    42.521365,
    -83.003091,
    true,
    20,
    40,
    2.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1569f629-f3a4-4208-9ed6-b04b825d128f',
    'Bold Control',
    'bold-control',
    '',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'http://www.boldcontrol.com',
    29.705294,
    -95.460089,
    false,
    NULL,
    NULL,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '15820929-deff-49a2-bac0-c4983dc5e651',
    'National Association of Mortgage Field Services',
    'national-association-of-mortgage-field-services',
    'Founded in 1988The National Association of Mortgage Field Services was created to provide its membership with a voice to all parties within the Industry. Members include ServicersNational Field Service ProvidersInspectorsContractors and those offering industry-specific services.

NAMFS has expanded initiatives to include: Educational OpportunitiesNetworking EventsCommunication & Industry Solutions.',
    '["Field Services"]'::jsonb,
    'http://www.namfs.org',
    40.079977,
    -82.920129,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '15cfad71-0a28-414e-aa12-a2d9b90e20a6',
    'COLEMAN CONSULTING GROUP LLC',
    'coleman-consulting-group-llc',
    '',
    '["Field Services"]'::jsonb,
    'https://www.coleman-consulting.com/',
    37.974053,
    -122.528789,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '15ec5897-06ca-4e3a-80c8-a445eda388c1',
    'Inspection Services',
    'inspection-services',
    '',
    '["Customer Experience","Appraisal Services","Mystery Shopping"]'::jsonb,
    'https://www.is-rtr.com/pages/services',
    44.91347,
    -123.021286,
    false,
    20,
    100,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1648d2f6-f060-4975-92ee-bfa855467781',
    'Cross Check Auditors',
    'cross-check-auditors',
    'Premium audit services provider for the insurance industry, delivering accurate and timely exposure analysis.',
    '["Property Preservation","Audit Services","REO Services"]'::jsonb,
    'https://www.crosscheckpremiumaudit.com/',
    41.883391,
    -87.647957,
    false,
    NULL,
    NULL,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1752d6e8-5144-4955-87e2-d42f4e696598',
    'Merchandiser/Survey.com',
    'merchandisersurveycom',
    '',
    '["Remote Verification","Virtual Inspection","Audit Services"]'::jsonb,
    'https://merchandiser.survey.com/retailgigs',
    42.358459,
    -71.060841,
    false,
    NULL,
    NULL,
    2.9
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '17e1ba9e-a852-4648-afe3-5367a20ff478',
    'PSI Services',
    'psi-services',
    'PSI Services is a global testing and assessment company providing licensure, certification exams, secure test delivery, and remote proctoring services across multiple industries.',
    '["Testing Services, Certification Exams, Proctoring"]'::jsonb,
    'https://www.psiexams.com/',
    38.940037,
    -94.792729,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '18b8cd0f-1563-49f2-8a36-624b4380c4bc',
    'Williams & Williams Auction',
    'williams-williams-auction',
    'Williams & Williams Auction provides real estate, farm, and asset auction services throughout the United States, including foreclosure and property disposition auctions.',
    '["Auction Services, Real Estate and Asset Disposition"]'::jsonb,
    'https://www.williamsauction.com/',
    36.046411,
    -95.954603,
    true,
    30,
    75,
    4.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '18eea99a-e944-4046-afd9-d0f68d88b643',
    'CFS Field ServicesLLC',
    'cfs-field-servicesllc',
    'Consulting and Field Services (CFS) is an inspector owned inspection company. Since 1995 CFS has been dedicated to providing the best MechanicalNDT and Refractory Inspection services offered within the industry.',
    '["Field Services"]'::jsonb,
    'https://www.cfsinspection.com',
    34.97453,
    -92.01653,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '190c87bd-35c2-4bd1-a2a4-a80f3d3f210b',
    'H&S Loss Control Inspections, Inc.',
    'hs-loss-control-inspections-inc',
    'H & S Loss Control Inspections has provided insurance underwriting inspection reports since 1970, serving commercial property risks and working directly with insurance underwriters across the contiguous U.S. and Hawaii.}',
    '["Loss Control Inspections, Commercial Property Inspections"]'::jsonb,
    'https://www.hsreports.com/',
    27.99278,
    -82.547038,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1a31c338-a863-441b-8c52-d084e0c32827',
    'JMI Reports',
    'jmi-reports',
    'Provider of property risk solutions and underwriting reports for insurance companies and MGAs.',
    '["Insurance Inspection","Property Inspection","Risk Management"]'::jsonb,
    'http://www.jmireports.com',
    36.159404,
    -86.773212,
    false,
    NULL,
    NULL,
    2.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1a426fb3-b4ec-4659-9e1a-ba8b644487d1',
    'Asset Management Outsourcing Services',
    'asset-management-outsourcing-services',
    '',
    '["Appraisal Services","Mortgage Services","Field Services"]'::jsonb,
    'https://amoservices.com/',
    33.933007,
    -84.147741,
    false,
    15,
    40,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1af745f6-1920-4bdb-992a-68eb54a41957',
    'Richland Insurance Services',
    'richland-insurance-services',
    'Independent insurance brokerage providing commercial and personal insurance solutions with risk management and loss control services for business clients.',
    '["Insurance Brokerage, Risk Management, Loss Control"]'::jsonb,
    'https://www.richlandins.com/',
    38.96118,
    -85.890194,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1bf795d0-0e83-4dfd-8aab-a23f902d04bf',
    'State Farm Mutual Automobile Insurance Company',
    'state-farm-mutual-automobile-insurance-company',
    'Major US insurance provider offering a wide range of property, auto, and personal insurance products.',
    '["Field Services"]'::jsonb,
    'https://statefarm.com',
    40.479999,
    -88.954391,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1cac6312-f1d5-4d1b-b5f2-8cbc6522f431',
    'E & S Inspections',
    'e-s-inspections',
    '',
    '["Insurance Inspection","Property Inspection","Risk Assessment"]'::jsonb,
    'https://www.esinspectionsinc.com/',
    33.786594,
    -118.298662,
    false,
    12,
    50,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1cc064c3-45ae-42f8-801e-026a40717075',
    'Strategic Property Associates',
    'strategic-property-associates',
    'Strategic Asset Services (a division of Strategic Property Associates) provides high-quality commercial property inspection solutions including CMBS, agency, and portfolio inspections nationwide; part of an outsourcing services group for lenders and servicers.',
    '["Commercial Property Inspections, Real Estate Services"]'::jsonb,
    'https://strategicproperty.com/',
    33.67072,
    -117.654151,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1e9b3ae5-a0d4-46fa-9a4d-a23fb374adcc',
    'Prometric',
    'prometric',
    'Global testing and assessment company providing secure exam delivery, certification testing, and remote proctoring services for licensure, credentialing, and professional exams.',
    '["Testing Services, Certification Exams, Proctoring"]'::jsonb,
    'https://www.prometric.com/',
    39.275241,
    -76.569004,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '1f7abb37-25ae-47e4-be13-47187d2e440b',
    'GreenWorks Inspections & Engineering',
    'greenworks-inspections-engineering',
    '',
    '["Field Services"]'::jsonb,
    'https://greenworksinspections.com/',
    32.80928,
    -96.805951,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '207db4e4-6e5f-4049-88fd-deffcff4bea8',
    'Kryterion Inc',
    'kryterion-inc',
    'Testing and assessment services company providing online exams, secure test delivery, and remote proctoring for certification bodies and enterprises.',
    '["Testing Services, Online Assessments, Proctoring"]'::jsonb,
    'https://www.kryterion.com/',
    33.375953,
    -111.97396,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '20857254-a1f9-4430-b772-12b593ee2b28',
    'MB Field ServicesInc.',
    'mb-field-servicesinc',
    'At Mortgage Bankers Field Serviceswe specialize in delivering high-quality residential property inspections tailored to the needs of financial institutionsinsurance providersand field service companies. With a commitment to accuracy and efficiencywe provide timely and reliable inspection services across the United States.',
    '["Field Services"]'::jsonb,
    'https://www.mortgagebankersfs.com/',
    41.979485,
    -88.137167,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '208c1201-19d8-40b9-b25e-c8688802ced4',
    'Dart Appraisal',
    'dart-appraisal',
    '',
    '["Appraisal Services","Data Verification","Field Services"]'::jsonb,
    'https://www.dartappraisal.com',
    42.559091,
    -83.115077,
    false,
    60,
    80,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '20f8bdfb-7a23-4544-ab2c-3ee55b1a84f7',
    'Insurance Safety Consultants',
    'insurance-safety-consultants',
    '',
    '["Construction Monitoring","Project Inspection","Audit Services"]'::jsonb,
    'https://isclc.com/',
    32.986618,
    -96.802041,
    false,
    NULL,
    NULL,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2118bddf-9a9a-4a4c-b206-4c7ec1d1a728',
    'Local Vacation Rentals',
    'local-vacation-rentals',
    'Generic business name used by multiple short-term rental and property management operators across different markets. No single verified national company, official website, or corporate headquarters could be confirmed.',
    '["Vacation Rental Management, Property Management"]'::jsonb,
    'RUN ON LOCAL Companies hiring contractors',
    33.322977,
    -83.371641,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '224cbbd8-9f4e-4c23-98c5-b05139ce7bd3',
    'Best Choice Roofing',
    'best-choice-roofing',
    'National roofing contractor offering residential roof repair, replacement, and free inspections across multiple states, recognized as a Platinum Preferred Contractor by Owens Corning.',
    '["Roofing Services, Home Improvement"]'::jsonb,
    'https://bestchoiceroofing.com/',
    35.748162,
    -81.371775,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '22ec2d2a-0755-43a9-a3de-02a6d0dd6790',
    'Far Inspections',
    'far-inspections',
    '',
    '["Property Inspection","Appraisal Services","Field Services"]'::jsonb,
    'https://www.farinspections.com',
    39.525749,
    -119.813051,
    false,
    20,
    30,
    1.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '23e0e7cb-09e4-41f6-9329-a8fcc72a1194',
    'Underwriter Service Association',
    'underwriter-service-association',
    'Underwriter Service Association provides underwriting support services to the insurance industry, including inspection coordination, data collection, and risk evaluation assistance for carriers and managing general agents.',
    '["Insurance Services, Underwriting Support, Inspections"]'::jsonb,
    'http://www.underwriterservicesassoc.com',
    33.644947,
    -96.631042,
    true,
    35,
    60,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2453f010-7bff-440e-9984-b3284952ffae',
    'MountainCreek Solutions',
    'mountaincreek-solutions',
    '',
    '["Appraisal Services","Field Services","Valuation"]'::jsonb,
    'https://mountaincreeksolutions.com',
    30.285991,
    -81.487917,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '25ac3042-935e-47a9-ab89-c4a8e4d7af94',
    'Sure Guard Property Inspections',
    'sure-guard-property-inspections',
    '',
    '["Field Services"]'::jsonb,
    'https://www.sureguardpropertyinspections.com/',
    33.907799,
    -84.479121,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '25bc6fd8-0d93-4c80-8d35-871d81c0c3fc',
    'Glotel',
    'glotel',
    '',
    '["Field Services"]'::jsonb,
    'https://glotel.com',
    41.981639,
    -87.843412,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '25c3032e-067b-42aa-a13b-907ce1a133e6',
    'Vanguard Inspection Services',
    'vanguard-inspection-services',
    'Vanguard Inspection Services provides disaster housing inspection services under FEMA''s Housing Inspection Services (HIS) program using a network of independent contractors deployed for disaster response and property assessments.',
    '["Disaster & Housing Inspections, Field Services"]'::jsonb,
    'https://vanguardhis.com/',
    39.197691,
    -78.152093,
    true,
    250,
    375,
    3.9
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '269aaa79-4332-4187-8efe-b5ec44d1a237',
    'Transfer Ease',
    'transfer-ease',
    'Transfer Ease provides corporate relocation support services including property inspections, home sale assistance, and relocation coordination for employers and transferees.',
    '["Relocation Services, Property Inspections, Real Estate Support"]'::jsonb,
    'https://transfereaserelocation.com',
    35.763123,
    -88.605332,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '276a278f-d3b1-410e-bed3-1a6860a4060c',
    'Pro Teck Valuation Services',
    'pro-teck-valuation-services',
    'Residential real estate valuation company delivering intelligent home value insights (part of Stewart Valuation Intelligence).',
    '["Insurance Inspection","Valuation Services","Loss Control"]'::jsonb,
    'https://www.stewartvaluation.com/',
    42.387025,
    -71.199413,
    false,
    40,
    600,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '28a8d2c1-a8c7-4c7f-baa6-c0ac2cbe838e',
    'Shiner Exteriors',
    'shiner-exteriors',
    'Shiner Exteriors is a name used by multiple local exterior contracting firms across the U.S. Under this exact name, no single verified national company website, vendor portal, or primary headquarters could be confirmed.',
    '["Exterior Home Services, Roofing, Siding"]'::jsonb,
    'https://shinerexteriors.com',
    38.988004,
    -77.445335,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '28c776a9-7232-4c3f-8810-c7ed89b36496',
    'Information Providers',
    'information-providers',
    '',
    '["Property Preservation","Field Services"]'::jsonb,
    'https://www.informationproviders.com/',
    44.9229,
    -93.412177,
    false,
    15,
    25,
    3.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '29b00e3d-a6e4-4052-b0c6-9168d81214a1',
    'Aspen Risk Management',
    'aspen-risk-management',
    'Welcome to Aspen Risk Management Group where our primary purpose is to save livesprevent injuriesand protect our clients from harm. Since 2005 we''ve helped over 9,500 organizations and over a million people work safer.',
    '["Field Services"]'::jsonb,
    'http://www.aspenrmg.com',
    32.829914,
    -117.119539,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2aad5b13-583a-4ae4-aaf3-763aa892956e',
    'Insursolv LLC',
    'insursolv-llc',
    '',
    '["Insurance Inspection","Risk Assessment","Field Services"]'::jsonb,
    'http://insursolv.com/',
    44.099169,
    -123.468389,
    false,
    50,
    90,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2bf3e96a-71ac-4d1f-a739-3f43ba574228',
    'NAN AMC',
    'nan-amc',
    '',
    '["Photo Documentation","Remote Inspection","Field Services"]'::jsonb,
    'https://nan-amc.com/',
    28.146511,
    -82.755483,
    false,
    45,
    85,
    3.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2c419b6a-58f4-4416-a44d-c65b0df4bf00',
    'Asset Defense LLC',
    'asset-defense-llc',
    '',
    '["Property Preservation","Property Inspection","Loss Mitigation"]'::jsonb,
    'https://www.assetdefense.org/',
    38.648432,
    -121.066252,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2cc08e42-80d9-42ce-8fc7-800b5b75dd01',
    'Metropolitan Solutions',
    'metropolitan-solutions',
    'Welcome to Metropolitan Solutions GroupInc.a nationally recognized leader in Environmental EngineeringEnvironmental Laboratory TestingSafety and Environmental Trainingand Occupational Health Services. Our full-service consulting firm has offices in PortsmouthVASan DiegoCAand BremertonWAwith team members across the U.S. We deliver high-quality services efficiently and cost-effectivelywith an extensive professional network of local inspectorslaboratoriesand training ...',
    '["Field Services"]'::jsonb,
    'http://www.metrosolutionsusa.com',
    33.795677,
    -117.88954,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2cc59c10-3297-47fb-bbce-9aaebfbe0ba4',
    'S2 Inspections',
    's2-inspections',
    'S2 Inspections provides professional inspection services nationwide for property condition reporting and related field work.',
    '["Property Inspections, Field Services"]'::jsonb,
    'http://www.s2inspect.com/',
    40.726022,
    -111.87151,
    true,
    25,
    45,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2d92389d-2cb9-4cf7-89af-3ea9c6ce8a3b',
    'KY Field Services',
    'ky-field-services',
    'Company name appears in mortgage field services and inspection-related contexts, but no verified official website, vendor portal, or primary corporate address could be confirmed under this exact name.',
    '["Mortgage Field Services, Property Inspections"]'::jsonb,
    'https://kyfieldservices.com',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2e19de51-e886-4d09-89a8-214572765d86',
    'Reotrans.com / equator.com',
    'reotranscom-equatorcom',
    '',
    '["Field Services"]'::jsonb,
    'https://equator.com',
    33.976739,
    -118.391139,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2edcdd2e-954e-4752-82fa-953654cb7c20',
    'Maiden & Associates Architecs/Engineers/ Planners',
    'maiden-associates-architecsengineers-planners',
    'Company at index 72 is a professional field service provider.',
    '["Field Services"]'::jsonb,
    'http://www.maidenarchitects.com',
    38.95424,
    -77.082717,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '2f6ffd41-c5ef-4164-b015-8dfcfa253a8d',
    'Landmark Field Services',
    'landmark-field-services',
    'Landmark Field Services is a leading land services provider in the right of way and site acquisition business.

Landmark Field Services serves the mid-stream oil & gas transmissionelectric transmissionutilitywindtransit and transportation sectors.',
    '["Insurance Inspection","Field Services","Loss Control"]'::jsonb,
    'https://www.lfsrow.com',
    32.762411,
    -97.068936,
    true,
    45,
    65,
    2.9
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '309dcd7e-f49d-4a6c-9493-6cf9d1f6ed23',
    'Global Surveys',
    'global-surveys',
    '',
    '["Property Inspection","Virtual Inspection","Field Services"]'::jsonb,
    'https://www.globalsurveys.com',
    35.280765,
    -89.691696,
    false,
    NULL,
    NULL,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '30c7ea60-3f8c-4f30-8edf-1ab49f474c2f',
    'Derbyshire Field Services',
    'derbyshire-field-services',
    '',
    '["Field Services"]'::jsonb,
    '',
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3122bd49-188d-4f58-8a14-a29e791416c4',
    'Resolution Group',
    'resolution-group',
    'Resolution Group provides insurance claims support services including property inspections, damage assessments, dispute resolution, and alternative dispute services for carriers and insurers.',
    '["Insurance Claims Services, Property Inspections, Dispute Resolution"]'::jsonb,
    'https://www.resolutiongrp.com/',
    40.119103,
    -83.01451,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '32f35295-eda0-4199-aa86-b93332108e92',
    'Seek Now',
    'seek-now',
    'Technology-enabled inspection platform delivering fast, accurate property data for insurance carriers and real estate investors.',
    '["Field Services"]'::jsonb,
    'https://seeknow.com',
    38.29668,
    -85.542469,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '33583e58-9595-4cbe-b348-3802a8903e48',
    'Property And Casualty Surveys SW',
    'property-and-casualty-surveys-sw',
    '',
    '["Property Inspection","Property Management","Field Services"]'::jsonb,
    'https://www.pcs-sw.com/',
    32.963429,
    -96.818149,
    false,
    30,
    50,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '33835481-65d4-4c59-8953-a9ae19e02870',
    'Field Force Inspections',
    'field-force-inspections',
    '',
    '["Property Inspection","Appraisal Services","Field Services"]'::jsonb,
    'http://www.fieldforceinspections.com/',
    30.341531,
    -97.7549,
    false,
    45,
    75,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '33a384cb-a159-413a-af4d-9c1747868279',
    'F.R.R.S.C LLC',
    'frrsc-llc',
    '',
    '["Field Services"]'::jsonb,
    'https://frontrangeroofingsc.com',
    44.099169,
    -123.468389,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '35250c60-45dd-493a-899b-e69bb3ee102a',
    'Mutual Inspection Bureau',
    'mutual-inspection-bureau',
    'Inspection services for residential, commercial, and agricultural properties serving the insurance industry for over 80 years.',
    '["Property Inspection","Field Services"]'::jsonb,
    'http://www.mibinc.com/',
    40.336113,
    -76.83368,
    false,
    NULL,
    NULL,
    4.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '365dfe15-c2d9-4ace-b7ab-26192e07d2be',
    'GridSource Incorporated LLC',
    'gridsource-incorporated-llc',
    '',
    '["Field Services"]'::jsonb,
    'https://www.gogridsource.com/',
    30.44924,
    -91.185607,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '38852e3a-47e6-46b3-833f-30fbe2810238',
    'Reliable Reports',
    'reliable-reports',
    'Provider of personal and commercial property inspections for the insurance industry since 1971.',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://www.reliablereports.com',
    33.037453,
    -96.988813,
    false,
    NULL,
    NULL,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '38905fbe-299b-4516-9572-34f5020e6ac5',
    'Top Tier Public Adjusters',
    'top-tier-public-adjusters',
    '',
    '["Field Services"]'::jsonb,
    'https://toptierpublicadjusters.com',
    44.099169,
    -123.468389,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '38976ef7-84b4-4fbc-ae9c-89a0f3ca3efa',
    'NotaryCam',
    'notarycam',
    '',
    '["Property Preservation","Field Services","Remote Notary"]'::jsonb,
    'https://www.notarycam.com/',
    33.670606,
    -117.862036,
    false,
    175,
    225,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3897b587-e531-449f-84be-d8fd56283c0b',
    'Network Mortgage Servicing',
    'network-mortgage-servicing',
    'Company name appears in mortgage servicing and field services contexts, but no verified official website, vendor portal, or primary corporate address could be confirmed under this exact name.',
    '["Mortgage Servicing, Field Services"]'::jsonb,
    'http://www.networkmortgageservicing.com',
    34.184948,
    -118.597221,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3bf651b1-1a50-4499-b9b5-ec69bf071f0f',
    'Regional Reporting',
    'regional-reporting',
    'Regional Reporting provides insurance inspections, loss control surveys, and underwriting support services for personal and commercial insurance carriers nationwide.',
    '["Insurance Inspections, Loss Control, Risk Assessment"]'::jsonb,
    'https://www.regionalreporting.com/',
    40.708128,
    -74.006525,
    true,
    25,
    45,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3c519539-9525-4cca-b460-738e130aa07c',
    'Rimkus Consulting Group',
    'rimkus-consulting-group',
    'Rimkus Consulting Group is a global engineering and technical consulting firm providing forensic investigations, expert witness services, construction consulting, and property damage assessments.',
    '["Engineering Consulting, Forensic Investigations, Property Inspections"]'::jsonb,
    'https://rimkus.com/',
    29.789027,
    -95.601679,
    true,
    NULL,
    NULL,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3c5f56a9-e0f7-4f79-86d7-60a6a263b8d6',
    'Inspect SolutionsInc.',
    'inspect-solutionsinc',
    'We provide nationwide inspection services24/7 access to our online reporting systemmulti-user capabilitiesand the option for a 2nd or 3rd opinion. No job is too big or too small. We are here to assist you.',
    '["Field Services"]'::jsonb,
    'http://www.inspectsolutions.com',
    41.899571,
    -87.66119,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3d01de1b-d4ea-4a99-a07c-1496602e9bfd',
    'Altisource/Construction Risk Management - Granite',
    'altisourceconstruction-risk-management-granite',
    'Trusted mortgage and real estate solutions provider. Helping servicersoriginators and investors maximize resultsminimize costs and mitigate risks',
    '["Field Services"]'::jsonb,
    'http://www.altisource.com',
    34.058699,
    -84.290254,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3d137341-69dc-411d-be8e-e7aa6655173f',
    'The Shadow Agency',
    'the-shadow-agency',
    'The Shadow Agency provides mystery shopping, compliance audits, and field inspection services to retail, hospitality, and service-based organizations nationwide.',
    '["Mystery Shopping, Field Audits, Compliance Inspections"]'::jsonb,
    'https://theshadowagency.com/',
    32.867855,
    -96.949314,
    true,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3d2633cc-84fa-43ca-8aed-4a64ba042adc',
    'Western Field Services',
    'western-field-services',
    'Western Field Services provides borrower outreach, property inspections, occupancy verification, and field support services for mortgage servicers, lenders, and asset managers.',
    '["Mortgage Field Services, Property Inspections, Due Diligence"]'::jsonb,
    'http://www.westernfieldservices.com',
    33.752886,
    -116.055617,
    true,
    30,
    75,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '3ee2b201-fa8a-4084-bea1-7b8e685aa1e7',
    'Cinch Home Services',
    'cinch-home-services',
    '',
    '["Property Inspection","Appraisal Services","Valuation"]'::jsonb,
    'https://www.cinchhomeservices.com',
    26.389014,
    -80.10664,
    false,
    175,
    500,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '401b6120-224f-4ed2-a3bf-965ed8f3ed1a',
    'Nationwide Loans',
    'nationwide-loans',
    '',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://www.drawrequest.com',
    33.303512,
    -111.997947,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '40738fa9-d28b-42d5-a5e7-4c274f6c844c',
    'Rekor',
    'rekor',
    'Intelligence Driven Innovation. 

Rekor Systems, Inc., (NASDAQ: REKR) is a trusted global authority in the development and implementation of intelligent infrastructure focused on addressing critical challenges across public safety, transportation management, and urban mobility markets. We believe that the intelligent infrastructure industry is at the epicenter of converging forces that will drive profound changes in the way government agencies, law enforcement and businesses operate and collaborate today and in the future. With our ‘Rekor One’  roadway intelligence engine as our foundation, we collect and transform raw data into actionable insights that gives governments and businesses a comprehensive picture of roadways, vehicles, pedestrians, traffic, incidents, while providing an intuitive environment that makes collaboration across teams and organizations easy.  Rekor leverages computer vision, machine learning, and big data analytics to drive AI-enabled IoT solutions (‘AIoT’) on the edge of the network with unparalleled speed, accuracy, and agility. With our disruptive AI-powered technology, integrated hardware and software solutions, and state of the art machine learning models, we deliver actionable insights and transformative impact that increase roadway safety, efficiency, and sustainability for our customers and citizens, while enabling safer, smarter, greener, and more equitable cities and communities.  

Our employees represent the best and smartest top talent in our industry, and we select individuals to be a part of our team who help to define our culture and success. Rekor’s Values and Leadership Principals are: People First, Customer Success, Earn Trust, Deliver Impact and Think Big and Bold! Learn more by visiting www.rekor.ai.

SUMMARY

Traffic Data Technicians will oversees the setup of video and data collection equipment at traffic study locations and the removal of the equipment. As well as assists with the processing and backup of data collected.',
    '["Field Services"]'::jsonb,
    'https://www.rekor.ai/',
    NULL,
    NULL,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '41d59fed-861f-4a4d-a6ff-5d5238e19694',
    'ACT Appraisal',
    'act-appraisal',
    '',
    '["Property Inspection","Appraisal Services"]'::jsonb,
    'https://www.actappraisal.com',
    42.15429,
    -88.114215,
    false,
    300,
    650,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '420afcd6-202b-4d5a-8843-befaa7dd4aae',
    'Complete Claims Service',
    'complete-claims-service',
    '',
    '["Regulatory Compliance","Verification Services","Insurance Inspection"]'::jsonb,
    'https://completeclaims.com/',
    40.672596,
    -73.473859,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '426b5e93-be1a-42de-bd58-3d1b474698db',
    'ID Plans',
    'id-plans',
    '',
    '["Pre-employment Screening","Background Verification","Property Inspection"]'::jsonb,
    'https://www.idplans.com',
    27.94762,
    -82.45936,
    false,
    2,
    50,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '42e5ce14-c4aa-428f-b494-523fb3f0bacc',
    'NRG Energy',
    'nrg-energy',
    'NRG Energy is a leading U.S. energy company providing electricity, natural gas, and energy solutions to residential, commercial, and industrial customers.',
    '["Energy Services, Utilities, Infrastructure"]'::jsonb,
    'https://www.nrg.com/',
    40.32374,
    -74.649213,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4375caa2-eea0-46fc-934f-4536eb970e39',
    'Accurate Appraisal Management Services',
    'accurate-appraisal-management-services',
    'Appraisal management company providing residential real estate valuation services.',
    '["Appraisal Services"]'::jsonb,
    'https://www.aamsappraisals.com/',
    33.665338,
    -112.110765,
    false,
    250,
    500,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4396d555-0c07-4008-bfbd-604cf23ccaf7',
    'ServiceLink',
    'servicelink',
    'By combining industry-leading services with differentiating technologywe meet lendersservicers and investors where they are and guide them to our industry''s future',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://www.svclink.com/',
    40.487938,
    -80.199636,
    true,
    55,
    95,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '43f056a7-c4aa-411d-ae8f-e9eec914874e',
    'Elliott & Company Appraisers',
    'elliott-company-appraisers',
    'Elliotta division of Nationwide Property & AppraisalsLLCfirst offered real estate appraisals on October 11980 in North Carolina. Over the thirty plus years since our inceptionwe have evolved into a specialty evaluation company offering complex evaluation services over a national and international footprint. We have a track record of providing professional services which require quantitative analysis and personal attention exceeding the capabilities of most of our competitors. We app...',
    '["Customer Experience","Appraisal Services","Mystery Shopping"]'::jsonb,
    'https://www.elliottco.com',
    35.956288,
    -79.996408,
    true,
    30,
    200,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '44f55d7f-0224-441b-97eb-63807c2c761f',
    'Sage Consulting Group',
    'sage-consulting-group',
    'Sage Consulting Group provides engineering consulting, construction inspection support, and field service management for infrastructure and commercial projects.',
    '["Engineering Consulting, Field Services, Inspection Support"]'::jsonb,
    'http://www.sageconsulting.com',
    39.734428,
    -104.985977,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '45697f94-4eba-40a8-95e8-4417fb113d2b',
    'Southern Elite Field Services LLC',
    'southern-elite-field-services-llc',
    'Keeping an eye on your assets.',
    '["Field Services"]'::jsonb,
    'http://soelitefs.com',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '457de9fe-78db-46a6-be71-8cd9f39b10d0',
    'RTR Services Inc.',
    'rtr-services-inc',
    'RTR Services, Inc. is a full-service national asset management company offering inspections, asset evaluations, recovery, remarketing, inventory control and related field services across the U.S.',
    '["Asset Management, Inspection Services, Field Operations"]'::jsonb,
    'https://www.rtrservices.com/',
    44.91347,
    -123.021286,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '45f3a470-0b3c-4834-bd38-1b469d46511b',
    'CIS',
    'cis',
    'CIS Inspects offers various levels of construction cost analysis reportslevel of completion analysisannual portfolio reviews and much more. With our nationwide team of trained professional inspectorsour experienced staff is prepared to provide you with everything from commercial and residential construction progress inspections to construction cost analysis reportsannual portfolio reviews and much more.',
    '["Field Services"]'::jsonb,
    'https://cisinspects.com',
    32.929271,
    -97.115333,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4623c69b-2457-4e55-9134-4a452763640c',
    'Verity Solutions',
    'verity-solutions',
    'Independent automotive inspection and verification service specializing in mechanical failure analysis andwarranty claims.',
    '["Property Inspection"]'::jsonb,
    'https://verityinspections.com/',
    40.370684,
    -74.008432,
    false,
    NULL,
    NULL,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '48f86e84-fc20-457b-ae1f-4ea283830cfd',
    'Field Connections',
    'field-connections',
    '',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://www.fieldconnections.net/',
    42.606954,
    -82.953665,
    false,
    15,
    25,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '498cf5bc-e102-400a-a080-e1f5c271f496',
    'Defense Logistics Agency',
    'defense-logistics-agency',
    'U.S. Department of Defense agency providing logistics, acquisition, and supply chain services to military and federal partners worldwide.',
    '["Government Logistics, Supply Chain Management, Defense Support Services"]'::jsonb,
    'https://www.dla.mil/',
    38.743425,
    -77.141006,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '499c5d90-7b6b-4a76-8c67-a9ad4f4abdec',
    'Inspection Depot',
    'inspection-depot',
    '',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://inspectiondepot.com/',
    30.28909,
    -81.524871,
    false,
    NULL,
    NULL,
    3.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4a4afcbc-00e9-4475-a126-ca8edb28e7e2',
    'Xceedance',
    'xceedance',
    'Xceedance is a technology-driven partner for insurers, offering digital claims solutions, virtual estimating, catastrophe analytics, and risk management support, as well as careers in insurance technology and claims services.',
    '["Insurance Tech, Claims & Risk Management"]'::jsonb,
    'https://www.xceedance.com/',
    42.320377,
    -71.58591,
    true,
    20,
    90,
    3.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4a5d689d-90d6-4411-b8bb-363abb82e58b',
    'National Mortgage Field Services',
    'national-mortgage-field-services',
    'Company name appears in mortgage field services contexts, but no verified official website, vendor portal, or primary corporate address could be confirmed under this exact name.',
    '["Mortgage Field Services, Property Inspections, Property Preservation"]'::jsonb,
    'https://mortgagefieldservices.com',
    32.451203,
    -83.821175,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4ad5afdc-0213-4422-8b91-8adaa03246bc',
    'Ernst & Young LLP',
    'ernst-young-llp',
    '',
    '["Property Inspection"]'::jsonb,
    'https://www.ey.com/en_us/services',
    40.752713,
    -73.997463,
    false,
    NULL,
    NULL,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4ad7a879-c4aa-427d-bbd8-1fa0456a10a7',
    'Orkin',
    'orkin',
    'Industry leader in specialized pest control protection against termites, rodents, and common pests.',
    '["Field Services"]'::jsonb,
    'https://orkin.com',
    33.816204,
    -84.367333,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4b2d8a5d-744d-4e24-8030-56a1fcb9eb40',
    'Xactus',
    'xactus',
    'Xactus provides real-time property valuation and risk insight solutions including photo/video property data capture, flood zone reports, and appraisal workflow tools. Its mobile property inspection tools streamline the valuation process for lenders, insurers, and real estate stakeholders.',
    '["Property Valuation Technology, Appraisal Data & Risk Insights"]'::jsonb,
    'https://xactus.com/',
    32.922859,
    -96.997203,
    true,
    35,
    80,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4be3096c-026b-4d91-840b-c1252f5153cb',
    'Your Virtual Adjuster',
    'your-virtual-adjuster',
    'Your Virtual Adjuster provides virtual adjusting services to support property claims, enabling remote claim assessment and data capture to assist carriers and policyholders with damage documentation and settlement. ',
    '["Virtual Adjusting, Insurance Claim Services"]'::jsonb,
    'https://www.yourvirtualadjuster.com/',
    36.145644,
    -115.174473,
    true,
    35,
    60,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4d232f3e-4000-4b54-b70e-46167c1565c5',
    'True Footage',
    'true-footage',
    'True Footage provides property data intelligence using on-demand field capture, remote inspections, and technology-enabled reporting for insurance, real estate, and risk management use cases.',
    '["Property Data, Insurtech, Remote Inspections"]'::jsonb,
    'https://truefootage.tech/',
    47.624974,
    -122.359653,
    true,
    250,
    450,
    2.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4da18725-5dba-45be-a26d-2d45a086e4d3',
    'SingleSource Property Solutions',
    'singlesource-property-solutions',
    'SingleSource Property Solutions provides nationwide mortgage field services including property inspections, preservation, and REO support for lenders and servicers.',
    '["Mortgage Field Services, Property Inspections, Preservation"]'::jsonb,
    'https://www.singlesourceproperty.com/',
    40.274113,
    -80.166533,
    true,
    NULL,
    NULL,
    3.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4e124be5-4907-48fb-9af6-562d9b79142b',
    'EXL Overland SolutionsInc.',
    'exl-overland-solutionsinc',
    'Superior customer experiences. Profitable growth. Greater speed-to-market and efficiency. EXL uses dataanalyticsdomain softwareand artificial intelligence to make these goals achievable for global insurersreinsurersbrokersand insurtechs.

By combining our cloud-first digital insurance software solutions and industry expertise with generative AImachine learningadvanced analyticsand platformswe enable insurance businesses to transform operations and embed artificial intellig...',
    '["Field Services"]'::jsonb,
    'https://www.exlservice.com/industries/insurance',
    40.757603,
    -73.973994,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4f00f2bb-3645-4466-b027-6bc7536c9fe4',
    'Insurance Audit Services',
    'insurance-audit-services',
    '',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://www.insaudit.com/',
    29.705294,
    -95.460089,
    false,
    NULL,
    NULL,
    3.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '4ff214b5-7d90-446d-b160-978fcc7615ab',
    'WinnCompanies',
    'winncompanies',
    'WinnCompanies is one of the largest managers of affordable housing in the United States, focused on creating quality living communities and offering property management, real estate development, and maintenance services.',
    '["Property Management, Affordable Housing, Real Estate Services"]'::jsonb,
    'https://www.winncompanies.com/',
    42.359249,
    -71.057921,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '50106893-13c3-49db-b3b3-23dbf9a258ea',
    'Mortgage Bankers Field Services',
    'mortgage-bankers-field-services',
    '',
    '["Document Verification","Mortgage Services","Remote Notary"]'::jsonb,
    'https://www.mortgagebankersfs.com',
    41.979485,
    -88.137167,
    false,
    NULL,
    NULL,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '50236525-2b69-4019-9771-cab3b0f12410',
    'AiM Inspections',
    'aim-inspections',
    '',
    '["Property Inspection"]'::jsonb,
    'https://homepage.aiminspections.com/',
    33.823777,
    -118.251201,
    false,
    30,
    75,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '50606479-4d03-4488-9093-2b8d849454ed',
    '2M Quality',
    '2m-quality',
    '2M Quality provides quality review and consulting services for new-home buildersoffering quality control programs to enhance craftsmanship and customer satisfaction.',
    '["Field Services"]'::jsonb,
    'https://2mquality.com',
    39.440948,
    -77.039841,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '511abfce-054b-4df7-817e-d87f72733482',
    'Hospitality Softnet Inc.',
    'hospitality-softnet-inc',
    'Hospitality Softnet provides hotel and hospitality sales training, mystery shopping assessments, teleprospecting services, and competitive intelligence programs for hospitality clients.',
    '["Hospitality Training and Assessments, Mystery Shopping, Teleprospecting"]'::jsonb,
    'https://www.hospitalitysoftnet.com/',
    30.241368,
    -81.549113,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '5279d997-cdea-4f59-8966-2ac9f7083b51',
    'Ellis Property Management',
    'ellis-property-management',
    '',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://www.epmsonline.com/',
    32.893267,
    -96.990115,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '5590c565-f72d-4244-875d-72ad4d3a06c0',
    'Lenders Quality Assurance',
    'lenders-quality-assurance',
    '',
    '["Insurance Inspection","Property Inspection","Field Services"]'::jsonb,
    'http://www.lendersqualityassurance.com',
    33.306349,
    -111.99672,
    false,
    55,
    85,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '55c9dd9e-44ee-4abc-923e-7df304990d9a',
    'Upwork',
    'upwork',
    'Upwork is a global freelance marketplace connecting businesses with independent professionals across technology, creative, administrative, and field-adjacent services.',
    '["Freelance Marketplace, Professional Services Platform"]'::jsonb,
    'https://www.upwork.com/',
    37.778612,
    -122.395284,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '55ca393d-37d4-4365-b6fc-bd18ef6c0416',
    '24 Asset Management Corp.',
    '24-asset-management-corp',
    '',
    '["Property Inspection","Asset Verification"]'::jsonb,
    'https://www.24asset.com/',
    25.729894,
    -80.407025,
    false,
    NULL,
    NULL,
    1.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '564ca5a2-55cd-48d3-9ee7-aaf5dcf9db70',
    'National Creditors Connection Inc.',
    'national-creditors-connection-inc',
    'Established in 1992NCCI’s services continue to deliver nationwide actionable data through our proprietary platform to create the highest return on investment for our clients. Like our clientswe care greatly about headlinereputationalcomplianceand regulatory risk. We are licensedbondedand certified. We partner with and collaborate with our clientsnever taking a one-size fits all approach',
    '["Field Services"]'::jsonb,
    'http://www.nationalcreditors.com',
    33.670202,
    -117.672101,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '56681e30-9163-4830-8a1d-b159cb620fdc',
    'TPG Alliance LLC',
    'tpg-alliance-llc',
    'TPG Alliance LLC appears in mortgage field services and inspection-related listings but does not have a verified standalone corporate website or public vendor onboarding portal under this exact legal name.',
    '["Mortgage Field Services, Property Inspections"]'::jsonb,
    'https://tpgalliance.com',
    34.87923,
    -92.572248,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '58436800-d577-4de4-b497-54805f7502c4',
    'AssetVal Management Inc.',
    'assetval-management-inc',
    '',
    '["Appraisal Services","Asset Verification","Valuation"]'::jsonb,
    'https://www.assetval.com',
    39.121712,
    -108.537153,
    false,
    30,
    450,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '58a56de6-8578-473a-bf7a-78a8527266a1',
    'Accurate Evaluation Services Inc.',
    'accurate-evaluation-services-inc',
    '',
    '["Appraisal Services","Valuation Services","Title Services"]'::jsonb,
    'https://tag.accurategroup.com',
    41.402573,
    -81.6641,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '58ad7a19-6e28-43ee-b975-a53b25b77c45',
    'Lima One Capital',
    'lima-one-capital',
    'National private lender providing financing for real estate investors, including fix-and-flip, rental, and new construction loans.',
    '["Real Estate Lending, Fix-and-Flip Financing, Rental Property Loans"]'::jsonb,
    'https://limaone.com/',
    34.849357,
    -82.39741,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '591b5b26-b8bf-472f-b904-cb0928198448',
    'Technicon Enterprises II',
    'technicon-enterprises-ii',
    'Technicon Enterprises II provides engineering services including product development, testing, validation, and regulatory support primarily for automotive and industrial clients.',
    '["Engineering Services, Product Development, Testing"]'::jsonb,
    'https://www.technicon.com/',
    40.30162,
    -75.96414,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '5935c3f1-3a65-460c-bdca-e15238542777',
    'Terracon',
    'terracon',
    'Terracon is a national consulting engineering firm providing geotechnical, environmental, construction materials testing, and facilities inspection services for public and private sector clients.',
    '["Engineering Consulting, Environmental & Construction Inspections"]'::jsonb,
    'https://www.terracon.com/',
    38.931572,
    -94.795522,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '59f466b9-524a-4eed-b429-bf7d723ae5ce',
    'ProProperty Inspection & Services',
    'proproperty-inspection-services',
    'Property inspection and field services company name appearing in regional vendor lists, but no verified official website, contractor portal, or primary corporate address could be confirmed.',
    '["Property Inspections, Field Services"]'::jsonb,
    'https://propropertyinspection.com',
    32.779356,
    -117.012701,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '5b7ffcb2-8a5e-498b-b526-7a65072c4263',
    'TrendSource',
    'trendsource',
    'TrendSource provides mystery shopping, compliance audits, and field intelligence services to retail, hospitality, and service brands, helping organizations improve customer experience and operational performance.',
    '["Mystery Shopping, Field Audits, Market Research"]'::jsonb,
    'https://www.trendsource.com/',
    32.763842,
    -117.20332,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '5c088743-9e55-42e3-8e3e-8e30fe00fd92',
    'Mortgage Connect LP',
    'mortgage-connect-lp',
    'Dedicated valuations division providing unsurpassed service, technology, and compliant virtual valuations.',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://www2.mortgageconnectlp.com/solutions/valuations/',
    40.49517,
    -80.201457,
    false,
    40,
    450,
    2.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '5f704618-11c9-486a-9c55-b56dde6a3c67',
    'GRIP Inspections',
    'grip-inspections',
    'Globe Roof Inspection Program (GRIP) is the leading provider of both roof inspections and ladder assists anywhere in the U.S. GRIP delivers an unbiased expert assessment in a standardized electronic report to you via the internet. GRIP provides this unique service through our network of dedicated roof inspectors.',
    '["Appraisal Services","Quality Control"]'::jsonb,
    'https://www.gripinspections.com',
    40.712144,
    -73.424143,
    true,
    300,
    600,
    4.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '5fdd484d-636c-4095-9a81-301f580628d8',
    'RAL Inspection Services',
    'ral-inspection-services',
    '',
    '["Construction Inspection","Property Inspection","Project Management"]'::jsonb,
    'http://www.ralis.com',
    27.87684,
    -82.640891,
    false,
    25,
    75,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '60092990-0e96-403b-9190-d9247c42d2b2',
    'CRM Global LLC',
    'crm-global-llc',
    'CRM Global makes sure your clients are who and where they say they are by providing on-site merchant inspection services. Our role is to be a part of the loss prevention process that screens potential problem merchants.',
    '["Property Inspection","Audit Services"]'::jsonb,
    'https://crmglobalinc.com/',
    35.624464,
    -78.638,
    true,
    75,
    125,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6091f45c-e49d-4892-a52e-b7d005f7b057',
    'USA Field Services',
    'usa-field-services',
    'USA Field Services provides property inspection and field reporting services for mortgage servicers, lenders, and asset managers. They operate an online portal for vendor engagement. ([usafieldservices.com](https://usafieldservices.com/?utm_source=chatgpt.com))',
    '["Mortgage Field Services, Property Inspections"]'::jsonb,
    'https://usafieldservices.com/',
    44.099169,
    -123.468389,
    true,
    15,
    40,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '615a0396-c265-4c6c-bae1-e22c6986d4e1',
    'The Real Solutions Group',
    'the-real-solutions-group',
    'The Real Solutions Group provides mortgage field services including property inspections, occupancy checks, and REO support for lenders, servicers, and asset managers.',
    '["Mortgage Field Services, Property Inspections, REO Support"]'::jsonb,
    'https://theresolutionsgrp.com/',
    33.619141,
    -117.873994,
    true,
    NULL,
    NULL,
    2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '61fa0153-cb48-401f-ae37-2310baceeb38',
    'Cartus (a division of Anywhere Real Estate, formerly Realogy)',
    'cartus-a-division-of-anywhere-real-estate-formerly-realogy',
    'Global relocation management company providing home sale programs, property condition assessments coordination, and destination services for corporate and government clients worldwide.',
    '["Global Relocation Services, Property Inspections Coordination, Workforce Mobility"]'::jsonb,
    'https://cartus.com/',
    41.382668,
    -73.532205,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '621cd384-b044-44ee-b5b1-ad310b1f13bc',
    'East Coast Property ServicesLLC',
    'east-coast-property-servicesllc',
    '',
    '["Field Services"]'::jsonb,
    'http://www.ecps-llc.com/',
    44.099169,
    -123.468389,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '624363b1-9389-4b95-9784-9db09bd4814c',
    'NorthSight',
    'northsight',
    'NorthSight provides insurance risk engineering, loss control inspections, and data-driven property risk insights for insurance carriers and brokers.',
    '["Insurance Inspections, Loss Control, Risk Engineering"]'::jsonb,
    'https://www.northsight.com',
    33.573305,
    -111.887629,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '62f407dc-07ec-461e-af5f-9e00158854cc',
    'Granite Loan Management',
    'granite-loan-management',
    'We are not your ordinary construction funds administration and risk management company. At Granite Risk Managementwe strive to exceed our client’s expectations by working hard to deliver projects on-timewithin budgetand free of mechanic’s liens. This can help you keep your construction loan portfolio on track and reduce your financial risks.

When working with Granite Risk Managementwe incorporate your program goals into our everyday operationsdelivering a seamless process for your ...',
    '["Field Services"]'::jsonb,
    'https://www.graniteriskmanagement.com',
    36.10731,
    -95.862445,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6300f9aa-a336-4674-b718-7b326c101497',
    'National Risk Services',
    'national-risk-services',
    'National Risk ServicesInc hasfor many yearsbeen providing premium audit services on workers compensationgeneral liability and auto fleet policies. We also provide property inspection services on personal lines and commercial lines policies to the insurance industry. NRS is well known for its innovationquality and expertise in the premium audit,loss controldata collection and analysis fields.',
    '["Crowdsourced Property Photos","Remote Verification","Field Services"]'::jsonb,
    'http://www.natrisk.com',
    27.87684,
    -82.640891,
    true,
    30,
    55,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '639d33f3-8b28-4182-8913-e7880c7eb86b',
    'Legacy Restoration',
    'legacy-restoration',
    'Property restoration company specializing in roofing, siding, and exterior repairs related to storm, hail, and wind damage across multiple states.',
    '["Restoration Services, Roofing, Property Damage Repair"]'::jsonb,
    'https://www.legacyrestorationllc.com/',
    45.005958,
    -93.47576,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '649e3420-fc2d-416d-aed6-ca636af50d59',
    'Cardinal Field Services',
    'cardinal-field-services',
    '',
    '["Background Verification","Fraud Prevention","Field Services"]'::jsonb,
    'https://cardinalfieldservices.us',
    33.638412,
    -112.439729,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '65b83c38-b6f6-47bf-96b5-0eecf280cfe0',
    'CS Field Services',
    'cs-field-services',
    'National mortgage field services company providing property inspections, occupancy checks, and preservation services for lenders and servicers.',
    '["Mortgage Field Services, Property Inspections, Property Preservation"]'::jsonb,
    'https://csfieldservices.com/',
    36.17372,
    -115.10647,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '65cf6f7f-fc86-48c3-a1ba-a4a2ac6da86c',
    'Sutton Inspection Bureau',
    'sutton-inspection-bureau',
    'Sutton Inspection Bureau is a venerable provider of residential and commercial property and liability surveys for the insurance industry, operating since 1932 and offering customized survey services throughout the Southeastern United States.',
    '["Property & Liability Inspections, Insurance Surveys"]'::jsonb,
    'http://www.sibfla.com/',
    27.770459,
    -82.71054,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '665c0254-6887-4c60-815f-b87f14f241a6',
    'Turner Construction Company',
    'turner-construction-company',
    'Turner Construction Company is one of the largest construction management firms in the United States, delivering complex building, infrastructure, and facilities projects across public and private sectors.',
    '["Construction Management, Infrastructure & Facilities"]'::jsonb,
    'https://www.turnerconstruction.com/',
    40.755355,
    -74.000065,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '69282c1d-ce5b-4254-854c-43f9556f0c40',
    'Wolverine Real Estate Services',
    'wolverine-real-estate-services',
    'Wolverine Real Estate Services (operating through Field Inspection Services) provides mortgage field services, property condition reports, preservation and inspection services with vendor network onboarding available.',
    '["Mortgage Field Services, Property Preservation, Inspections"]'::jsonb,
    'https://fieldinspection.com/',
    42.578774,
    -83.281622,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '697c5f34-c21f-46ea-ada7-5f77eb6b77e1',
    'Mortgage Specialists International',
    'mortgage-specialists-international',
    '',
    '["Appraisal Services","Valuation"]'::jsonb,
    'https://www.msionline.com',
    32.90905,
    -97.257878,
    false,
    40,
    85,
    2.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '69e156f4-28fc-43a9-a35b-98b2d60342e4',
    'Sb Thomas & Associates',
    'sb-thomas-associates',
    'Established in 2009, we have built a company culture that embraces innovation, new ways of doing things, and better ways to service clients. We understand the impact of how small parts of a process affect the bigger picture. We take action. We have passion and purpose for our jobs and our roles in the company.

We seek candidates across the United States close to major airport to work remotely in a home-based office with regular and frequent travel to customer sites. ',
    '["Field Services"]'::jsonb,
    'sbthomasassociates.com',
    NULL,
    NULL,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6a15d942-0f24-4ec3-a9d4-862fccac025c',
    'Twining',
    'twining',
    'Twining is an engineering consulting firm providing geotechnical, structural, and forensic engineering services, including inspections, investigations, and expert consulting for construction and insurance matters.',
    '["Engineering Consulting, Forensic & Structural Inspections"]'::jsonb,
    'https://www.twininginc.com/',
    33.815647,
    -118.14511,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6a8fbcf8-2ce7-4e6b-bb3a-821561c9e4d4',
    'ARMStrong Insurance Services',
    'armstrong-insurance-services',
    'ARMStrong Insurance Services specializes in identifying and recovering cash flow leakage for the P&C insurance industry through subrogationdeductible recoveryand premium audit services.',
    '["Field Services"]'::jsonb,
    'https://armstrong-is.com',
    40.192297,
    -85.216028,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6aaa18d2-0568-4f4e-b032-86474296ff97',
    'Vis (Valuation Inspection Services)',
    'vis-valuation-inspection-services',
    'Vital Inspection Services (VIS) is a full-service construction inspection management firm located in and serving all of California. We specialize in providing project inspection and quality control management for public and privately-owned projects. VIS provides construction oversight servicesenforces project specificationsgoverning codesand maintains accessibility standards for:

  * Schools K-12 (DSA)

  * Community Colleges

  * California State Universities

  * Hospitals (HCAI)',
    '["Audit Services"]'::jsonb,
    'https://www.vinspection.net/',
    34.03666,
    -118.44346,
    true,
    20,
    100,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6d08cac5-d1f1-42e2-84f9-bb4c144679b1',
    'Brookfield Global Relocation Services',
    'brookfield-global-relocation-services',
    'Global relocation management company providing workforce mobility services, including home sale programs, inspection coordination, and destination services for corporate clients.',
    '["Global Relocation Services, Property Inspections, Workforce Mobility"]'::jsonb,
    'https://www.brookfieldgrs.com/',
    42.329032,
    -83.039756,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6d8a0fbd-9157-40ff-bfc9-a3fb7ee95837',
    '2 Guys Termite Inc.',
    '2-guys-termite-inc',
    '2 Guys Termite Inc. is a pest control service specializing in termite controloffering guaranteed services with expertise in insect biology and effective treatment methods.',
    '["Field Services"]'::jsonb,
    'http://2guystermite.com/',
    34.21318,
    -118.36375,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6e6e461c-dd4a-4c72-a2da-c869db7a6722',
    'NOFS Inc.',
    'nofs-inc',
    'NOFS Inc. provides nationwide mortgage field services including property inspections, preservation, maintenance, and REO support for lenders and servicers.',
    '["Mortgage Field Services, Property Preservation, Inspections"]'::jsonb,
    'https://nofsinc.com/',
    41.404283,
    -81.929162,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '6ff7d098-1c88-4cdd-abc0-9f55cc3ef650',
    'Sedgwick',
    'sedgwick',
    'Global provider of technology-enabled risk, benefits, and integrated business solutions including claims management.',
    '["Property Inspection","Field Services"]'::jsonb,
    'http://www.sedgwick.com',
    35.058098,
    -89.790569,
    false,
    NULL,
    NULL,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '709385ce-fd48-4375-8233-6bc0c1b5ef33',
    'Shore Field Inspections',
    'shore-field-inspections',
    'Shore Field Inspections provides residential and property inspection services including structural, weather-related, and condition reporting for real estate and insurance clients.',
    '["Property Inspections, Field Reporting"]'::jsonb,
    'shorepropertyinspections.com',
    39.090612,
    -75.85887,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '70d80bce-4817-47f9-a8db-b3fb717e503a',
    'Compliability Solutions LLC',
    'compliability-solutions-llc',
    '',
    '["Property Inspection","Audit Services","Field Services"]'::jsonb,
    'https://compliabilitysolutions.com',
    44.099169,
    -123.468389,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '718adea1-6a8a-4bcc-9439-e4e23ace6215',
    'Congruex',
    'congruex',
    'National provider of end-to-end telecommunications infrastructure services supporting fiber, wireless, and broadband deployments across the U.S.',
    '["Telecommunications Construction, Field Services, Infrastructure Deployment"]'::jsonb,
    'https://www.congruex.com/',
    40.025783,
    -105.2234,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '749f0689-d104-46f1-ac31-ced06756f062',
    'Desert View Inspection',
    'desert-view-inspection',
    'Regional inspection business name appears in limited listings, but no verified official website or primary corporate address could be confirmed.',
    '["Property Inspections"]'::jsonb,
    'http://www.desertviewservices.com/',
    32.89055,
    -111.753991,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '75d37278-e1a3-474a-ae1b-3cc421e38cdd',
    'SDMyers',
    'sdmyers',
    '',
    '["Field Services"]'::jsonb,
    'https://sdmyers.com',
    41.096298,
    -81.442783,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7627ca5b-103c-4956-8a31-eec813b93da3',
    'Sport Management Group Inc.',
    'sport-management-group-inc',
    'Sport Management Group Inc. provides general liability and related inspections, performing services for health clubs and similar facilities nationwide according to industry directory listings.',
    '["Insurance Inspections, Liability Inspections"]'::jsonb,
    'http://www.smg-usa.com',
    35.89952,
    -78.596699,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7663304a-19d6-42c7-8064-8d5fa2c18a4e',
    'Better Talent',
    'better-talent',
    'Specialized recruiting and staffing firm serving the vacation rental, property management, and hospitality industries with full-cycle hiring support.',
    '["Hospitality Recruiting, Property Management Staffing, Vacation Rental Hiring"]'::jsonb,
    'https://bettertalent.com/',
    30.334403,
    -97.683162,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7729ce81-ddea-4352-b0ca-eac8ed35f46c',
    'Datacomp Appraisal Systems',
    'datacomp-appraisal-systems',
    'Datacomp is the nation’s largestindependent provider of manufactured and mobile home valuationsinspections and market data. We make your decision process safersimpler and more cost-effective by ensuring you receive the most timelyaccurate information available. All of the experience and knowledge Datacomp has compiled during its 30 years in the business is put toward being a reliable source of insight and stability for you.',
    '["Property Inspection","Appraisal Services","Verification"]'::jsonb,
    'https://www.datacompusa.com',
    43.042291,
    -85.604698,
    true,
    45,
    85,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '776decac-54f3-47f1-a0b7-3504c92c68fb',
    'PCV Murcor',
    'pcv-murcor',
    'As one of the nation’s leading valuation management companies for residential and commercial valuationswe focus on an approach that benefits clients and their borrowers.',
    '["Construction Monitoring","Appraisal Services","Project Management"]'::jsonb,
    'https://www.pcvmurcor.com/',
    34.062478,
    -117.800765,
    true,
    30,
    75,
    2.9
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7a4c35ff-4dce-484d-b606-6a3dd29b084d',
    'Allegheny Inspections',
    'allegheny-inspections',
    'Insurance Underwriting Inspections, Self-Inspections, and Loss Control services for commercial and personal lines.',
    '["Property Inspection"]'::jsonb,
    'https://www.ainspections.com/',
    40.665487,
    -80.1002,
    false,
    25,
    60,
    4.9
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7c3b367f-c85f-452c-9ec4-b50516f2995f',
    'UPFRO',
    'upfro',
    'UPFRO is a property data and inspection platform that connects real estate and insurance companies with on-demand field data collectors to capture photos, measurements, and condition information.',
    '["Property Data Collection, Inspections, PropTech"]'::jsonb,
    'https://www.upfro.com/',
    40.044901,
    -74.08407,
    true,
    20,
    40,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7c86a2e0-5ae8-4b55-9903-7478984b69b8',
    'Givemethevin.Com',
    'givemethevincom',
    'Online vehicle purchasing platform offering fast, no-hassle cash offers for cars.',
    '["Field Services"]'::jsonb,
    'https://givemethevin.com',
    32.776879,
    -97.282344,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7e98a76d-4cc6-4f6a-805a-d051eb5a095c',
    'LeaseInspection.com',
    'leaseinspectioncom',
    'Collateral Specialists Inc. has over 25 years experience providing banksfinancial companiesmanufacturers and other captive groups the inspection and reporting expertise required to verify their collateral.',
    '["Field Services"]'::jsonb,
    'http://www.leaseinspection.com',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7ed83087-564b-481f-a8ea-bf0afc30914e',
    'DRW LLC',
    'drw-llc',
    'Construction and support services firm providing project assistance and field operations support services.',
    '["Construction Support Services, Field Services"]'::jsonb,
    'https://drwllc.com/',
    45.500263,
    -122.67964,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7efc9b49-8692-427c-bdf3-f3f3041b903b',
    'Asteroom Inc.',
    'asteroom-inc',
    '3D tour and floor plan solution provider for real estate listings and appraisals.',
    '["Appraisal Services","Virtual Tours","3D Imaging"]'::jsonb,
    'https://www.asteroom.com/en',
    37.483685,
    -121.944891,
    false,
    40,
    150,
    3.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7f306b14-f901-41eb-a8d4-33cdfaddb89c',
    'American First AMC',
    'american-first-amc',
    '',
    '["Appraisal Services","Audit Services"]'::jsonb,
    'https://www.americanfirstamc.com/',
    33.583657,
    -111.92648,
    false,
    NULL,
    NULL,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '7f91193c-9115-49a4-a3e3-c78c79d36385',
    'One Guard Inspections (Automotive Inspector)',
    'one-guard-inspections-automotive-inspector',
    'Vehicle inspection leader providing pre-purchase inspections for autos, trucks, RVs, and classic cars.',
    '["Field Services"]'::jsonb,
    'https://oneguardinspections.com',
    33.671236,
    -112.100736,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '80a63759-fa0c-4508-9bf5-a1124d0f2694',
    'Snapdocs',
    'snapdocs',
    'Snapdocs is the mortgage industry''s digital closing platform offering eClosing, Notary Connect, Quality Control, and eVault services, connecting notaries, title companies, lenders, and settlement teams.}',
    '["Mortgage Technology, eClosing, Notary Network"]'::jsonb,
    'https://www.snapdocs.com/',
    37.790311,
    -122.40212,
    true,
    75,
    200,
    3.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '81dc5a7b-377e-4b83-8050-460a7d3363c4',
    'Continental Risk Management',
    'continental-risk-management',
    'Continental Risk Improvement provides Risk Management services to Insurance Underwriters of Personal and Commercial accounts.
',
    '["Insurance Adjusting","Claims Management","Field Services"]'::jsonb,
    'http://new.continentalrisk.com/WhatWeDo2.asp',
    40.340984,
    -74.202427,
    true,
    75,
    125,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8278e5e9-1a80-4084-90af-cbf5fdd3d28c',
    'US Insurance Audit',
    'us-insurance-audit',
    'US Insurance Audit provides premium audit services, risk inspection, and loss control consulting for the insurance industry, serving carriers and risk managers in commercial and personal lines. ([usinsuranceaudit.com](https://usinsuranceaudit.com/?utm_source=chatgpt.com))',
    '["Insurance Audit & Inspection Services"]'::jsonb,
    'https://usinsuranceaudit.com/',
    39.897479,
    -85.994807,
    true,
    NULL,
    NULL,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '829e94e4-3795-4da7-83cd-3b0abd23df85',
    'National Inspection Services',
    'national-inspection-services',
    'National Inspection Services provides insurance underwriting inspections, loss control surveys, and risk assessment services for personal and commercial lines carriers.',
    '["Insurance Inspections, Loss Control, Risk Assessment"]'::jsonb,
    'http://www.nationalis.com',
    36.837798,
    -119.771081,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '84268ac6-3c1c-4327-8008-1b85292e5131',
    'Appraisal Scope',
    'appraisal-scope',
    'AMCs of all sizes love Appraisal Scope’s intuitive interfacerobust integrations libraryreal-time status updates and exclusive report builder',
    '["Appraisal Services"]'::jsonb,
    'https://class.appraisalscope.com',
    42.559091,
    -83.115077,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '842ad485-5c16-4944-b900-dd7a0aab2da1',
    'Sand Castle Field Services',
    'sand-castle-field-services',
    'Sand Castle Field Services provides national mortgage field services including property inspections, occupancy checks, and preservation support for lenders and servicers.',
    '["Mortgage Field Services, Property Inspections, REO Services"]'::jsonb,
    'http://www.sandcastlefs.com',
    43.03134,
    -88.136396,
    true,
    14,
    22,
    2.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8457ff41-f7dd-478f-bde3-02ae64d84458',
    'VTM Field Services',
    'vtm-field-services',
    'VTM Field Services provides mortgage field services including property inspections, occupancy checks, and related due diligence work for lenders and servicers.',
    '["Mortgage Field Services, Property Inspections, Preservation"]'::jsonb,
    'https://vtmfieldservice.com/',
    36.303793,
    -119.375646,
    true,
    30,
    55,
    3.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '84659f1c-be2e-406d-aea9-271e5335b3ac',
    'NWM Risk Management',
    'nwm-risk-management',
    '',
    '["Insurance Inspection","Appraisal Services","Risk Assessment"]'::jsonb,
    'https://nwmriskmanagement.com/',
    45.426791,
    -122.748721,
    false,
    NULL,
    NULL,
    3.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '84aa3832-d147-44f7-ac94-acec5e9589a9',
    'M & M Mortgage ServicesInc. acquired by mcs360',
    'm-m-mortgage-servicesinc-acquired-by-mcs360',
    'Our ownership believes in putting clients first.
The culture of M&M is a culture of fresh thinkingperspectiveinsight and a whole lot of hustle.
Experience the difference with M&M MORTGAGE. We turn your dream home into reality.
M&M MORTGAGE educates each client to create a partnership with a healthy foundation for a lifetime of service.',
    '["Field Services"]'::jsonb,
    'https://mcs360.com/join-our-team/',
    25.647565,
    -80.406812,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '85aec7f5-1bed-418e-b902-aac1f4b7c5ab',
    'ECS Ltd (Engineering Consulting Services)',
    'ecs-ltd-engineering-consulting-services',
    'National engineering consulting firm providing construction materials testing, geotechnical engineering, and building inspection services.',
    '["Engineering Consulting, Construction Inspections, Materials Testing"]'::jsonb,
    'https://www.ecslimited.com/',
    38.899841,
    -77.433742,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '85c4271d-1a54-484d-949a-b7dca2dd55ae',
    'Accelerated Inspection Services',
    'accelerated-inspection-services',
    '',
    '["Property Inspection"]'::jsonb,
    'http://www.acceleratedinspections.com',
    40.237645,
    -74.226397,
    false,
    25,
    50,
    2.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8628bbe8-6399-461a-9cd3-d32eb23c0df3',
    'Clear Capital',
    'clear-capital',
    'Pioneering real estate valuation, analytics, and platform technology solutions including appraisals and property data.',
    '["Insurance Inspection","Appraisal Services"]'::jsonb,
    'https://www.clearcapital.com',
    39.527264,
    -119.808789,
    false,
    25,
    450,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '86de5166-c746-4c87-894e-c9f3afa731f9',
    'Solidifi',
    'solidifi',
    'Solidifi operates a mortgage services marketplace connecting lenders with independent appraisers, notaries, and valuation professionals, offering title, settlement, and appraisal services.',
    '["Mortgage Services, Valuation & Title Services"]'::jsonb,
    'https://solidifi.com/',
    42.875671,
    -78.851817,
    true,
    75,
    200,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '876e0ec4-da80-4af3-b34b-399ddaee7dfc',
    'Metro Inspections',
    'metro-inspections',
    'Since 1990Metro Inspections has remained focused on developing the most effective and efficient on-site verification services in the payments industry. We provide customized physical on-site inspectionsphotographic evidence and comprehensive reports that help our clients make better informed underwriting decisions. Metro Inspections embraces three key philosophies:

  1. Each member of our team is fully trained and knowledgeable on our client’s business; this includes knowing client-speci...',
    '["Property Inspection","Field Services","Verification"]'::jsonb,
    'http://www.metrositeinspections.com',
    33.531753,
    -112.177935,
    true,
    20,
    40,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '877e9d8f-f7f5-4ff1-9715-e380a09dc21b',
    'Crown Field Services LLC',
    'crown-field-services-llc',
    '',
    '["Property Preservation","Field Services"]'::jsonb,
    'https://crownfieldservices.net/',
    40.699638,
    -73.940271,
    false,
    15,
    75,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '889c4d2b-c820-4def-bc69-aad00e7fe6c1',
    'FGI Services',
    'fgi-services',
    '',
    '["Field Services"]'::jsonb,
    'https://fgiservices.com',
    42.28947,
    -87.957724,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '88bc9edb-a5e6-41c6-9d10-fec11e2c9fd9',
    'Photoinspections.com',
    'photoinspectionscom',
    '',
    '["Insurance Inspection","Property Inspection","Claims Verification"]'::jsonb,
    'http://www.photoinspection.com',
    37.696218,
    -121.74233,
    false,
    15,
    40,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '88dd1b4f-09ac-4bbd-ab68-e17ae27574ed',
    'US Best Repair Service',
    'us-best-repair-service',
    'US Best Repair Service appears as a regional or local property repair service name. No verified national corporate website, vendor portal, or primary headquarters could be confirmed under this exact name.',
    '["Property Restoration & Repair Services"]'::jsonb,
    '',
    33.690426,
    -117.84644,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '89c752d0-20ea-413a-990f-1edd692233cd',
    'OPENLANE',
    'openlane',
    '',
    '["Engineering Inspection","Appraisal Services","Risk Assessment"]'::jsonb,
    'https://www.openlane.com',
    39.950662,
    -86.15882,
    false,
    20,
    60,
    3.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '89ea35dc-1ef9-44b8-9c27-b61127dfbdad',
    'Reotrans (via Equator)',
    'reotrans-via-equator',
    'Equator operates the Reotrans inspection workflow as part of its mortgage field services and vendor management platform used by servicers and lenders to dispatch inspections and preservation work. Equator''s vendor portal supports nationwide field service engagements. ',
    '["Mortgage Field Services Platform, Vendor Management"]'::jsonb,
    'https://www.equator.com/',
    34.058699,
    -84.290254,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8a61ef19-734e-4c52-b99c-71f77463de16',
    'Checkmate Inspections',
    'checkmate-inspections',
    'Checkmate Inspections provides professional collateral verificationfield inspectionsand auditing services to financial institutions and lenders in a variety of industries. Experienced in due diligence services since 1992we provide our valued customers with accurate and timely reporting safeguarding your collateral while delivering exceptional value.',
    '["Home Warranty Inspection","Property Inspection"]'::jsonb,
    'https://www.checkmateinspections.com',
    36.204737,
    -81.624187,
    true,
    NULL,
    NULL,
    4.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8a664249-adff-4590-bb8a-e1b3dd01bd72',
    'Radata',
    'radata',
    'RAdata is your best choice when it comes to radon and water testing & treatment for your home or your real estate transaction. We always strive to provide the lowest prices and fastest turnaround times.

We are committed to protect and enhance your home’s environmental health and safety!',
    '["Property Inspection","Remote Verification","Digital Closing"]'::jsonb,
    'http://www.radata.com',
    40.834876,
    -74.689884,
    true,
    25,
    75,
    2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8ac1e054-3e71-4519-92e5-3e3a3d66ccb4',
    'MTI Inspection Services',
    'mti-inspection-services',
    'MTI is one of the largest cargo claim inspection agencies in North Americaserving LTL and truckload carriersairlines and freight forwarders from offices in every major metropolitan area in all 50 states and Canada.At heartMTI is an organization of professional claim investigators who are dedicated to assisting transportation companies and the shipping public in reducing their cargo claim costs.Our experience enables us to produce inspection reports which are unsurpassed for accuracyth...',
    '["Field Services"]'::jsonb,
    'http://www.mti-inspections.com',
    41.97424,
    -88.12938,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8b597d36-8bce-48b7-b5b7-e8bed4691eb7',
    'Guardian Appraiser',
    'guardian-appraiser',
    '',
    '["Property Inspection","Field Services","Verification"]'::jsonb,
    'https://www.guardianmortgageonline.com',
    40.776557,
    -73.466009,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8b88cdba-f7a5-4ce1-96d9-34cbbdaa85f9',
    'Cal Inspection Bureau',
    'cal-inspection-bureau',
    '',
    '["Insurance Inspection","Property Inspection","Risk Assessment"]'::jsonb,
    'https://calinspect.com/',
    34.156207,
    -118.642979,
    false,
    30,
    50,
    4.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8c3ae1a2-4519-419a-90c8-deb65dc4d5f4',
    'Manhattan Strategy Group',
    'manhattan-strategy-group',
    'Management consulting firm providing strategy, program evaluation, research, and communications services primarily for federal, state, and local government agencies.',
    '["Management Consulting, Government Services, Program Evaluation"]'::jsonb,
    'https://www.manhattanstrategy.com/',
    38.895868,
    -77.021696,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8c63e72a-fb7a-4002-a81f-ab6d2c1aa14b',
    'Sentinel Underwriting Review',
    'sentinel-underwriting-review',
    'Sentinel Underwriting Review is the leading provider of Real-TimeOn-Demand Risk Intelligence for decision support and ITV serving the InsuranceReal EstateMortgageand Banking Industries.',
    '["Insurance Inspection","Property Inspection","Risk Assessment","Field Services"]'::jsonb,
    'https://www.sentinelunderwriting.com/',
    35.173746,
    -106.591441,
    true,
    30,
    55,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8d3644ef-be9c-4db7-bb2d-190ddb2c03f4',
    'Atlantic & Pacific Build Group',
    'atlantic-pacific-build-group',
    'Construction and development services across all phases, from land acquisition to risk management and quality control. Part of a vertically integrated real estate and property management organization.',
    '["Construction, General Contracting"]'::jsonb,
    'https://atlanticpacificbuildgroup.com/',
    33.687528,
    -117.857825,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8e7244ef-ed28-4b14-b74d-ef20242b9c5b',
    'New Day Recovery',
    'new-day-recovery',
    'On Demand Occupational Medicine is expanding our services regionally to provide on-site drug and alcohol testing for post-accident, reasonable suspicion, and emergency collections. We are seeking professional, detail-oriented independent contractors to join our After-Hours Mobile Collection Network.



Collectors will be dispatched between 5:00 PM and 8:00 AM to perform on-site drug and alcohol test collections for clients in their local area. This role is ideal for dependable individuals such as rideshare or delivery drivers looking for flexible, supplemental income while performing meaningful, compliance-driven work.



Collectors will receive free training and certification in DOT and non-DOT collections and must strictly adhere to all regulatory requirements while representing On Demand with professionalism and integrity.',
    '["Field Services"]'::jsonb,
    'https://newday-recovery.com',
    NULL,
    NULL,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8fb22941-c826-44d7-8b89-ce06451bdf83',
    'Transmercial',
    'transmercial',
    'Transmercial is a commercial real estate brokerage and advisory firm specializing in leasing, tenant representation, and commercial property transactions across multiple U.S. markets.',
    '["Commercial Real Estate Brokerage & Advisory"]'::jsonb,
    'http://transmercial.com',
    39.117361,
    -76.969286,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '8ffd6c16-31f5-4f53-b245-8016e7ca8b90',
    'AmeriSpec Chicago - Xperience Home Inspections',
    'amerispec-chicago-xperience-home-inspections',
    'AmeriSpec Chicago provides comprehensive home inspection services including residential and commercial inspectionsradon testingand sewer inspections.',
    '["Field Services"]'::jsonb,
    'https://www.amerispecchicago.com',
    41.413109,
    -87.805755,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9096884c-e8da-4b29-88f0-cc01d1e72630',
    'Red Oak Field Services',
    'red-oak-field-services',
    '',
    '["Asset Verification","Field Services"]'::jsonb,
    'http://www.redoakfs.com',
    47.691736,
    -116.654109,
    false,
    25,
    45,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '90c607f7-34fc-40b5-bc0c-f8074eb08a33',
    'National Insurance Advocates',
    'national-insurance-advocates',
    '',
    '["Field Services"]'::jsonb,
    '',
    26.187144,
    -80.193448,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '944608e1-e429-4ab6-ae9e-dbd63d74a12e',
    'Wolverine Inspections',
    'wolverine-inspections',
    'Wolverine Inspections provides cargo surveys, pre-shipment inspections, factory audits, business verification services and other inspection work.',
    '["Inspection Services, Cargo & Pre-Shipment Surveys"]'::jsonb,
    'https://wolverineinspections.com/',
    42.578774,
    -83.281622,
    true,
    30,
    50,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '947b350f-b87b-4780-9fcf-6e85ddd0b567',
    'Adaptive Property Solutions',
    'adaptive-property-solutions',
    '',
    '["Property Inspection","Appraisal Services","Damage Assessment"]'::jsonb,
    'http://www.adaptivepropertysolutions.com',
    38.795842,
    -77.609092,
    false,
    25,
    75,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '94dba10a-ce3c-4169-b158-679025ad09f5',
    'Agent Validate',
    'agent-validate',
    '',
    '["Identity Verification","Property Inspection","Fraud Prevention"]'::jsonb,
    'https://agentvalidate.com/',
    30.237991,
    -81.625052,
    false,
    25,
    75,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '95280f90-9d0c-42fe-9069-663366264a94',
    'CBRE',
    'cbre',
    'Global commercial real estate services and investment firm providing facilities management, property condition assessments, valuation, and project management services.',
    '["Commercial Real Estate, Facilities Management, Property Inspections"]'::jsonb,
    'https://www.cbre.com/',
    32.791641,
    -96.80255,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '95d74519-fca3-4d65-9cb4-7d62aafb2e35',
    'Bismark Mortgage',
    'bismark-mortgage',
    'Independent mortgage lender offering residential home loan products including conventional, FHA, VA, and refinancing services.',
    '["Mortgage Lending, Home Loans"]'::jsonb,
    'https://bismarkmortgage.com/',
    29.769745,
    -98.720078,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '97ef2052-d898-4224-ba82-c4447f5dbb3b',
    'SCR Group Services',
    'scr-group-services',
    'SCR Group Services provides environmental consulting, engineering support, and field inspection services including Phase I/II ESAs and soil contamination assessments.',
    '["Environmental & Engineering Consulting, Field Inspections"]'::jsonb,
    'https://www.scrgroupservices.com/',
    40.095761,
    -75.407765,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9a9fdc24-3e08-49fd-8cd4-77a46013d638',
    'DISTINGUISHED MORTGAGE SERVICES LLC.',
    'distinguished-mortgage-services-llc',
    'With over 50 years of field service and mortgage related experienceDistinguished Mortgage Services knows what clients are looking for and delivers the services they require.',
    '["Field Services"]'::jsonb,
    'https://www.distinguishedms.com',
    33.624945,
    -111.889545,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9c56dd85-ee74-4d82-aeb5-b013ed8ea68f',
    'The Birdsey Group',
    'the-birdsey-group',
    'The Birdsey Group is a construction management and consulting firm providing inspection, project management, and advisory services for public and private construction projects.',
    '["Construction Management, Consulting & Inspection Services"]'::jsonb,
    'https://birdseyconstruction.com/',
    33.851137,
    -84.379489,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9c817bed-f573-427f-9d98-057fadb3c4b2',
    'vmysmartpros',
    'vmysmartpros',
    'mySmartPros operates a field service and technician job board/platform where businesses can post and hire for entry-level and field technician positions including construction and assembly tasks, suggesting an ecosystem that supports inspector-type roles.}',
    '["Field Services, Home Inspections, Field Technician Opportunities"]'::jsonb,
    'https://www.mysmartpros.com/',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9d1a48e5-0045-4710-9835-b8407790e075',
    'Accelerated Appraisal Group',
    'accelerated-appraisal-group',
    '',
    '["Appraisal Services"]'::jsonb,
    'https://www.aag-amc.com',
    40.076006,
    -75.413633,
    false,
    85,
    250,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9d305f43-f3cb-4e0d-91a7-2c3c1d70edae',
    'ProTeck',
    'proteck',
    '',
    '["Field Services"]'::jsonb,
    'https://proteckservices.com',
    42.387025,
    -71.199413,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9e5d14c0-089d-422f-b8db-af41d75f6e0a',
    'Pacific Inspections Inc.',
    'pacific-inspections-inc',
    'Pacific Inspections Inc. provides insurance underwriting inspections, loss control surveys, and property inspections for residential and commercial insurance carriers.',
    '["Insurance Inspections, Loss Control, Property Inspections"]'::jsonb,
    'https://pacificinspectionsinc.com/',
    38.57846,
    -121.489972,
    true,
    15,
    30,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9ec4cc62-33f6-4dbf-8ee8-c73039e880fd',
    'K&A Engineering',
    'ka-engineering',
    '',
    '["Field Services"]'::jsonb,
    'https://kapower.us',
    41.03487,
    -73.764762,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9ed09d78-084c-4dd2-af3f-257d80584904',
    'Bureau Veritas – Building Assessments & Project Management',
    'bureau-veritas-building-assessments-project-management',
    'Global testing, inspection, and certification organization offering building condition assessments, reserve studies, and project management services across commercial real estate portfolios.',
    '["Building Assessments, Project Management, Compliance Inspections"]'::jsonb,
    'https://www.bvna.com/',
    26.144055,
    -80.340418,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    '9f6968b8-7264-46de-b171-27139ad6331a',
    'Douglas Guardian',
    'douglas-guardian',
    '',
    '["Property Inspection"]'::jsonb,
    'http://www.douglasguardian.com',
    29.782973,
    -95.609743,
    false,
    50,
    175,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a0f475dc-b5de-4159-a059-22dc5bf51dbd',
    'NVMS',
    'nvms',
    'Company name appears in mortgage field services and vendor management contexts, but no verified official website, contractor portal, or primary corporate address could be confirmed under this exact acronym.',
    '["Mortgage Field Services"]'::jsonb,
    'http://www.nvms.com',
    38.797374,
    -77.532834,
    true,
    50,
    100,
    2.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a1200579-586e-43d9-97c3-4956702a63f5',
    'Fidelity Inspection and Consulting Services',
    'fidelity-inspection-and-consulting-services',
    'FICS is a leading inspection management company specializing in relocation.',
    '["Field Services"]'::jsonb,
    'https://www.frsonline.com/expertise/inspections',
    38.674126,
    -90.376147,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a19caf1c-a842-405c-b871-bdf93f91dcae',
    'Certified Group',
    'certified-group',
    'Network of laboratories providing testing, regulatory consulting, and certification for food, cosmetics, and supplements.',
    '["Property Inspection","Appraisal Services"]'::jsonb,
    'https://www.certifiedgroup.com/',
    40.759737,
    -73.413412,
    false,
    NULL,
    NULL,
    2.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a2f140c3-66c3-43fc-a356-01f642135136',
    'Pilot Catastrophe Services',
    'pilot-catastrophe-services',
    'Leading provider of catastrophe adjusting and claims processing services for the insurance industry.',
    '["Remote Inspection","Field Services"]'::jsonb,
    'https://www.pilotcat.com/',
    30.668048,
    -88.190206,
    false,
    15,
    40,
    3.9
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a3144142-1341-44d2-ada4-14fc2ac2b4cb',
    'Colonial Claims Corporation',
    'colonial-claims-corporation',
    'Now celebrating our 40th year in businessColonial Claims leads the industry in providing comprehensive adjusting solutions as one of the largest Independent Adjusting companies in the United States. Our seasoned team of expert adjusters has handled over $50 billion in damages from single and multiple assignments to catastrophe responses. Colonial Claims services all types of property and liability claims nationwideincluding WindFireHailFloodTornadoand Earthquake for Residential ...',
    '["Insurance Inspection","Damage Assessment","Insurance Claims"]'::jsonb,
    'https://www.colonialclaims.com',
    32.731533,
    -117.161137,
    true,
    NULL,
    NULL,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a3cf3edb-2c31-42e0-ab34-ad48bb712019',
    'Pro Asset Services LLC',
    'pro-asset-services-llc',
    '',
    '["Property Preservation","Appraisal Services","Field Services"]'::jsonb,
    'https://proasset-llc.com/',
    44.099169,
    -123.468389,
    false,
    20,
    40,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a479456b-6422-4999-80ab-26c9d4b41efe',
    'Propm Inc',
    'propm-inc',
    '',
    '["Property Inspection","Digital Services"]'::jsonb,
    'https://www.propmhomes.com/',
    45.390945,
    -122.644684,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a5199c15-f573-47eb-bfc5-6277f8d70c6b',
    'JGM Property Group',
    'jgm-property-group',
    '',
    '["Property Inspection","Appraisal Services","Valuation"]'::jsonb,
    'https://jgmpropertygroup.com',
    42.698604,
    -83.037535,
    false,
    30,
    55,
    3.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a53ab0a8-c782-4296-84ec-81feadf58d9b',
    'NMFS',
    'nmfs',
    '',
    '["Property Inspection","Appraisal Services","Field Services"]'::jsonb,
    'https://nmfs.com',
    33.351238,
    -96.664632,
    false,
    10,
    50,
    2.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a5455c84-ca4a-4914-9a07-28cc66b1d03b',
    'United Field Chase',
    'united-field-chase',
    'United Field Chase provides mortgage field services including property inspections, occupancy checks, and field reporting for lenders, servicers, and asset managers.',
    '["Mortgage Field Services, Property Inspections"]'::jsonb,
    'https://www.unitedfieldchase.com/',
    26.352765,
    -80.115106,
    true,
    30,
    500,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a5636a33-13b0-43f9-a4e5-ebc295d11cac',
    'eMortgageLogic',
    'emortgagelogic',
    'Mortgage services and valuation management company supporting lenders and servicers with inspection, valuation, and compliance workflows.',
    '["Mortgage Valuation, Field Services Management, Compliance"]'::jsonb,
    'http://www.emortgagelogic.com/',
    32.692016,
    -97.448364,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a5a4410a-d8cc-44b6-a40b-58035c07b2bd',
    'HCP Property Inspection',
    'hcp-property-inspection',
    'HCP Property Inspection provides home and property inspection services including pre-listing, warranty, pool, and construction phase inspections, with a customer-focused approach.',
    '["Home Inspection, Property Inspection Services"]'::jsonb,
    'https://hcphomeinspection.com/',
    33.619951,
    -112.445846,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a5aa8dc8-ab9d-4f8b-82a6-88c8493e4273',
    'Certified Mold Inspectors & Contractors Institute',
    'certified-mold-inspectors-contractors-institute',
    'Mold Authority is the leader in all of your indoor air quality testing needs! We ensure you to breathe easier! Mold Authority understands the serious nature of environmental issues. Whether you’re a homeowner that’s buying or selling a propertya property managercontractor or realtor we know how to handle your problem efficiently and cost effectively. Mold Authority’s owners and employees have been servicing mold issues for over 18 years. Our staff is professionally trained and up to date ...',
    '["Field Services"]'::jsonb,
    'http://www.certifiedmoldinspectors.com',
    28.381371,
    -82.677762,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a61ebad7-2e5e-4432-a8d5-cab873e1c227',
    'Datarep Associates',
    'datarep-associates',
    '',
    '["Insurance Inspection","Insurance Claims","Risk Assessment"]'::jsonb,
    'http://www.datarepassociates.com',
    42.539428,
    -71.246363,
    false,
    15,
    60,
    3.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a6b62850-ebc1-46bd-a3ee-6b776ca28151',
    'National Safety & Risk',
    'national-safety-risk',
    '',
    '["Property Management Platform","Risk Assessment","Field Services"]'::jsonb,
    'http://www.natsr.com',
    41.3607,
    -81.592642,
    false,
    15,
    30,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a871e7a9-dd0d-43f9-bd11-3bce6262bbf2',
    'Breckenridge Cabin Company',
    'breckenridge-cabin-company',
    '',
    '["Field Services"]'::jsonb,
    'https://breckcabinco.com',
    39.475323,
    -106.022472,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a8a9001c-72ff-452d-ba2b-926b8095c06b',
    'Wrench',
    'wrench',
    'Wrench provides mobile auto repair services, dispatching certified mechanics to customers'' locations for diagnostics, maintenance, and repair work — and posts mechanic job opportunities via its careers page.',
    '["Mobile Auto Repair & Field Services"]'::jsonb,
    'https://wrench.com/',
    47.604527,
    -122.330615,
    true,
    NULL,
    NULL,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'a9276e97-684d-4c45-a188-33365b92a5ef',
    'Afirm formerly us-reports',
    'afirm-formerly-us-reports',
    'Afirm Solutions provides Premium Audit and Loss Control services. The company has rebranded to Davies.',
    '["Field Services"]'::jsonb,
    'https://afirmsolutions.com',
    40.518057,
    -105.011554,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'aa25d37c-8b25-4abf-ae06-cff50a3fc4d5',
    'Equity Solutions USA',
    'equity-solutions-usa',
    '',
    '["Financial Verification","Appraisal Services","Audit Services"]'::jsonb,
    'https://www.esusa.net/',
    42.545951,
    -83.361627,
    false,
    300,
    1004.00,
    3.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'aa722d1a-dc80-404c-9423-96df9b0abcab',
    'UTS of Massachusetts Inc.',
    'uts-of-massachusetts-inc',
    'Universal Testing Services of Massachusetts is a full-service testing and inspection agency specializing in construction materials testing, geotechnical observations, and quality control services for construction projects.}',
    '["Construction Testing & Inspections, Materials Evaluation"]'::jsonb,
    'https://utsofmass.com/',
    42.490612,
    -71.101005,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'aba96ebe-2a56-43c4-93ac-15fbdb2343ff',
    'Vision Realty & Management',
    'vision-realty-management',
    '',
    '["Field Services"]'::jsonb,
    'https://visionwestgeorgia.com',
    33.580632,
    -85.075531,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ac3c51ea-cc9a-421c-9e9f-30bee8340073',
    'Birdseye Construction',
    'birdseye-construction',
    'Commercial construction and general contracting firm specializing in design-build, tenant improvements, and large-scale construction projects.',
    '["General Contracting, Commercial Construction"]'::jsonb,
    'https://birdseyeconstruction.com/',
    32.978757,
    -97.269008,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ad3f8a4b-47e0-43e9-ba26-cf0b3cb1665c',
    'Maiden & Associates Architects / Engineers / Planners',
    'maiden-associates-architects-engineers-planners',
    'Full-service architecture, engineering, and planning firm providing design, inspection, and consulting services for public and private sector projects.',
    '["Architecture, Engineering, Planning, Construction Inspection"]'::jsonb,
    'https://www.maep.com/',
    38.95424,
    -77.082717,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'aebcbf58-c532-475d-a23e-7b8707844862',
    'Field Pros Direct',
    'field-pros-direct',
    '',
    '["Business Process Management","Property Services","Field Services"]'::jsonb,
    'https://www.fieldprosdirect.com',
    28.069949,
    -82.366651,
    false,
    NULL,
    NULL,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'aec61070-ba17-487f-9c1c-6dbe34d912f1',
    'ZVN Properties',
    'zvn-properties',
    'ZVN Properties offers property management, real estate services and investment solutions — with a public site but no verified vendor/inspection specific portal at this time.',
    '["Real Estate Services, Property Management"]'::jsonb,
    'https://www.zvnproperties.com/',
    41.456406,
    -81.493086,
    true,
    500,
    NULL,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'af131975-a272-4a74-bcf1-2bf367955d11',
    'National SFS',
    'national-sfs',
    '',
    '["Field Services"]'::jsonb,
    'https://www.nationsfs.com/',
    44.099169,
    -123.468389,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'af6cfcf0-6aec-48ea-b38e-b9d626e31c6b',
    'Touch Insight Systems',
    'touch-insight-systems',
    'Touch Insight Systems provides customer experience measurement, mystery shopping, compliance audits, and field inspection services for retail, financial services, and multi-location enterprises.',
    '["Field Audits, Mystery Shopping, Compliance Inspections"]'::jsonb,
    'https://www.touchinsight.com/',
    37.36854,
    -121.961472,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'af8e4538-e7dc-4f07-aad4-2cc782b7988d',
    'Premier Claims',
    'premier-claims',
    'Company name appears in insurance claims and adjusting contexts, but no verified national website, contractor onboarding portal, or primary corporate address could be confirmed under this exact name.',
    '["Claims Services, Insurance Adjusting"]'::jsonb,
    'https://premier-claims.com',
    41.260452,
    -96.091081,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b000a14f-0ebc-49e2-861d-a4553a3ec996',
    'Field Solutions',
    'field-solutions',
    '',
    '["Mystery Shopping","Field Services","Retail Audits"]'::jsonb,
    'https://www.fieldsolutionsinc.net/',
    42.253027,
    -87.840413,
    false,
    20,
    40,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b0354240-3bd9-49bf-8714-84a994fc9ee7',
    'ASI Auto GroupLLC',
    'asi-auto-groupllc',
    '',
    '["Field Services"]'::jsonb,
    'https://asiag.com/',
    35.890746,
    -86.965691,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b0725b87-11df-4fb4-8814-002d71b90c63',
    'NIC Solutions',
    'nic-solutions',
    'Highly generic company name used by multiple technology and government services firms. No verified inspection-focused entity, official website, or contractor onboarding portal could be confirmed under this exact name.',
    '["Technology Services, Government Solutions"]'::jsonb,
    '',
    38.94374,
    -94.882351,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b123264b-d2c0-4dfc-a731-644c0d0114c6',
    'GCS Field Research',
    'gcs-field-research',
    '',
    '["Insurance Inspection","Property Inspection","Risk Assessment"]'::jsonb,
    'https://gcsfieldresearch.com',
    35.006628,
    -80.852018,
    false,
    2,
    50,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b1519426-33d7-4e6d-a6f3-8edde932545a',
    'Verisk Analytics, Inc.',
    'verisk-analytics-inc',
    'Verisk Analytics is a leading American data analytics, risk assessment, and decision support firm serving insurance, financial services, and risk management sectors, with a global footprint and S&P 500 listing.',
    '["Data Analytics & Risk Management, Insurance Tech"]'::jsonb,
    'https://www.verisk.com/',
    40.727745,
    -74.035314,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b1778732-5cc6-422c-9246-3a75de57ead6',
    'Ocwen/Onity',
    'ocwen',
    '',
    '["Field Services"]'::jsonb,
    'https://onitygroup.com',
    26.697397,
    -80.075887,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b1df2c39-71d6-4515-b1e7-cf69543df43c',
    'RK&K',
    'rkk',
    'RK&K is a national engineering and consulting firm providing transportation, infrastructure, construction inspection, and environmental services for public and private sector clients.',
    '["Engineering Consulting, Infrastructure Inspections, Transportation"]'::jsonb,
    'https://www.rkk.com/',
    39.286996,
    -76.606157,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b2c0ae3d-effd-4398-a07f-61827382c825',
    'Collateral Specialists',
    'collateral-specialists',
    'Nationwide inspection services for banks and financial companies to verify collateral.',
    '["Property Inspection","Damage Assessment","Insurance Claims"]'::jsonb,
    'https://www.csina.com/',
    32.750532,
    -97.331145,
    false,
    250,
    400,
    4.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b3083253-72a9-4927-be4d-577a25dc387a',
    'Platinum Home Design LLC',
    'platinum-home-design-llc',
    'Home design and remodeling company name used by multiple local contractors. No verified national website, vendor portal, or primary corporate headquarters could be confirmed under this exact legal name.',
    '["Home Design, Remodeling, Construction Services"]'::jsonb,
    '',
    44.099169,
    -123.468389,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b3a1eed5-5ab3-4095-abe2-1e818d71824a',
    'SGS',
    'sgs',
    '',
    '["Field Services"]'::jsonb,
    'https://www.sgs.com/',
    40.817119,
    -74.101484,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b4876501-9de2-4d3c-839e-f8d5688169c3',
    'McCrory & Williams, Inc.',
    'mccrory-williams-inc',
    'Engineering and surveying firm providing land surveying, civil engineering, and construction inspection services for municipal, infrastructure, and private sector clients.}',
    '["Engineering Consulting, Land Surveying, Construction Inspection"]'::jsonb,
    'https://mcwinc.com/',
    30.667927,
    -88.123282,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b4a75c1a-5ce5-479b-b33f-c885e3efa418',
    'A2Z Field Services',
    'a2z-field-services',
    '',
    '["Property Preservation","Field Services"]'::jsonb,
    'https://a2zfieldservices.com/',
    40.119264,
    -83.190109,
    false,
    NULL,
    NULL,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b4cb538b-291d-49a8-be84-419829589286',
    'National Vendor Management Services NVMS',
    'national-vendor-management-services-nvms',
    'As the leading national vendor management companyNVMS offers a full range of inspection and preservation services utilized by a variety of industries including Residential and Commercial LendingValuationBankingInsurance and Asset Management.

Our national network of over 30,000 highly trained and professionally certified inspectors and field representatives will ensure that all your preservation and inspection needs are performed with precision and efficiency. Every NVMS service can b...',
    '["Property Preservation"]'::jsonb,
    'http://www.nvms.com',
    38.797374,
    -77.532834,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b50c0b7a-269c-4bd9-956e-a9461e9cc7f1',
    'Insurance Loss Control Services',
    'insurance-loss-control-services',
    '',
    '["Field Services"]'::jsonb,
    'https://www.losscontrolsource.com/',
    42.151202,
    -70.734146,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b5109052-6b85-4846-b1d8-69793e1f1607',
    'Sunshine Inspection Bureau',
    'sunshine-inspection-bureau',
    'Sunshine Inspection Bureau (operating as Sutton Inspection Bureau, Inc. of Florida) is a long-established provider of residential and commercial property surveys and liability assessments to the insurance industry, serving multiple Southeastern U.S. states with a focus on customized reporting and partner workflows.',
    '["Insurance Surveys, Property & Commercial Inspections"]'::jsonb,
    'http://www.sibfla.com/',
    27.770459,
    -82.71054,
    true,
    30,
    55,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b5615bd2-c5d9-4c26-ba17-2e386a4de579',
    'Nations Valuation Services',
    'nations-valuation-services',
    'National appraisal management company offering conventional, FHA, and specialized valuation services.',
    '["Property Inspection","Valuation Services","Analytics"]'::jsonb,
    'https://www.nationsvs.com',
    40.079977,
    -82.920129,
    false,
    NULL,
    NULL,
    3.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b56d33cd-f384-48c9-b525-990162902f73',
    'Red Rock Companies',
    'red-rock-companies',
    'Red Rock Companies provides construction, property improvement, and infrastructure services across residential and commercial projects, often supporting inspection and compliance workflows.',
    '["Construction, Property Services, Infrastructure"]'::jsonb,
    'https://www.redrockcompanies.com/',
    28.080444,
    -82.507712,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b5b6bd8c-c2c0-4fbd-a6ec-c2b5521d372c',
    'Qualified Inspection Services',
    'qualified-inspection-services',
    'Qualified Inspection Services provides insurance underwriting inspections, loss control surveys, and property risk assessments primarily serving Texas and surrounding regions.',
    '["Insurance Inspections, Loss Control, Risk Assessment"]'::jsonb,
    'https://qis-tx.com/',
    29.813142,
    -95.309789,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b678ef2a-0b84-4098-a5f3-200a7564ce30',
    'RESNET.',
    'resnet',
    'National standard-setting organization for building energy efficiency ratings and certification.',
    '["Field Services"]'::jsonb,
    'https://www.resnet.us/',
    42.584644,
    -70.963811,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b73f63a4-5168-43cd-bf70-efa7d3ce990e',
    'Spectrum Field Services',
    'spectrum-field-services',
    'Spectrum Field Services provides mortgage and property inspection services, preservation, and related field services to lenders, servicers, and insurers. It has a proprietary inspection app and technology platform used by its vendor network.}',
    '["Mortgage Field Services, Property Inspections, Preservation"]'::jsonb,
    'https://spectrumfsi.com',
    33.020629,
    -96.718724,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b78bc0cc-8f80-4d7e-ae82-bf23ef59f6da',
    'LSCG (Life Safety Consulting Group)',
    'lscg-life-safety-consulting-group',
    'Life Safety Consulting Group provides life safety, fire protection engineering, code consulting, and building compliance services for commercial and residential developments.',
    '["Life Safety Consulting, Code Compliance, Fire Protection Engineering"]'::jsonb,
    'https://www.lscg.com/',
    36.826896,
    -76.072585,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b9602957-da3e-4906-9624-43a4921e9dab',
    'WSP USA Inspection Services',
    'wsp-usa-inspection-services',
    'WSP USA Inspection Services deploys trained housing inspectors nationwide in response to FEMA-declared disasters, assessing structural and property damage and supporting recovery efforts. It is part of the WSP USA Engineering and professional services organization.',
    '["Disaster & Housing Inspections, Emergency Field Services"]'::jsonb,
    'https://www.wspinspectionservices.com/',
    43.0709,
    -76.156041,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'b964e8e1-a0b6-4b12-bc1e-7d7dc3c6150e',
    'Aremco Inc.',
    'aremco-inc',
    'Property preservation company managing vacant properties, securing and maintaining assets nationwide.',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://www.aremco.us/',
    40.900997,
    -74.6382,
    false,
    NULL,
    NULL,
    3.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ba052409-e211-4add-ba1a-b2746f147141',
    'Perry Johnson Registrars Food Safety Inc.',
    'perry-johnson-registrars-food-safety-inc',
    '',
    '["Construction Monitoring","Project Management"]'::jsonb,
    'https://pjrfsi.com',
    42.560303,
    -83.160857,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'baa91236-bb1f-4c23-b39c-23e3572fac2a',
    'Lemonsquad',
    'lemonsquad',
    'Pre-purchase vehicle inspection service covering cars, trucks, motorcycles, and RVs nationwide.',
    '["Appraisal Services","Moving Services","Relocation"]'::jsonb,
    'https://www.lemonsquad.com',
    46.616147,
    -94.235561,
    false,
    25,
    50,
    2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'babf25e4-97ca-45d6-93df-ba5787bcb07e',
    'Myamc',
    'myamc',
    'National appraisal management company delivering valuation solutions with local expertise.',
    '["Property Inspection","Appraisal Services","Field Services"]'::jsonb,
    'https://www.myamc.com',
    32.948809,
    -96.82647,
    false,
    300,
    475,
    3.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bb3668ff-a98e-426e-8ae3-4d2d7f55aa03',
    'Harrison Legacy Solutions',
    'harrison-legacy-solutions',
    '',
    '["Field Services"]'::jsonb,
    'https://www.harrisonlegacysolutions.com/',
    39.917079,
    -86.108732,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bb4c773d-dff6-4004-8040-398765b06cab',
    'National Creditors Connection',
    'national-creditors-connection',
    '',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://www.ncciservices.com',
    33.670202,
    -117.672101,
    false,
    35,
    250,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bb943ab6-54d6-4a8d-bdbb-f266b523b6a9',
    'RL Vantage Point LLC',
    'rl-vantage-point-llc',
    'RL Vantage Point provides mortgage field services including property inspections, occupancy checks, and REO-related support services for lenders and servicers.',
    '["Mortgage Field Services, Property Inspections, REO Services"]'::jsonb,
    'https://www.rlvantagepoint.com',
    44.099169,
    -123.468389,
    true,
    10,
    100,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bbd42ab8-7935-44f1-a55c-7ff9e388b021',
    'InTouch Insight Systems',
    'intouch-insight-systems',
    '',
    '["Property Inspection","Site Verification","Field Services"]'::jsonb,
    'https://www.intouchshoppers.com',
    37.960096,
    -82.090612,
    false,
    50,
    90,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bca4fb82-da35-4ba2-ac66-2aba42ed05bb',
    'Langer and Associates now NEIS and Armstrng',
    'langer-and-associates-now-neis-and-armstrng',
    'NEIS is a leading provider of premium audit and loss control services to the insurance industry. You can rely on an organization of employee professionals with the experience to offer the highest standards in the industry for timeserviceand quality.',
    '["Field Services"]'::jsonb,
    'https://www.neis1.com/packages/worx/themes/worx/images/NEIS_Logo_2024_White.png',
    41.519717,
    -72.867698,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bceadf3c-ffc0-4e7a-b24b-14940f7f8978',
    'VA Field Services',
    'va-field-services',
    'VA Field Services provides property inspection and face-to-face outreach services including occupancy verification, facility condition assessment, and letter delivery field services through a vendor network.',
    '["Field Inspections, Occupancy & Outreach Services"]'::jsonb,
    'https://vafieldservice.com/',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bd358743-5b1a-481b-b976-fb3861bdfc0f',
    'Alexander & Schmidt',
    'alexander-schmidt',
    '',
    '["Construction Monitoring","Property Inspection"]'::jsonb,
    'https://www.alexanderschmidt.com/',
    43.79922,
    -70.1886,
    false,
    30,
    55,
    3.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bd53ad3a-6653-4174-baaf-02376270372c',
    'Reliance Field Services',
    'reliance-field-services',
    '',
    '["Virtual Verification","Property Inspection"]'::jsonb,
    'http://www.reliancefieldservices.com',
    25.732309,
    -80.356412,
    false,
    20,
    40,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bd767cfe-4147-4e95-b2c3-1f935d4e8153',
    'Cox and Smith',
    'cox-and-smith',
    '',
    '["Insurance Verification","Field Services","Premium Audit"]'::jsonb,
    'https://www.coxandsmith.com',
    30.222351,
    -92.020659,
    false,
    NULL,
    NULL,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bf06e095-c29b-4a9b-94fe-9a53660262c0',
    '1st Choice MFS',
    '1st-choice-mfs',
    '1st Choice MFS provides mortgage field inspection services utilizing a network of contractors who deliver timely and reliable property inspection services.',
    '["Field Services"]'::jsonb,
    'https://www.1stchoicemfs.com/',
    30.15156,
    -96.257731,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bf1ee4fa-891c-4947-8bc3-2bcf0aa635b1',
    'Complytraq',
    'complytraq',
    'ComplyTraq provides robust compliancecredentialingand training services to the consumer credit and financial data industries. We are committed to aiding organizations in handling consumer information with compliance requirements and assisting in the protection of public and private data. Our experience in compliance verification including virtual & physical onsite inspectionsand FCRAGLBADPPA and credit bureau requirements create a comprehensive resource for compliance guidance.',
    '["Insurance Inspection","Property Inspection","Risk Assessment"]'::jsonb,
    'https://www.complytraq.com',
    34.011219,
    -84.59705,
    true,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'bf4cd942-6759-4646-94e9-d37597ef8df2',
    'WeGoLook',
    'wegolook',
    'WeGoLook is a leading on-demand field services platform leveraging a network of independent contractors to perform property, vehicle, and asset inspections along with custom field data collection for businesses and consumers nationwide.',
    '["On-Demand Field Services, Inspections & Data Capture"]'::jsonb,
    'https://www.wegolook.com/',
    35.521956,
    -97.545651,
    true,
    75,
    150,
    4.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c0f32c88-3a49-4ef4-bd6b-375ffdcfe924',
    'Tran Star-Tech',
    'tran-star-tech',
    'Tran Star-Tech is an engineering and technical services firm providing inspection support, project consulting, and specialized field services primarily for industrial and infrastructure-related clients.',
    '["Engineering Services, Inspection & Technical Consulting"]'::jsonb,
    'http://www.transtartech.com',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c1683811-0ef0-40e4-911a-3838f298b1eb',
    'Zakian Surveying & Appraisal Services',
    'zakian-surveying-appraisal-services',
    'Zakian Surveying & Appraisal Services delivers professional land surveying, boundary determination, and property appraisal services for clients in real estate, land development, and valuation sectors. ',
    '["Surveying & Appraisal Services"]'::jsonb,
    'https://www.zakiansurveyors.com/',
    31.406683,
    -88.175846,
    true,
    20,
    60,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c16f03d6-66a7-4eeb-b86a-6b4ae8112520',
    'The Rep Report',
    'the-rep-report',
    'The Rep Report provides insurance inspection and loss control reporting services, supporting underwriting and risk evaluation workflows for carriers and insurance service providers.',
    '["Insurance Inspections, Loss Control, Risk Surveys"]'::jsonb,
    'https://therepreport.com/',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c22664fa-184a-4888-8837-47d9149457bd',
    'Mortgage Contracting Services',
    'mortgage-contracting-services',
    '',
    '["Vehicle Verification","Property Inspection","Auto Inspection"]'::jsonb,
    'https://mcs360.com/',
    32.991523,
    -96.983422,
    false,
    20,
    45,
    3.9
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c2a07764-e18a-4a65-ae18-afc15c582f9d',
    'Guardian Portfolio Services',
    'guardian-portfolio-services',
    'Guardian Portfolio ServicesInc. (GPS) has been providing field services to the financial industry since 1997. We provide promptprofessional and accurate information that will assist youthe creditorin protecting and enhancing the integrity of your receivables',
    '["Mortgage Services","Mystery Shopping","Retail Audits"]'::jsonb,
    'https://www.guardianps.com',
    40.776557,
    -73.466009,
    true,
    15,
    75,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c3065797-be32-4063-ab0e-5c97a0820f75',
    'Canadian Mortgage Loan Services Limited',
    'canadian-mortgage-loan-services-limited',
    'With offices across the countrywe provide a wide range of commercial lending servicesresidential real estate mortgages and institutional services.',
    '["Field Services"]'::jsonb,
    'http://www.cmls.ca',
    45.628712,
    -122.647206,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c32f2bbd-ce33-4b09-badc-5cd42fb9fbae',
    'Independent Field Connections',
    'independent-field-connections',
    '',
    '["Insurance Inspection","Property Inspection","Risk Assessment"]'::jsonb,
    'https://ifconnects.com/',
    37.696218,
    -121.74233,
    false,
    75,
    300,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c39eb6c9-8570-4155-aaa6-10ddfbb10926',
    'Wilmot Field ServicesLLC',
    'wilmot-field-servicesllc',
    'Wilmot Field ServicesLLC provides mortgage servicing support to a wide array of public and private clients. Our network of contractors provides real time information and a range of preservation services on residential properties throughout the state of South Carolinasouthern North Carolinaand eastern Georgia.',
    '["Property Preservation"]'::jsonb,
    'https://wilmotfieldservices.weebly.com',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c3c15840-5c95-4fc0-ae1d-2b68a95519fa',
    'Leeway Inspections',
    'leeway-inspections',
    '',
    '["Property Inspection","Asset Management","Field Services"]'::jsonb,
    'https://www.leewayinspections.com',
    32.771419,
    -97.291484,
    false,
    20,
    50,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c42ed8e5-5e98-4ce4-88b2-2630d4ade784',
    'Millennium Information ServicesInc.',
    'millennium-information-servicesinc',
    'Since 1991Millennium Information Services has been a pioneer in bringing P&C insurers new and innovative ways to collectmanageand mine an extensive range of property and performance data – fueling true underwriting intelligence.

By providing proprietary technology and client service for the full property inspection and analysis lifecycleour nationwide inspectionstechnology toolsand analytic solutions make it easier to build more profitablepredictable homeowners’ portfolios.',
    '["Field Services"]'::jsonb,
    'http://www.millinfo.com',
    41.844156,
    -87.946196,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c57f9fa2-fcd6-4683-9006-653e5a3fad8e',
    'TheBest Claims Solutions',
    'thebest-claims-solutions',
    'TheBest Claims Solutions appears to be an insurance claims and inspection services brand name used in regional or independent adjuster contexts. No verified corporate website, vendor portal, or headquarters could be confirmed under this exact name.',
    '["Insurance Claims Services, Field Inspections"]'::jsonb,
    'https://thebestclaims.com',
    33.629518,
    -112.030238,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c5b4f065-a73a-418a-ae74-faac635f15b1',
    'ReloOlogy Inspection Management Services, LLC',
    'reloology-inspection-management-services-llc',
    'ReloOlogy is a nationwide property inspection management company serving relocation, trust, title, and corporate clients with residential and specialty inspections. They maintain an extensive network of licensed inspectors across the U.S. and Canada.}',
    '["Property Inspections, Relocation Services, Field Services"]'::jsonb,
    'https://www.reloology.com/',
    32.810583,
    -96.805731,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c5fe1e05-09de-4e6c-b318-2e5dc76af163',
    'Dominion Due Diligence Group',
    'dominion-due-diligence-group',
    '',
    '["Field Services"]'::jsonb,
    'https://www.d3g.com/',
    37.511288,
    -77.678618,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c61395ac-d6c3-4abb-a3b6-b888ba2e13ea',
    'Genuinsight LLC',
    'genuinsight-llc',
    '',
    '["Property Inspection","Asset Verification","Field Services"]'::jsonb,
    'https://www.genuinsight.com',
    44.275702,
    -88.370856,
    false,
    15,
    75,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c7b12931-a58c-47ac-9ef2-c97304d62997',
    'System One',
    'system-one',
    'System One is a national staffing and professional services firm providing engineering, technical, IT, and field services talent to government and commercial clients across regulated industries.',
    '["Staffing & Recruiting, Engineering & Technical Services"]'::jsonb,
    'https://www.systemone.com/',
    40.442006,
    -80.00003,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c818276c-bd53-4d77-9f32-4885b2b908e6',
    'Inspections Done Right LLC.',
    'inspections-done-right-llc',
    '',
    '["Field Services"]'::jsonb,
    'https://www.inspectionsdoneright.biz/',
    34.14979,
    -118.135812,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c8864cca-417d-46d8-b14c-a78299083b12',
    'Partner Enginerring & Science',
    'partner-enginerring-science',
    'Partner is the leading provider of engineeringenvironmentalconstructionenergyand valuation consulting for the commercial real estate industry. We help our clients manage riskmake smart investmentsoptimize asset performanceand _win_ at their real estate investment strategies.',
    '["Field Services"]'::jsonb,
    'https://www.partneresi.com',
    33.836198,
    -118.320649,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c89f3f6a-eb99-4926-a829-9d3a4c66231c',
    'Koncept Carma',
    'koncept-carma',
    'Customer experience and mystery shopping firm providing on-site audits, field evaluations, and compliance checks across retail, automotive, and service industries.',
    '["Mystery Shopping, Field Audits, Customer Experience Research"]'::jsonb,
    'https://www.konceptcarma.com/',
    47.299032,
    -122.213243,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c958af3b-6a94-4780-9363-a27761b899e2',
    'Opteon',
    'opteon',
    '',
    '["Real Estate Transaction Services","Property Inspection","Digital Closing"]'::jsonb,
    'https://opteonsolutions.com/',
    40.056261,
    -75.669621,
    false,
    275,
    400,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'c9d279ed-a680-4328-a858-a974ee5a5b18',
    'Absolute Value Management Corporation',
    'absolute-value-management-corporation',
    '',
    '["Property Inspection","Appraisal Services"]'::jsonb,
    'https://avappraisalmgmt.com/',
    42.353149,
    -71.058031,
    false,
    30,
    50,
    3.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'caca4934-ad41-4d84-b79b-0b235b96118c',
    'Overland Surveys',
    'overland-surveys',
    'Send us a message or call for a survey quote. Use our contact form to tell us more about your projectand we will connect you with the services to fit your needs. We pride ourselves on reliabilityaccuracyand the fastest survey turn around time in Houston.',
    '["Field Services"]'::jsonb,
    'http://overlandsurveyorshouston.com',
    29.486512,
    -98.49757,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'cb327f9f-5796-4d48-b423-1bc90a4cc968',
    'TechniPower',
    'technipower',
    'TechniPower is a technical staffing and recruiting firm providing engineering, field service, and skilled technical talent to industrial and manufacturing clients.',
    '["Technical Staffing, Engineering & Field Services"]'::jsonb,
    'https://www.technipower.com/',
    34.040454,
    -84.327606,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'cbb25e50-1450-4d77-a4f9-931983507123',
    'Appraisal Nation',
    'appraisal-nation',
    'Leading appraisal management company (AMC) providing comprehensive valuation services nationwide.',
    '["Property Inspection","Appraisal Services"]'::jsonb,
    'https://www.appraisalnation.com/',
    36.093114,
    -80.279471,
    false,
    300,
    600,
    3.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'cbfde6c7-127d-447d-9438-c840ebb1c44f',
    'Integrated Asset ServicesInc. now Sperry',
    'integrated-asset-servicesinc-now-sperry',
    'Contact local branch for vendor opportunities. Each branch has its own website (ie. Georgia is sperryga.com)',
    '["Field Services"]'::jsonb,
    'https://www.sperrycre.com/',
    33.671333,
    -117.858296,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'cc7aadd3-a89a-4d27-9c5e-d5ccbbb97874',
    'Hayman Residential Engineering ServicesLLC',
    'hayman-residential-engineering-servicesllc',
    'Hayman Residential Engineering Inc. caters to the engineering needs of the manufactured housing industry. We are always striving to bring engineering excellence to homeownerslenderscontractors and others who have had a difficult time finding engineering resources for manufactured homes. Manufactured housing is not a side-business for us—it is our area of expertise.',
    '["Field Services"]'::jsonb,
    'https://haymanengineering.com',
    40.691831,
    -73.334671,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ccee3d19-5518-4efd-80a3-a88f775f24bb',
    'Tru Appraisal',
    'tru-appraisal',
    'Tru Appraisal provides residential real estate appraisal and valuation services supporting lenders, mortgage companies, and real estate professionals with compliant appraisal reporting.',
    '["Real Estate Appraisals, Valuations"]'::jsonb,
    'https://truppraisal.com/',
    41.769068,
    -72.620669,
    true,
    NULL,
    NULL,
    3.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'cd285517-7cef-4c75-ac80-dbf504f9a669',
    'AFX Research',
    'afx-research',
    '',
    '["Property Inspection","Audit Services","Field Services"]'::jsonb,
    'https://www.afxllc.com/',
    35.28152,
    -120.661447,
    false,
    30,
    600,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ce5fdf45-3a1e-4cfa-a8c2-bd56baf3d6b3',
    'SuYash Consulting',
    'suyash-consulting',
    'SuYash Consulting is an IT consulting and professional services firm providing technology staffing, systems integration, and enterprise consulting solutions to corporate clients.',
    '["IT Consulting, Technology Staffing, Professional Services"]'::jsonb,
    'https://www.suyashconsulting.com/',
    39.178482,
    -76.801688,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'cf4f5c28-1fc4-4cb2-be4f-88952d26cfcd',
    'NEIS / Armstrong Risk Management',
    'neis-armstrong-risk-management',
    'Formerly National Engineering Inspection Services (NEIS), now operating as Armstrong Risk Management. Provides nationwide insurance underwriting inspections, loss control surveys, and risk management services.',
    '["Insurance Inspections, Loss Control, Risk Management"]'::jsonb,
    'https://www.armstrongriskmanagement.com/',
    41.519717,
    -72.867698,
    true,
    40,
    70,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'cf80107b-36f7-4c44-bd20-24c53dca2d14',
    'Seer Insurance InspectionsInc.',
    'seer-insurance-inspectionsinc',
    'SEER is a remote inspectionmonitoring and management tool. Based on site-widedailyspherical image captureSEER has been conceived to optimise off-site versus on-site resourceminimise the project carbon footprint through reduced air travelincrease the participation of technical expertsprovide a step-change in the photographic evidence of site constructionproviding enhanced records and reducing disputes.',
    '["Field Services"]'::jsonb,
    'https://seeronsite.com',
    38.950051,
    -94.741595,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'cfcdc447-af17-4c51-8e16-e18c268f638d',
    'Superior Mortgage Services',
    'superior-mortgage-services',
    'Superior Mortgage Services provides mortgage field services including inspections, property preservation, REO maintenance, and vendor network coordination for lenders, servicers, and real estate clients.',
    '["Mortgage Field Services, Property Preservation, Inspections"]'::jsonb,
    'https://www.sms-fl.com/',
    27.893008,
    -82.694884,
    true,
    NULL,
    NULL,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd0189987-d274-49ca-a535-cf254f7282a9',
    'Venture Underwriting LLC',
    'venture-underwriting-llc',
    '',
    '["Field Services"]'::jsonb,
    'https://ventureunderwriting.com/',
    33.980927,
    -84.348046,
    false,
    39,
    50,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd028da87-6e45-434c-bd58-159ac3859da4',
    'Field Group Inspections',
    'field-group-inspections',
    '',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://fgiservices.com/',
    42.28947,
    -87.957724,
    false,
    NULL,
    NULL,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd04edb03-fd43-4e8d-bd13-15f2bcc96d72',
    'Signature Companies',
    'signature-companies',
    'Signature Companies provides expert construction services, property maintenance, and restoration solutions nationwide across commercial and residential projects.',
    '["Construction Services, Property & Facility Maintenance"]'::jsonb,
    'https://www.signaturecompanies.com/',
    38.781979,
    -77.561709,
    true,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd10e70b6-14b2-47f4-b9d1-4f93fd20fcf8',
    'LSCG/Full-Circle-Fiber-Partners-LLC',
    'lscg',
    '',
    '["Field Services"]'::jsonb,
    'https://www.fullcirclefiberpartners.com/',
    0,
    0,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd2463c33-c660-4c66-a66d-8e56470a95f4',
    'Field Asset Reporting, LLC',
    'field-asset-reporting-llc',
    'Field Asset Reporting (FAR Inspections) is a mortgage field inspection services company providing visual and condition inspections, occupancy verification, and associated property fieldwork across multiple states.',
    '["Property Inspections, Field Services"]'::jsonb,
    'https://www.farinspections.com/',
    39.525749,
    -119.813051,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd3bb7cb3-6f9b-467b-884d-5b368732fb02',
    'Carco Group',
    'carco-group',
    'CARCO protects insurance carriers and consumers through its advanced Mobile AI technology platforms engineered to identify and prevent risk events and fraudulent activities that can expose companies and their bottom lines in highly competitive and challenging environments.
',
    '["Property Inspection","Appraisal Services"]'::jsonb,
    'https://www.carcogroup.com/',
    40.896013,
    -73.146312,
    true,
    NULL,
    NULL,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd50e38c9-250b-46e3-a71b-dd79d933e637',
    'EcoShield Pest Solutions',
    'ecoshield-pest-solutions',
    'National pest control company providing residential pest management services through local field technicians and regional service teams.',
    '["Pest Control, Field Services, Home Services"]'::jsonb,
    'https://www.ecoshieldpest.com/',
    33.284425,
    -111.783663,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd55591ba-7840-4393-ad00-1a7a52aa7f6c',
    'Ellis Mystery Shopping',
    'ellis-mystery-shopping',
    '',
    '["Property Inspection","Quality Control"]'::jsonb,
    'https://ellismysteryshopperjobs.com/',
    32.888014,
    -96.970209,
    false,
    NULL,
    NULL,
    1.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd5f47f26-f85d-409e-a7f6-5e3436f8cc27',
    'Preferred Reports',
    'preferred-reports',
    'Preferred Reports provides insurance underwriting inspections, loss control surveys, and risk assessment services for personal and commercial insurance carriers.',
    '["Insurance Inspections, Loss Control, Risk Assessment"]'::jsonb,
    'http://www.preferredreports.com',
    43.082951,
    -70.776691,
    true,
    300,
    1000.00,
    3.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd6c2dfae-f9b0-4bd2-88dd-6fabbc6064fb',
    'PRO Inspection Service Solutions',
    'pro-inspection-service-solutions',
    '',
    '["Property Inspection","Appraisal Services","Field Services"]'::jsonb,
    'https://proiss.com/',
    26.410844,
    -80.124041,
    false,
    15,
    55,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd7124a90-b0e4-47cb-a30d-8d4f9082cdb5',
    'Field Agent',
    'field-agent',
    '',
    '["Insurance Inspection","Field Services"]'::jsonb,
    'https://www.fieldagent.net/',
    36.058885,
    -94.162207,
    false,
    3,
    20,
    4.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd867bbad-fcab-43b6-a86b-b51a8e114a92',
    'Old Republic',
    'old-republic',
    'Old Republic International is a diversified insurance holding company offering property and casualty insurance, title insurance, and specialty risk solutions.',
    '["Insurance, Title Insurance, Risk Management"]'::jsonb,
    'https://www.oldrepublic.com/',
    41.887091,
    -87.624186,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'd8b4fdda-eb9f-4e5e-8ede-654660b27917',
    'Insurance & Safety ServicesInc.',
    'insurance-safety-servicesinc',
    'ISN is the global leader in contractor and supplier information management. ISN’s platformISNetworld®serves as a world-class forum for sharing industry best practicesbenchmarking performanceproviding data insights among its members and helping decision makersincluding board membersensure contractor and supplier risk is assessed and monitored.',
    '["Field Services"]'::jsonb,
    'https://www.isnetworld.com',
    32.803475,
    -96.79904,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'da2c7c31-b4e1-4ac4-ade8-5f439291aec7',
    'McDargh Real Estate Services Inc.',
    'mcdargh-real-estate-services-inc',
    'McDargh Consulting is a nationally-respected independent third-party commercial real estate site inspection and consulting firm. Acting as eyes on the ground we support the Client’s fact finding with thoroughunbiased property reporting using trusted and time-tested Best Practices and Procedures. Serving LendersServicersREITsInvestorsand others seeking data regarding assetsMcDargh facilitates the bridge to knowledge of current conditions and risks of assets. McDargh Consulting is a...',
    '["Field Services"]'::jsonb,
    'http://www.mcdarghconsulting.com',
    28.564675,
    -81.585752,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'da6125e9-0bb2-4177-9db7-9d2c5d34a312',
    'Test Center USAInc.',
    'test-center-usainc',
    '',
    '["Field Services"]'::jsonb,
    'http://testcenterusa.com/',
    29.746883,
    -95.606648,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'db8f5019-09f1-498d-b173-0d1d9885482a',
    'CCIC North America Inc.',
    'ccic-north-america-inc',
    '',
    '["Insurance Inspection","Property Inspection","Risk Assessment"]'::jsonb,
    'https://www.ccicna.com/',
    34.093651,
    -117.575336,
    false,
    NULL,
    NULL,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'dda28041-d97a-4e52-a64f-39421033316f',
    'First American',
    'first-american',
    '',
    '["Field Services"]'::jsonb,
    'https://firstam.com/',
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'dde9bf30-446c-4877-bd1a-7028d761ec03',
    'Field Services Inc.',
    'field-services-inc',
    'iCIMS is a talent acquisition platformnot specifically an inspection-focused systembut it can be used to manage job postings and track candidates for roles that involve inspectionslike quality control or visual inspection positions',
    '["Field Services"]'::jsonb,
    'https://careers-fdmfieldservices.icims.com',
    44.099169,
    -123.468389,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'de04cc81-bc73-458c-999d-e9cc791e6b0a',
    'First Allegiance',
    'first-allegiance',
    'Nationwide property services firm providing property preservation, maintenance, inspections, rehab, code compliance services, and lockout field services. Woman-owned business with proprietary technology platforms for quality and reporting.',
    '["Property Preservation, Field Services, Inspections"]'::jsonb,
    'https://www.firstallegiance.com/',
    40.139224,
    -74.225064,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'dfb5b1a4-cbd9-4069-887e-54fc35adc65e',
    'Computer Evidence SpecialistsLLC',
    'computer-evidence-specialistsllc',
    '',
    '["Field Services"]'::jsonb,
    'http://cesnb.com',
    33.493873,
    -79.089048,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e0f1f7be-0fec-4fc1-b192-7ebe5ec63abf',
    'Cyprexx Services',
    'cyprexx-services',
    'Cyprexx Services has been providing quality and cost-effective property preservation services for over 25 years. A family-owned businessCyprexx has led the industry with a flat-fee pricing model and dedicated client-based services teams. Founder Ronnie Ory has been building safe and secure homes since 1979.

As the market continues to changeCyprexx has remained nimble and dynamiccontinually adding services from national inspections to repairs that allow the organization to flex with the...',
    '["Property Inspection","Appraisal Services"]'::jsonb,
    'https://www.cyprexx.com',
    27.946626,
    -82.325086,
    true,
    NULL,
    NULL,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e11dcb08-4631-44c7-ac69-bc6b27ac59f6',
    'NextDay Inspect®',
    'nextday-inspect',
    'National inspection company providing property condition reports, occupancy inspections, and appraisal alternative products for lenders and servicers.',
    '["Property Inspections, Appraisal Alternatives, Valuation Services"]'::jsonb,
    'https://www.nextdayinspect.com/',
    39.033993,
    -77.402203,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e154889e-ef68-40f9-b8b1-625621806c0c',
    'Xome Valuations',
    'xome-valuations',
    'Xome offers property auction services, MLS listings, home valuations, and related real estate transaction tools — including a vendor portal for real estate professionals and service partners.',
    '["Real Estate Auctions, Valuations & MLS Services"]'::jsonb,
    'https://www.xome.com/valuations/',
    32.992427,
    -96.969734,
    true,
    250,
    400,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e1fa4f1b-fb6f-4206-af99-3a3f2a296802',
    'Fidelity National Field Services Inc',
    'fidelity-national-field-services-inc',
    'Property preservation and field inspection services company associated with the Fidelity National family of field services, providing nationwide mortgage field operations including inspections and preservation. Often referenced alongside large mortgage servicing field networks. No confirmed official vendor portal found.',
    '["Mortgage Field Services, Property Preservation, Inspections"]'::jsonb,
    'https://www.fidelitytech.com/field-services/',
    40.372716,
    -75.919172,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e29e03fe-1369-4065-a0b9-ba59bfe31fb3',
    'WNS North America',
    'wns-north-america',
    'WNS North America (part of WNS Global Services) is a leading outsourcing and business process management (BPM) company providing analytics, customer service, finance and accounting, and real estate process solutions to enterprises.',
    '["Business Process Management, Outsourcing Services"]'::jsonb,
    'https://www.wns.com/',
    40.715854,
    -74.033397,
    true,
    17,
    51,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e40a7dac-c4ac-4c37-9ed1-a36488d0501b',
    'GroundWorks Inspection Services',
    'groundworks-inspection-services',
    '',
    '["Insurance Inspection","Property Inspection","Loss Control"]'::jsonb,
    'http://www.groundworks-inspections.com',
    29.785304,
    -95.568558,
    false,
    20,
    60,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e60a3fa9-8bba-4c2a-9aa1-596dce1754c5',
    'Midwest Technical Inspections',
    'midwest-technical-inspections',
    'MTI - Midwest Technical Inspections is a **leading national provider** of insurance inspectionrisk controland premium audit related services. We help our clients properly identifyclassifyand mitigate risk. This candepending on our clientaid them in: underwriting an insurance policyreducing loss potential for their businessimproving their work focus and analysis. We primarily serve the insurance industry and non-insurance markets whose needs relate to insuranceinspectionand...',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://www.mtinspections.com/',
    41.97424,
    -88.12938,
    true,
    30,
    55,
    2.8
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e6670ad8-a9da-4730-b6f7-41c322199dee',
    'Remington Evaluations',
    'remington-evaluations',
    'Remington Evaluations provides customized mystery shopping and field auditing services focused on apartment communities and property management service quality.',
    '["Mystery Shopping, Field Auditing, Customer Experience"]'::jsonb,
    'https://www.remysteryshops.com/',
    42.583382,
    -83.500878,
    true,
    40,
    75,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e678de81-0f5f-497c-8f1f-8c8bea5e0866',
    'Class Valuation',
    'class-valuation',
    '',
    '["Appraisal Services","Field Services","Valuation"]'::jsonb,
    'https://www.classvaluation.com',
    42.559091,
    -83.115077,
    false,
    NULL,
    NULL,
    2.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e6d98f7b-a142-409a-9409-033eb4ca1f4b',
    'Majestic Service Company',
    'majestic-service-company',
    'Since 1962 Majestic Service Company has provided loss control and inspection services on behalf of Insurance companieswholesale agenciesprogram writers and brokers. Utilizing a completely digital and customizable reporting system to meet our clients’ needswe offer loss control services for over 20 lines of coverage. We have provided the insurance industry with loss control services for nearly 60 years. We utilize our state-of-the-art custom reporting system to provide inspection service...',
    '["Field Services"]'::jsonb,
    'http://www.majesticservicecompany.com',
    40.520654,
    -74.279144,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e7c2e200-9044-4d93-91fc-cf353f54637a',
    'Mueller Reports',
    'mueller-reports',
    'If you need reports quickly—without sacrificing quality—you need Mueller. With more than 40 years of experience in real estate reporting and risk assessmentwe distinguish ourselves with a seamless blend of proprietary technology and professional staff to bring accurate and consistent reporting to the insurance and valuation industries.

To bring you the bestwe employ our own dedicated field staff—not subcontractors—who ensure that you always get the comprehensive data you needand the pe...',
    '["Insurance Inspection","Property Inspection","Field Services"]'::jsonb,
    'https://www2.muellerreports.com/',
    42.982603,
    -78.90898,
    true,
    45,
    65,
    3.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e8540ca0-14d0-4305-91c9-c08882f85382',
    'FieldChoiceLLC',
    'fieldchoicellc',
    'FieldChoice helps more businesses get their documents signed right. Trust one of the most well respectednation-wide mobile notary signing services. Leave the signing to us.',
    '["Field Services"]'::jsonb,
    'https://www.fieldchoice.com',
    33.68405,
    -117.884511,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e9247764-96e5-4e51-903d-f01c5950da87',
    'Technical Insurance Services (TIS)',
    'technical-insurance-services-tis',
    'Technical Insurance Services (TIS) provides insurance underwriting inspections, loss control surveys, and property risk assessments for insurance carriers and MGAs.',
    '["Insurance Inspections, Loss Control, Risk Assessment"]'::jsonb,
    'http://www.tisinspects.com',
    35.927695,
    -84.045592,
    true,
    35,
    250,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e932c949-3b65-4aa0-ab01-8f6287bdb4f8',
    'Pinnacle Mystery Shopper',
    'pinnacle-mystery-shopper',
    'Mystery shopping and field audit brand name used by multiple customer experience research firms. No single verified national entity or primary corporate website could be confirmed under this exact name.',
    '["Mystery Shopping, Field Audits, Customer Experience Research"]'::jsonb,
    'https://pinnaclefinancialstrategies.com/mystery-shopper-jobs',
    33.002495,
    -96.726313,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e93e5a87-1f7c-4097-9f87-32b6648283ae',
    'Northwest Construction Control',
    'northwest-construction-control',
    '',
    '["Asset Verification","Remote Inspection","Field Services"]'::jsonb,
    'https://trynorthwest.com',
    47.209445,
    -122.227319,
    false,
    175,
    225,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e96d2ed5-8ba9-497f-87e4-b54e15b0937f',
    'Casago',
    'casago',
    'National vacation rental management company operating local markets through franchise-style property management teams.',
    '["Vacation Rental Management, Property Management, Short-Term Rentals"]'::jsonb,
    'https://casago.com/',
    33.613628,
    -111.91493,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e998e298-b521-4bce-90fc-dfa28cfc5d62',
    'Brookstone Management LLC',
    'brookstone-management-llc',
    '',
    '["Property Preservation","Mystery Shopping","REO Services"]'::jsonb,
    'https://www.brookstonemanagement.com',
    40.137766,
    -74.190711,
    false,
    NULL,
    NULL,
    2.4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e9c62194-6e0a-46f9-b2ba-724017e794c9',
    'Nationwide Loan Inspections',
    'nationwide-loan-inspections',
    '',
    '["Insurance Inspection","Property Inspection","Loss Assessment"]'::jsonb,
    'https://nationwideloaninspections.com/',
    34.10927,
    -83.76267,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'e9e2125d-0ca7-459a-982e-95da4009ecbe',
    'Pacific Field Services',
    'pacific-field-services',
    '',
    '["Property Preservation","Risk Assessment","REO Services"]'::jsonb,
    'https://www.pacfield.com/',
    38.586175,
    -121.416136,
    false,
    45,
    75,
    3.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ea36872c-0b52-45e2-8560-4e0b8480fa39',
    'Rocket Close',
    'rocket-close',
    'Rocket Close is a digital real estate closing platform by Rocket Companies, enabling buyers, sellers, agents, and lenders to manage title, escrow, and closing workflows online.',
    '["Real Estate Transactions, Title & Closing Technology"]'::jsonb,
    'https://www.rocketclose.com',
    42.330921,
    -83.04528,
    true,
    75,
    200,
    3.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ea3e124f-a800-44ae-8f47-a514c35ab816',
    'Virtual Site Inspections',
    'virtual-site-inspections',
    '',
    '["Appraisal Services"]'::jsonb,
    'https://virtualsiteinspections.com',
    33.248742,
    -111.865003,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'eb8df776-fb34-40e3-8b45-9a88368982e1',
    'Castle High Value (EXL Service)',
    'castle-high-value-exl-service',
    'High-value property inspection and risk assessment service operated under EXL, supporting insurance carriers with luxury home evaluations and loss mitigation services.',
    '["High Value Property Inspections, Insurance Risk Services, Loss Control"]'::jsonb,
    'https://www.exlservice.com/',
    40.757603,
    -73.973994,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ebbb2ae3-3be5-4f0e-970a-48da79cae638',
    'Compass Adjusting Services',
    'compass-adjusting-services',
    '',
    '["Property Inspection","Insurance Claims","Field Services"]'::jsonb,
    'https://compassadjustingservices.com',
    32.751278,
    -97.082535,
    false,
    NULL,
    NULL,
    5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ebd067a4-4e3d-4d7d-889a-08d02c1be52b',
    'Accu-Audits',
    'accu-audits',
    '',
    '["Quality Control","Audit Services"]'::jsonb,
    'http://www.accu-audits.com',
    40.161024,
    -79.509814,
    false,
    105,
    135,
    2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ec26cf70-7bfa-4dec-bb37-3e2a0c3599b4',
    'Lerch Bates',
    'lerch-bates',
    'Global consulting firm specializing in elevator, escalator, and vertical transportation inspection, design, and advisory services for commercial and residential buildings.',
    '["Vertical Transportation Consulting, Elevator Inspections, Engineering"]'::jsonb,
    'https://www.lerchbates.com/',
    39.539835,
    -104.85503,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ed6081ba-f4ba-427a-b7ce-1ff1dc328798',
    'Building & Earth Sciences, Inc.',
    'building-earth-sciences-inc',
    'Engineering and consulting firm providing building envelope assessments, construction materials testing, and geotechnical services for commercial and residential projects.',
    '["Engineering Consulting, Building Inspections, Geotechnical Services"]'::jsonb,
    'https://www.buildingandearth.com/',
    33.504015,
    -86.814841,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ed7362cb-4dd7-4715-9fe7-bbcac84ef134',
    'National Field Representatives',
    'national-field-representatives',
    'National Field Representatives (NFR) is a nationalclient-centric property field services company providing property inspections and preservation services. We do over 120,000 inspections and 10,000 preservation orders every monthpreserving the value of our clients’ properties. Recognized as having one of the best and largest network of contractors in the fieldNFR serves clients in all 50 states.',
    '["Rental Property Services","Real Estate Investment","Appraisal Services"]'::jsonb,
    'https://www.nfronline.com/',
    43.364264,
    -72.361796,
    true,
    75,
    125,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ee43f354-5b2a-408b-9eb3-5a44b9851b25',
    'Davies Group',
    'davies-group',
    '',
    '["Property Inspection","Property Management","Field Services"]'::jsonb,
    'https://davies-group.com/northamerica/',
    30.237991,
    -81.625052,
    false,
    250,
    500,
    3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ef209e92-5888-4b29-95db-7791a2796cfa',
    'Hossain Preservation Service',
    'hossain-preservation-service',
    '',
    '["Field Services"]'::jsonb,
    'https://hossainpreservation.com/',
    34.06665,
    -118.29322,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ef8e159b-39d9-43a4-802e-cbfafa618d37',
    'Boulder Housing Partners',
    'boulder-housing-partners',
    '',
    '["Field Services"]'::jsonb,
    'https://boulderhousing.org',
    40.06183,
    -105.282124,
    false,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f04128e8-9d08-4299-bd9b-11412785abc8',
    'AMC Settlement Services',
    'amc-settlement-services',
    '',
    '["Property Inspection","Settlement Services","Appraisal Services"]'::jsonb,
    'http://www.amcssc.com',
    40.50205,
    -80.21135,
    false,
    25,
    65,
    3.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f050cfba-0153-4aa6-9ea6-8a3379db603c',
    'Information Systems and Network',
    'information-systems-and-network',
    'ISN is a leading provider of investigation and inspection services to the Federal Government. ISN’s network of 1,800 highly trained and credentialed investigative professionals allows ISN to address geographically-diverse requirements skillfully. Our investigators are within 2 hours of any investigative assignment within the Continental 48 states.

Our industry-leading approach offers our clients innovative solutions to meet their missions. Our corporate CMMI Level 3 appraisal exemplifies our...',
    '["Field Services"]'::jsonb,
    'https://www.isncorp.com',
    39.027764,
    -77.142984,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f0df7873-a7fe-4ffe-99ee-90c6a49df41f',
    'Field Nation',
    'field-nation',
    'The #1 labor marketplace connecting companies with skilled field service technicians for IT and property projects.',
    '["Property Management","Appraisal Services","Field Services"]'::jsonb,
    'https://www.fieldnation.com',
    44.975892,
    -93.270931,
    false,
    10,
    150,
    4.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f1a2d925-6adf-4e5b-8a09-914ab1fc00a3',
    'ProxyPics',
    'proxypics',
    'ProxyPics is an innovative real estate technology platform that revolutionizes property inspection and valuation. The company provides a range of servicesincluding ProxyPics Directa self-inspection application.',
    '["Property Inspection","Field Services"]'::jsonb,
    'https://www.proxypics.com',
    41.960092,
    -87.779735,
    true,
    15,
    30,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f1aa8b36-de42-4bb1-94f6-e30a7d0c96aa',
    'Field Services UnlimitedInc',
    'field-services-unlimitedinc',
    'At FSUwe believe in more than just profits. Our journey is defined by the values that underpin our every action. Our commitment to integrity and compassion isn’t just a philosophy; it’s the driving force that fuels our business. With an understanding that these values lead to both satisfied customers and exceptional serviceswe’ve embarked on a remarkable journey that spans from our inception to our current standing.

Our story is one of evolution and growthfrom our humble beginnings to ...',
    '["Field Services"]'::jsonb,
    'http://www.fsusurveyor.com',
    43.066538,
    -92.685633,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f25cc160-4361-4467-a2bf-e400051c5dc3',
    'US Real Estate Services',
    'us-real-estate-services',
    'US Real Estate Services provides nationwide mortgage field services including appraisals, valuations, property inspections, and advisory support for lenders and servicers. ([usres.com](https://www.usres.com/?utm_source=chatgpt.com))',
    '["Mortgage Field Services, Valuations, Inspections"]'::jsonb,
    'https://www.usres.com/',
    33.662738,
    -117.685781,
    true,
    35,
    60,
    2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f3448278-6274-40c5-aa86-2a3d385ccaec',
    'Service Commitment Integrity Inspections',
    'service-commitment-integrity-inspections',
    '',
    '["Property Inspection","Appraisal Services","Valuation"]'::jsonb,
    'https://www.sciinspection.com/',
    33.877753,
    -117.73109,
    false,
    NULL,
    NULL,
    4.7
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f3aa6369-967b-473e-aa9a-6190df0aaed9',
    'Equator',
    'equator',
    'Technology platform used by lenders and servicers to manage property preservation, inspections, valuations, and vendor workflows across mortgage portfolios.',
    '["Mortgage Field Services Platform, Vendor Management, Property Services"]'::jsonb,
    'https://www.equator.com/',
    34.058699,
    -84.290254,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f4b85bf3-1390-4c91-91ad-b5aae1f9fba5',
    'Inspectify',
    'inspectify',
    'Tech-enabled property inspection platform leveraging a network of inspectors for standardized real estate data.',
    '["Appraisal Management","Property Inspection","Valuation Services"]'::jsonb,
    'https://www.inspectify.com',
    47.601885,
    -122.331757,
    false,
    15,
    150,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f51b2501-b667-4445-b512-9517e3936676',
    'MSI',
    'msi',
    'Founded in 1983MSI is a national field service company that takes pride in preserving communities and providing our clients a reliablecustomizableand compliant property preservation solution.',
    '["Property Preservation"]'::jsonb,
    'https://www.msionline.com',
    32.90905,
    -97.257878,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f6333b76-df91-480f-b8f8-8a873c0d42c2',
    'Lowry & Associates',
    'lowry-associates',
    '',
    '["Property Inspection","Audit Services","Field Services"]'::jsonb,
    'https://lowryinc.com',
    40.579404,
    -111.904649,
    false,
    45,
    70,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f7332c26-7d74-4dd3-a2b9-094c000fce7e',
    'CIS Group',
    'cis-group',
    '',
    '["Property Preservation","Property Inspection","Field Services"]'::jsonb,
    'https://www.cisgroup.net',
    32.929271,
    -97.115333,
    false,
    30,
    50,
    3.1
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f7425d7c-7bec-4f0d-97a0-ab1632aa41e5',
    'WayPoint Inspection Services',
    'waypoint-inspection-services',
    'WayPoint Inspection Services offers property inspection services, including NACA (Neighborhood Assistance Corporation of America) inspections, helping lenders and clients with field data capture and reporting.',
    '["Property Inspection Services"]'::jsonb,
    'https://waypointinspection.com/naca-inspection/',
    27.973409,
    -82.336464,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f7676bb2-2680-4619-b494-fef3ef9b1d4f',
    'ReSource Pro',
    'resource-pro',
    'ReSource Pro provides technology-enabled services and outsourcing solutions for insurance carriers, brokers, and MGAs, supporting underwriting, claims, compliance, and inspection-adjacent workflows.',
    '["Insurance Operations, Outsourcing, Field Services Support"]'::jsonb,
    'https://www.resourcepro.com/',
    40.752293,
    -73.978465,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f7ee6556-98b9-47e2-8f19-2334c5d88372',
    'Reloology',
    'reloology',
    '',
    '["Property Inspection","Field Services"]'::jsonb,
    'http://www.reloology.com',
    40.068516,
    -74.948721,
    false,
    40,
    75,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f81ce845-3801-4f97-b3ec-b6f6cf5e6cb2',
    'Pyramid Platform',
    'pyramid-platform',
    '',
    '["Property Inspection","Appraisal Services","Field Services"]'::jsonb,
    'https://www.pyramidplatform.com/',
    33.670606,
    -117.862036,
    false,
    30,
    55,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f890b82d-210f-461a-8f0e-f44385556106',
    'AOK Home Inspections',
    'aok-home-inspections',
    'AOK Home Inspections offers professional home inspection services in Big LakeMN.',
    '["Field Services"]'::jsonb,
    'https://www.aok-home.com',
    40.690677,
    -73.966527,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f8ca4d4d-f871-45e5-9a81-e5bc9e0e5918',
    'Roofstock',
    'roofstock',
    'Roofstock is an Oakland-based real estate investment marketplace for single-family rental homes, providing property analytics and investment tools.}',
    '["Real Estate Marketplace, Property Investment, Field Verification"]'::jsonb,
    'https://www.roofstock.com/',
    37.81188,
    -122.263859,
    true,
    50,
    125,
    3.3
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f8fdc7b5-d47d-4545-80c3-93f25b2d0edc',
    'AutoClaims Direct',
    'autoclaims-direct',
    'ACD (AutoClaims DirectInc) provides auto claims workflow platform and mobile app for appraiser partners.',
    '["Field Services"]'::jsonb,
    'https://www.acdcorp.com',
    33.144219,
    -117.319439,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f928c1b0-721d-4de5-9f42-b4c66caea5eb',
    'Axis Appraisal Management Solutions',
    'axis-appraisal-management-solutions',
    '',
    '["Property Inspection","Appraisal Services"]'::jsonb,
    'https://www.axis-amc.com',
    37.974053,
    -122.528789,
    false,
    300,
    650,
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'f9eeb030-0d27-4c2d-8193-f9e730bbfb1c',
    'Beagle Labs',
    'beagle-labs',
    'Claims handling and inspection response technology platform designed to streamline daily and catastrophic claim operations for carriers, brokers, and adjusters.',
    '["Insurance Claims Software, Inspection Support"]'::jsonb,
    'https://www.beaglelabs.ai/',
    39.748529,
    -75.547667,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'fa54593c-2f4a-4815-a382-4e2859d0d288',
    'Safeguard Properties Management',
    'safeguard-properties-management',
    'Safeguard Properties Management is a major provider of mortgage field services including property inspections, preservation, REO work and vendor network services.',
    '["Mortgage Field Services, Property Preservation, Inspections"]'::jsonb,
    'https://safeguardproperties.com/',
    41.3607,
    -81.592642,
    true,
    30,
    55,
    2.2
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'face98eb-a02e-4bfd-b62b-586b4d2664cf',
    'National Van Lines',
    'national-van-lines',
    '',
    '["Insurance Inspection","Equipment Inspection","Asset Verification"]'::jsonb,
    'https://www.nationalvanlines.com/',
    41.862677,
    -87.867052,
    false,
    35,
    60,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'fb6f8b08-850e-47c2-874b-32985fe7ee0d',
    'eValuationSolutions',
    'evaluationsolutions',
    'Company name appears in limited mortgage and valuation-related references, but no verified official website, vendor portal, or primary U.S. corporate address could be confirmed.',
    '["Valuation Services"]'::jsonb,
    'https://evaluationsolutions.com',
    45.444345,
    -122.775032,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'fb834409-ac4d-45df-97cd-90d052b901ff',
    'Core Consulting Group',
    'core-consulting-group',
    'Construction consulting and project management firm supporting owners, developers, and lenders with oversight, inspections, and risk management services.',
    '["Construction Consulting, Project Management, Property Assessments"]'::jsonb,
    'https://www.corecongroup.com/',
    32.914049,
    -117.110763,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'fd2bc9fc-077d-4648-9e15-664871c04130',
    'Hancock Claims Consultants',
    'hancock-claims-consultants',
    'Nationwide property claims resolution services specializing in roofing, ladder assist, and inspections.',
    '["Real Estate Inspection","Insurance Inspection","Field Services"]'::jsonb,
    'https://hancockclaims.com',
    34.108669,
    -84.20528,
    false,
    40,
    200,
    2.9
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'fd823fb0-bbea-4418-9883-b1e4d0e5d2a3',
    'Delivery Solutions Of America',
    'delivery-solutions-of-america',
    '',
    '["Insurance Inspection","Property Inspection","Risk Assessment"]'::jsonb,
    'http://www.4dsa.com',
    32.934667,
    -96.917276,
    false,
    15,
    25,
    4.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'fe43acf6-f561-4374-83c7-cde03f0194a0',
    'ISN Corporation',
    'isn-corporation',
    '',
    '["Merchandising Inspection","Property Inspection","Retail Audit"]'::jsonb,
    'http://www.isncorp.com',
    39.027764,
    -77.142984,
    false,
    75,
    300,
    3.6
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'fe8df3bd-a3ff-480c-87f7-e23d03e9775a',
    'SCI Inspection',
    'sci-inspection',
    'SCI Inspection provides insurance underwriting inspections, loss control surveys, risk assessments and related field inspection services for carriers and underwriters.',
    '["Insurance Inspections, Loss Control, Property Risk"]'::jsonb,
    'http://www.sciinspection.com',
    33.877753,
    -117.73109,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'feed7e04-4aa2-43b4-9aa3-0e2df318b54d',
    'EquicheckLLC',
    'equicheckllc',
    'Speed of ServiceQuality and Price are acknowledged by our customers as areas that set us apart from the competition.  
• Standard service means we’ll perform the inspection within 48 hourswith cooperation from the lesseeno matter where it is in the U.S.  
• Flat rate pricing means that for the first hour we have one flat rate price. Period.  
• Flexibility. Present us with the questions or format you needand we will make every effort to create a form for you.',
    '["Field Services"]'::jsonb,
    'http://www.equicheck.com',
    40.86995,
    -73.04735,
    true,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;

INSERT INTO public.firms (
    id, name, slug, description, categories, 
    url, latitude, longitude, is_published,
    pay_min, pay_max, rating
) VALUES (
    'ffa61299-af90-4645-9fc9-cf29336676b0',
    'EXL Service',
    'exl-service',
    'Global analytics and digital solutions company driving business forward with data and AI-driven risk control.',
    '["Insurance Inspection","Property Inspection","Claims Assessment"]'::jsonb,
    'https://www.exlservice.com/industries/insurance/survey-and-risk-control',
    40.757603,
    -73.973994,
    false,
    NULL,
    NULL,
    2.5
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    categories = EXCLUDED.categories,
    is_published = EXCLUDED.is_published,
    pay_min = EXCLUDED.pay_min,
    pay_max = EXCLUDED.pay_max,
    rating = EXCLUDED.rating,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now(),
    url = EXCLUDED.url;
