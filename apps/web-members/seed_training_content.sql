-- Generated Seed Data

    -- Module 1
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES ('3875311c-0a12-4d00-a043-e2184aaaf407', 1, 'Module 1', 'Comprehensive training module.', '📚', 1)
    ON CONFLICT DO NOTHING;
    

            INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
            VALUES (
                '82d4699a-197b-48ba-8c10-cb0c38fa3bda', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                1, 
                'Module Materials', 
                'Please review the attached PDF lesson materials.', 
                'pdf', 
                'https://youtu.be/w_YEUvaZaOg'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '6018223e-a41a-468c-8244-d6185cd11c38', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Lessons 1-6.pdf', 
                'Reference material', 
                '/training/module-1/Lessons 1-6.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'b6919b28-3731-47f0-ba96-1fb1e8ca9108', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'module 1 flashcards - flashcards (2).pdf', 
                'Reference material', 
                '/training/module-1/module 1 flashcards - flashcards (2).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '2e05a753-2b78-454e-82b5-0460fc970788', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Module1_1_Income_Calculator (1).pdf', 
                'Reference material', 
                '/training/module-1/Module1_1_Income_Calculator (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '9f12cd3f-ef58-481d-a214-f9c6eaa36a45', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Module1_2_Career_Transition_Guide (1).pdf', 
                'Reference material', 
                '/training/module-1/Module1_2_Career_Transition_Guide (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'b22df61e-1a9d-48d9-a769-4f395acc6db7', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Module1_3_Terminology_Cheat_Sheet (1).pdf', 
                'Reference material', 
                '/training/module-1/Module1_3_Terminology_Cheat_Sheet (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '19df91c7-1ead-4242-b0de-3e4b97f043b7', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Module1_4_Before_You_Leave_Checklist (1).pdf', 
                'Reference material', 
                '/training/module-1/Module1_4_Before_You_Leave_Checklist (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'bbb627f2-33cf-4321-a875-f3561552a750', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Overview.pdf', 
                'Reference material', 
                '/training/module-1/Overview.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '72ab4366-dcd2-468b-86a3-da644a12fc5c', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Quiz.pdf', 
                'Reference material', 
                '/training/module-1/Quiz.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'e506048b-5e43-4750-85a2-42492d5e59d4', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Resource_ Standards and Protocols for Mortgage Field Inspectors.pdf', 
                'Reference material', 
                '/training/module-1/Resource_ Standards and Protocols for Mortgage Field Inspectors.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '478f25fb-b888-4ad4-92fe-5b7ae2fba83c', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'Scenarios.pdf', 
                'Reference material', 
                '/training/module-1/Scenarios.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '9459054a-6463-4606-890a-14099190c62b', 
                '3875311c-0a12-4d00-a043-e2184aaaf407', 
                'The_Unseen_Inspector.mp4', 
                'Reference material', 
                '/training/module-1/The_Unseen_Inspector.mp4', 
                'mp4'
            );
            

    -- Module 2
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES ('bffcfb09-5665-4c1b-82df-8ae02653facb', 2, 'Module 2', 'Module Overview: Field Kit and Photo Standards Target Audience: New inspectors ready to purchase equipment and take their first photos. The goal of this module is simple: Set up your mobile office and camera settings to eliminate QC rejection and keep you safe. Think of this as helping you pack the ultimate contractor-grade loadout, built for speed, safety, and zero rework.', '📚', 1)
    ON CONFLICT DO NOTHING;
    

        INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
        VALUES (
            '850b633c-f0cb-404b-83d0-5e920052897b', 
            'bffcfb09-5665-4c1b-82df-8ae02653facb', 
            1, 
            'Core Concepts', 
            '<h2><a id="_9eomktkryxkc"></a><strong>Field Kit and Photo Standards: Six Core Lessons</strong></h2><h3><a id="_u97ka2ahzop2"></a><strong>Lesson 1: Pack the Essential Field Kit</strong></h3><table><thead><tr><th><p><strong>Element</strong></p></th><th><p><strong>Description</strong></p></th></tr><tr><th><p><strong>1. Lesson Title</strong></p></th><th><p><strong>Pack</strong> the Contractor-Grade Loadout</p></th></tr><tr><th><p><strong>2. Core Concept</strong></p></th><th><p>Your field kit must prioritize safety, efficiency, and reliability to guarantee zero rework due to equipment failure. Essential gear ensures you can perform accurate measurements and capture clear photos, regardless of weather or property access challenges.</p></th></tr><tr><th><p><strong>3. Step-by-Step Instructions</strong></p></th><th><p>1. Assemble core technology, focusing on power backup. 2. Gather mandatory measurement and lighting tools. 3. Acquire critical safety and professional items (visibility vest, non-slip boots). 4. Organize gear for quick access (the ''Vehicle-to-door quick grab'' rule).</p></th></tr><tr><th><p><strong>4. Real Examples (Autumn''s Gear)</strong></p></th><th><p><strong>Core Tech:</strong> Primary phone with high-quality camera and a high-output power bank (minimum 10,000mAh). <strong>Tools:</strong> Laser measure, tape measure (25-foot minimum), and a small ruler for damage scale. <strong>Safety:</strong> High-visibility vest for construction sites, non-slip work boots, and dog deterrent (where lawful).</p></th></tr><tr><th><p><strong>5. Quick Win</strong></p></th><th><p>Today, purchase a portable power bank (10,000mAh minimum) and a high-visibility vest.</p></th></tr><tr><th><p><strong>6. Warning Signs</strong></p></th><th><p><strong>Dead Rework:</strong> You run out of battery midway through a route, forcing you to return to the site or lose valuable time. <strong>Safety Risk:</strong> Encountering unpredictable environments (like debris or wet surfaces) without non-slip boots or gloves.</p></th></tr></thead></table><h3><a id="_g9pshufkhkzr"></a><strong>Lesson 2: Master Lighting and Framing for Sharp Photos</strong></h3><table><thead><tr><th><p><strong>Element</strong></p></th><th><p><strong>Description</strong></p></th></tr><tr><th><p><strong>1. Lesson Title</strong></p></th><th><p><strong>Master</strong> Context and Clarity in Photography</p></th></tr><tr><th><p><strong>2. Core Concept</strong></p></th><th><p>All submitted photos must be high-quality, sharp, and verifiable, allowing a QC reviewer to identify the location and condition without reading your notes. Achieving this requires consistent framing rules, especially keeping all photos <strong>HORIZONTAL</strong> and ensuring clear focus on the subject.</p></th></tr><tr><th><p><strong>3. Step-by-Step Instructions</strong></p></th><th><p>1. Always capture a <strong>Context shot</strong> first (showing the room or exterior side). 2. Follow with a <strong>Detail shot</strong> (close-up of damage, serial number, etc.). 3. Use available light first; if in dark areas (like basements), use a flash but step back slightly to prevent blown highlights. 4. Ensure all vertical lines in the shot remain vertical, avoiding tilting.</p></th></tr><tr><th><p><strong>4. Real Examples (Autumn''s Scenarios)</strong></p></th><th><p><strong>Lighting:</strong> For dark interiors, Autumn uses a flashlight or headlamp. For exterior address numbers at night, she uses a flashlight to fill the numbers, taking both a wide and tight shot. <strong>Framing:</strong> When photographing damage, she captures a wide wall shot and a close-up with a ruler or tape measure for scale.</p></th></tr><tr><th><p><strong>5. Quick Win</strong></p></th><th><p>Take five photos in a dark area (e.g., a basement corner). Practice using your phone''s flash feature, stepping back slightly to avoid overexposure, and ensure the photo is sharp at 100% zoom.</p></th></tr><tr><th><p><strong>6. Warning Signs</strong></p></th><th><p><strong>Immediate Rejection:</strong> Submission of vertical photos, which are explicitly prohibited. <strong>Data Loss:</strong> Photos are blurry or dark (like the example provided for the interior or a utility meter), making the required data unreadable and unverifiable.</p></th></tr></thead></table><h3><a id="_2cirubnof11d"></a><strong>Lesson 3: Enable Timestamps and GPS Metadata</strong></h3><table><thead><tr><th><p><strong>Element</strong></p></th><th><p><strong>Description</strong></p></th></tr><tr><th><p><strong>1. Lesson Title</strong></p></th><th><p><strong>Validate</strong> Location and Time Metadata</p></th></tr><tr><th><p><strong>2. Core Concept</strong></p></th><th><p>Accurate metadata (time and location) validates when and where the inspection occurred, preventing questions about the authenticity of the fieldwork. While time/date stamps visible <em>on</em> the photo are prohibited for final submission, the underlying metadata must be correct.</p></th></tr><tr><th><p><strong>3. Step-by-Step Instructions</strong></p></th><th><p>1. Ensure your device''s time is set correctly. 2. Verify that Location services (GPS validation) is enabled on your camera settings. 3. Capture the arrival and departure time in your inspection notes if required by the firm. 4. Never use external photo editing tools if the original images are required for specific orders, as this can tamper with metadata.</p></th></tr><tr><th><p><strong>4. Real Examples (Autumn''s Scenarios)</strong></p></th><th><p><strong>Compliance:</strong> Autumn ensures her phone time is accurate before every route. She takes care not to use external editing software because some systems (like EZ Inspections) may restrict photo editing for certain order types. <strong>Prohibited:</strong> She avoids adding visible time/date stamps on the photos themselves, as the standards strictly forbid them.</p></th></tr><tr><th><p><strong>5. Quick Win</strong></p></th><th><p>Check your smartphone settings now to ensure location services are enabled for your primary camera or inspection app, verifying that GPS data will be attached to every image.</p></th></tr><tr><th><p><strong>6. Warning Signs</strong></p></th><th><p><strong>Client Dispute:</strong> If a client or QC reviewer notices inconsistencies between the reported time/location and the image metadata, the entire inspection could be flagged as non-compliant, leading to a rejection or loss of trust.</p></th></tr></thead></table><h3><a id="_xa3vhvd1hfpy"></a><strong>Lesson 4: Organize Files and Backup Workflow</strong></h3><table><thead><tr><th><p><strong>Element</strong></p></th><th><p><strong>Description</strong></p></th></tr><tr><th><p><strong>1. Lesson Title</strong></p></th><th><p><strong>Optimize</strong> File Naming and Data Redundancy</p></th></tr><tr><th><p><strong>2. Core Concept</strong></p></th><th><p>A consistent file naming pattern and a robust backup strategy are essential to quickly find, resubmit, or prove successful upload following app crashes or QC resubmission requests. Organizing files by Order ID simplifies data management.</p></th></tr><tr><th><p><strong>3. Step-by-Step Instructions</strong></p></th><th><p>1. Create one folder per Order ID, including a short address name. 2. Create subfolders for categorization (e.g., 01-Exterior, 03-Damage, 05-UploadProof). 3. Use a consistent filename pattern: ORDERID_ADDRESSCODE_SECTION_SEQUENCE_DESC.jpg. 4. <strong>Backup Strategy:</strong> Ensure photos sync to a cloud album immediately, and copy folders to a second location (external drive or cloud) at the end of the day.</p></th></tr><tr><th><p><strong>4. Real Examples (Autumn''s Workflow)</strong></p></th><th><p><strong>Naming:</strong> Autumn uses a structured naming pattern, such as 123456_742PINE_EXT_01_Front.jpg or 123456_742PINE_DMG_03_RoofMissingShingles.jpg. <strong>Proof:</strong> She always takes a screenshot of the submission confirmation, including the timestamp and job ID, and stores it in the 05-UploadProof subfolder.</p></th></tr><tr><th><p><strong>5. Quick Win</strong></p></th><th><p>Create the standard folder structure on your primary computer today: Order ID folder &gt; 01-Exterior, 02-Interior, 03-Damage, 04-Docs, 05-UploadProof.</p></th></tr><tr><th><p><strong>6. Warning Signs</strong></p></th><th><p><strong>Lost Work:</strong> An app crashes before a successful upload, and because you lack a backup and consistent naming, you must re-visit the site to retake all photos.</p></th></tr></thead></table><h3><a id="_jbdrh8yiohyb"></a><strong>Lesson 5: Recognize Good vs. Bad Photo Examples</strong></h3><table><thead><tr><th><p><strong>Element</strong></p></th><th><p><strong>Description</strong></p></th></tr><tr><th><p><strong>1. Lesson Title</strong></p></th><th><p><strong>Evaluate</strong> Compliance Through Visual Comparison</p></th></tr><tr><th><p><strong>2. Core Concept</strong></p></th><th><p>Successful inspection photography relies on avoiding common visual errors related to clarity, obstruction, and context. Inspectors must be able to visually verify that their photos meet the minimum standards (1024x768 resolution and horizontal orientation) while capturing all necessary evidence.</p></th></tr><tr><th><p><strong>3. Step-by-Step Instructions</strong></p></th><th><p>1. Review all photos for obstructions (fingers, straps, glare). 2. Check address shots: is the number blurry or cropped (Bad Example)? Ensure tight and wide shots are provided. 3. Check damage shots: if only a close-up is taken (Bad Example), immediately retake a wide shot showing the context. 4. Ensure occupancy indicators (cars, furniture, trash cans) are photographed without including people.</p></th></tr><tr><th><p><strong>4. Real Examples (Source Comparison)</strong></p></th><th><p><strong>Damage:</strong> A bad example is showing only a close-up of a crack. A good example provides both a wide wall shot (context) and a close-up of the damage with scale (detail). <strong>Address:</strong> A blurry, obscured number is bad; a tight shot of readable numbers with a wide context shot is good. <strong>Interiors:</strong> A dark, blurry shot is bad; a clear, well-lit corner-to-corner overview is good.</p></th></tr><tr><th><p><strong>5. Quick Win</strong></p></th><th><p>Review five of your last personal photos. Check if they are sharp at 100% zoom, are horizontal, and include no obstructions.</p></th></tr><tr><th><p><strong>6. Warning Signs</strong></p></th><th><p><strong>Rejection Loop:</strong> Consistently submitting photos with poor lighting (Bad Example,) or unreadable meters (Bad Example), resulting in repetitive QC rejections and loss of income.</p></th></tr></thead></table><h3><a id="_7i47qboq47fw"></a><strong>Lesson 6: Troubleshoot Common Photo Rejection Reasons</strong></h3><table><thead><tr><th><p><strong>Element</strong></p></th><th><p><strong>Description</strong></p></th></tr><tr><th><p><strong>1. Lesson Title</strong></p></th><th><p><strong>Troubleshoot</strong> Non-Compliance and Missing Evidence</p></th></tr><tr><th><p><strong>2. Core Concept</strong></p></th><th><p>Rejections usually stem from not adhering to the photo standards (e.g., incorrect format, low resolution, or missing required evidence). The most critical rejection reasons relate to missing mandatory photos (like address or roof close-ups) or unreadable evidence.</p></th></tr><tr><th><p><strong>3. Step-by-Step Instructions</strong></p></th><th><p>1. <strong>Check Format:</strong> Ensure the minimum size (1024x768) is met and confirm the 4:3 ratio setting is used, and no vertical photos are submitted. 2. <strong>Check Content:</strong> Verify all basic photos are present (Front, Back, Left, Right, Close-Up of Roof, Address/House Numbers). 3. <strong>Check Safety:</strong> Confirm that photos of people, private property interiors (through windows), or mailboxes were avoided. 4. <strong>Check Hazards:</strong> If a hazard (e.g., missing rails, debris) was present, ensure both a wide (context) and detail shot were taken.</p></th></tr><tr><th><p><strong>4. Real Examples (Source Rejection Reasons)</strong></p></th><th><p><strong>Missing Requirement:</strong> A frequent rejection is not including required basics like the Address/House Numbers or Close-Up of Roof. <strong>Privacy Breach:</strong> Submitting a photo that includes people or a time/date stamp will lead to rejection. <strong>Unverifiable Occupancy:</strong> Documenting occupied indicators without capturing faces (like cars or porch items) is required; including faces (or photographing cars obscured in a garage) is grounds for rejection.</p></th></tr><tr><th><p><strong>5. Quick Win</strong></p></th><th><p>Using the list of "Basic Photos," list the ten most common photo requirements (e.g., Address, Front, Back, Electric Meter, Close-Up Roof) and ensure you have them on your pre-printed checklist.</p></th></tr><tr><th><p><strong>6. Warning Signs</strong></p></th><th><p><strong>Breach of Conduct:</strong> Photographing inside windows or mailboxes, which constitutes a severe policy violation and will lead to an insured complaint. <strong>Incomplete Case:</strong> Failing to submit a close-up of the roof or the electric meter/mast, resulting in the case being placed on hold until the evidence is provided.</p></th></tr></thead></table>', 
            'text', 
            'https://youtu.be/KtfUM9X5VMg'
        );
        

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '317bd66c-9893-417e-9c2b-711f4ddccfb4', 
                'bffcfb09-5665-4c1b-82df-8ae02653facb', 
                'Boring_and_Legitimate_Property_Inspector_Rules.m4a', 
                'Reference material', 
                '/training/module-2/Boring_and_Legitimate_Property_Inspector_Rules.m4a', 
                'm4a'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '414c8e0b-01ff-43b6-9251-29cd110f59e2', 
                'bffcfb09-5665-4c1b-82df-8ae02653facb', 
                'flashcards.xlsx', 
                'Reference material', 
                '/training/module-2/flashcards.xlsx', 
                'xlsx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '120f682a-c741-426c-98c2-96472cc981f1', 
                'bffcfb09-5665-4c1b-82df-8ae02653facb', 
                'Pre-Inspection Equipment Checklist.docx', 
                'Reference material', 
                '/training/module-2/Pre-Inspection Equipment Checklist.docx', 
                'docx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '1f137a2f-2ae2-415e-b421-9ffbb0687815', 
                'bffcfb09-5665-4c1b-82df-8ae02653facb', 
                'Realistic Scenario_ The Sunset Inspection Failure.docx', 
                'Reference material', 
                '/training/module-2/Realistic Scenario_ The Sunset Inspection Failure.docx', 
                'docx'
            );
            

    -- Module 3
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES ('263e3716-1b13-4dab-a7d5-5a262ac57c12', 3, 'Module 3', 'This module is designed to take you from "gear-ready" to "field-ready." You’ve got your equipment; now it’s time to use it. Doing your first solo inspection can be nerve-wracking, but remember: consistency is your best friend. By following a repeatable flow, you ensure that no detail is missed and every report you submit is "coordinator-proof". 1. Learning Objectives By the end of this module, you will be able to:', '📚', 1)
    ON CONFLICT DO NOTHING;
    

        INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
        VALUES (
            'a2e231bf-7fcf-4a78-a01b-83c4e7ab6054', 
            '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
            1, 
            'Core Concepts', 
            '<p>Welcome to the field! You’ve got the gear, and now it’s time to put it to use. This guide is your "pre-game" playbook to ensure your first solo run is a success. Think of this as a repeatable system—once you master the flow, you can handle any property with confidence.</p><h3><a id="_wx6b7y1vszh2"></a><strong>Lesson 1: Pre-Call Prep and Arrival (The First 5 Minutes)</strong></h3><p><strong>Core Concept:</strong> Success begins before you even start the engine. Validating your order and preparing your tech prevents "dry runs" (trips where you can’t complete the job) and ensures you stay safe.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Verify the Order:</strong> Double-check the address, unit number, and gate codes; confirm the inspection type and due time.</li><li><strong>Confirm Rules:</strong> Check if a "call ahead" is required and verify if you are authorized to enter the property or contact neighbors.</li><li><strong>Tech Check:</strong> Charge your devices, clear storage, and <strong>log in to the portal</strong> while you still have a strong signal.</li><li><strong>Arrival Protocol:</strong> Park for a quick exit and perform a safety scan for hazards like loose dogs or suspicious activity.</li></ol><p><strong>Example from the Sources:</strong> In a typical sample job, the inspector confirms the template requirements (like the ABC number field) and shares their route with an emergency contact before arriving at the property.</p><p><strong>Quick Win:</strong> Today, open your inspection app and confirm your login works. Download any offline templates you might need so you aren''t stuck without data in the field.</p><p><strong>Warning Signs:</strong> Watch out for "No Entry" orders where you might be tempted to knock—always stick to the <strong>entry authorization</strong> specified in your portal to avoid trespassing accusations.</p><h3><a id="_voxreecuf1he"></a><strong>Lesson 2: Execute a Clean Occupancy Inspection</strong></h3><p><strong>Core Concept:</strong> Your goal is to provide neutral, factual evidence of whether a property is occupied. You do this through a consistent "Four-Side Loop" that captures the entire exterior.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Identity Proof:</strong> Capture a tight shot of the house number followed by a wide shot showing the address in context with the front façade.</li><li><strong>The Four-Side Loop:</strong> Walk the property in a consistent flow (Front → Right → Rear → Left), capturing full wall lengths, rooflines, and outbuildings.</li><li><strong>Utility Check:</strong> Photograph all utility meters (electric, gas, water) to show if they are active or have been pulled.</li><li><strong>Look for Indicators:</strong> Document neutral signs like car presence, trash service activity, or accumulated mail/notices.</li></ol><p><strong>Example from the Sources:</strong> If a loose dog prevents you from completing the loop, document it from a distance. Use neutral notes like "Accumulated flyers at entry" or "No visible personal property through windows" rather than guessing the property is "abandoned."</p><p><strong>Quick Win:</strong> Practice your "Four-Side Loop" at your own home today. See if you can capture all four sides and your utility meters in under five minutes.</p><p><strong>Warning Signs:</strong> Avoid "Occupancy Guessing." Never mark a property as vacant without specific photo support, such as broken windows or an overgrown lawn.</p><h3><a id="_54tvb1jwng4r"></a><strong>Lesson 3: Handle Interior Authorized Inspections</strong></h3><p><strong>Core Concept:</strong> When entry is authorized, your mission is to document the condition of every room using a logical flow and accurate measurements. Consistency in your tools and units is key to preventing disputes.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Room Overview:</strong> Take at least one wide-angle overview shot of every room (living areas, bedrooms, kitchen).</li><li><strong>Maintain Measurement Integrity:</strong> Use the <strong>same tool</strong> (laser or tape) throughout the job and measure wall-to-wall at floor level.</li><li><strong>Document Defects:</strong> If you see damage, take a context shot first, then a close-up of the detail.</li><li><strong>Mechanicals:</strong> Capture the main electrical panel and other mechanical areas if required by the spec.</li></ol><p><strong>Example from the Sources:</strong> If you are measuring for a dispute, capture a photo that includes the <strong>tool display</strong> showing the measurement to make the data indisputable.</p><p><strong>Quick Win:</strong> Pick one room in your house and measure it at floor level. Practice labeling the measurement (e.g., "North Wall - 12'' 6''''") so you don''t forget which wall is which later.</p><p><strong>Warning Signs:</strong> Never mix measurement units (like switching between feet/inches and decimal feet) or measure diagonals instead of straight walls.</p><h3><a id="_1m1c8fda34vq"></a><strong>Lesson 4: Document Loss Draft and Repair Progress</strong></h3><p><strong>Core Concept:</strong> Loss draft inspections focus on the progress of repairs after a claim. You must distinguish between materials sitting on-site and work that has actually been installed.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Quantify Damage:</strong> Document the dimensions of holes, missing drywall, or missing shingles.</li><li><strong>Identify Materials:</strong> Take photos of materials delivered to the site (like stacks of drywall or flooring).</li><li><strong>Verify Quality:</strong> Capture "work quality indicators" to show that repairs are being done professionally.</li><li><strong>Before/After:</strong> If possible, provide photos that show the current state of a previously documented defect.</li></ol><p><strong>Example from the Sources:</strong> When documenting repairs, take a "detail close-up with a scale reference" (like a ruler or a coin) to show the exact size of the repair or remaining damage.</p><p><strong>Quick Win:</strong> Practice taking a "context then detail" photo set of a small repair or item in your home to ensure both the location and the detail are clear.</p><p><strong>Warning Signs:</strong> Don''t just take a close-up of a repair; without a <strong>wide context shot</strong>, the coordinator won''t know which room the photo belongs to.</p><h3><a id="_63dwll2v3f7q"></a><strong>Lesson 5: Upload Photos that Pass First Review</strong></h3><p><strong>Core Concept:</strong> A "coordinator-proof" submission is organized, labeled, and complete. Your goal is to make it so the reviewer doesn''t have to hunt for information or call you back.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Gallery Scan:</strong> Before leaving the site, scan your photos for blur, darkness, or missing required shots.</li><li><strong>Template Order:</strong> Upload photos in the exact order requested by the portal—do not make the coordinator search for the address shot.</li><li><strong>Caption Everything:</strong> Use standardized captions and ensure all mandatory fields (like the ABC number) are filled.</li><li><strong>Submission Proof:</strong> <strong>Always</strong> take a screenshot of the "Submission Successful" screen with the Job ID and timestamp.</li></ol><p><strong>Example from the Sources:</strong> In the sample job walkthrough, the inspector encountered an app failure. They screenshotted the error, retried on a hotspot, and saved the final confirmation screenshot as insurance.</p><p><strong>Quick Win:</strong> Create a "Job Proof" folder on your phone or computer where you can store your confirmation screenshots for every job you complete.</p><p><strong>Warning Signs:</strong> Leaving required fields blank is the number one way to get a rejection. If you can''t provide data (e.g., a dog prevented access), explain <strong>why</strong> in the notes.</p><h3><a id="_t78ans33w6rs"></a><strong>Lesson 6: Respond to Rejections Like a Pro</strong></h3><p><strong>Core Concept:</strong> Rejections are part of the learning curve. Professionalism means responding quickly, documenting why a photo might be missing, and providing a clear "Revision Version" note.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Identify the Gap:</strong> Review the coordinator''s notes to see exactly what is missing (e.g., "missing rear photo" or "blurry address").</li><li><strong>Reference Your Proof:</strong> Check your confirmation screenshots or error logs if the rejection seems like a technical glitch.</li><li><strong>Provide context:</strong> If a photo is impossible to get (e.g., a "Beware of Dog" sign or a locked gate), explain the barrier clearly in the resubmission.</li><li><strong>Resubmit with Notes:</strong> Tag your update as a "Revision" and note exactly what was fixed.</li></ol><p><strong>Example from the Sources:</strong> If a dispute happens regarding occupancy, point back to your neutral indicators like "accumulated flyers" or "utilities present" to support your original finding.</p><p><strong>Quick Win:</strong> Review the list of "Where disputes usually happen" (Address mismatch, missing side photos, unsupported occupancy) so you can double-check these items before hitting "Submit" on your first real job.</p><p><strong>Warning Signs:</strong> Avoid getting defensive. If a coordinator asks for a redo, treat it as a chance to secure your spot on their "preferred" list by being the inspector who fixes things the fastest.</p><p><strong>Analogy for Success:</strong> Think of these lessons like a <strong>pre-flight checklist</strong> for a pilot. You don''t just jump in and fly; you check the fuel (tech prep), walk around the plane (four-side loop), and log the flight (upload proof). If you follow the checklist every time, you’ll have a smooth landing every time.</p>', 
            'text', 
            'https://youtu.be/22oUdcEApi0'
        );
        

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '33b6ae02-0283-48b9-86a5-0eab04b8ef16', 
                '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
                'Dodging_Dogs_and_Verifying_Electricity_Codes.m4a', 
                'Reference material', 
                '/training/module-3/Dodging_Dogs_and_Verifying_Electricity_Codes.m4a', 
                'm4a'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'ecc9e57a-0620-48cb-a18b-381f0c743a21', 
                '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
                'flashcards (1).xlsx', 
                'Reference material', 
                '/training/module-3/flashcards (1).xlsx', 
                'xlsx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'a2668aa4-9dfa-4471-86ce-63621aae5655', 
                '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
                'Module3_1_PreInspection_Checklist.pdf', 
                'Reference material', 
                '/training/module-3/Module3_1_PreInspection_Checklist.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'e567d603-d456-4343-833c-7107af6a050b', 
                '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
                'Module3_2_Occupancy_Quick_Reference.pdf', 
                'Reference material', 
                '/training/module-3/Module3_2_Occupancy_Quick_Reference.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '5f64ef2e-75f6-4da6-8c93-2b49589dca51', 
                '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
                'Module3_3_LossDraft_Quick_Reference.pdf', 
                'Reference material', 
                '/training/module-3/Module3_3_LossDraft_Quick_Reference.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '29d622ce-386d-4f84-94f5-79c5b20762ea', 
                '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
                'Module3_4_Upload_DoubleCheck_List.pdf', 
                'Reference material', 
                '/training/module-3/Module3_4_Upload_DoubleCheck_List.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '6e03d624-0403-4613-abcd-84959bb82eaa', 
                '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
                'Scenario_Case Study.docx', 
                'Reference material', 
                '/training/module-3/Scenario_Case Study.docx', 
                'docx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '300ef593-7b7d-4f02-bb0d-b8d7cbecedf9', 
                '263e3716-1b13-4dab-a7d5-5a262ac57c12', 
                '_Quiz Questions.docx', 
                'Reference material', 
                '/training/module-3/_Quiz Questions.docx', 
                'docx'
            );
            

    -- Module 4
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES ('2a311104-2e60-4b63-aabd-459e5f0fb4aa', 4, 'Module 4', 'Comprehensive training module.', '📚', 1)
    ON CONFLICT DO NOTHING;
    

        INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
        VALUES (
            'fc611f43-c425-4f5d-8da9-44a292aa3f3b', 
            '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
            1, 
            'Core Concepts', 
            '<p>Lessons<br /><br /><strong>Lesson 1: Write Objective, Factual Notes</strong></p><p><strong>Core Concept:</strong> Inspectors must serve as the "eyes and ears" for the client, providing raw, neutral data rather than personal opinions or neighborhood comparisons. Effective reporting uses absolute definitions from standardized scales (like UAD C1–C6) to ensure the data informing the "Language of Lending" remains precise.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Structure your narrative</strong> using a standard flow: Arrival/Time &gt; Address Verification &gt; Scope &gt; Entry Status &gt; Occupancy Indicators &gt; Condition &gt; Hazards &gt; Departure.</li><li><strong>Replace subjective adjectives</strong> (e.g., "beautiful," "bad") with specific, observed facts (e.g., "new LED lighting installed," "missing downspout at rear").</li><li><strong>Use absolute definitions</strong> for condition ratings; do not rate a property based on how it compares to neighbors, but how it fits the literal definition of the scale.</li></ol><p><strong>Examples from the Sources:</strong></p><ul><li><strong>Gold Standard:</strong> "Arrived 08:41. Address verified. Completed required exterior photo set. No response after two knocks. Utilities meter present. Condition: exterior wear moderate. Hazards: none observed. Departed 08:58".</li><li><strong>Unacceptable:</strong> "Lighting upgrades are complete" (Too vague).</li><li><strong>Acceptable:</strong> "All in-unit lighting upgraded to LED lamps... wall sconces on all interior hallways and parking lot lighting were observed".</li></ul><p><strong>Quick Win:</strong> Take a subjective note you recently wrote (e.g., "The roof looks old") and rewrite it as a factual observation (e.g., "Observed roof wear and minor ponding at the rear of the structure").</p><p><strong>Warning Signs:</strong> Neighborhood comparisons or relative ratings (e.g., "nicer than most houses on this block") can lead to rejection as "comparison to neighborhood" was removed from modern forms due to Fair Lending concerns.</p><h3><a id="_7sg5zmbkjaep"></a><strong>Lesson 2: Execute the 10-Minute Pre-Submit Ritual</strong></h3><p><strong>Core Concept:</strong> Standardization is a "strategic necessity" that lowers per-loan costs by reducing manual errors. Technical errors—like improper file formats or renaming Excel tabs—cause automatic system rejections, adding unnecessary friction to the coordinator’s workflow.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Verify technical specs:</strong> Ensure photos are in JPG format, 640x480 resolution, and contain mandatory red-font date/timestamps in the lower right corner.</li><li><strong>Check "Yellow Cells":</strong> In the Annual Inspection Form (AIF), ensure all required yellow input cells have changed color, indicating data entry is complete.</li><li><strong>Enforce the "No-Rename" Rule:</strong> Never delete or rename tabs in the Excel workbook, as this causes the Property Reporting System (PRS) to automatically reject the file.</li></ol><p><strong>Examples from the Sources:</strong></p><ul><li><strong>Technical Spec Fail:</strong> A submission with a GPS warning in the portal requires location services to be enabled and the photo retaken.</li><li><strong>Reconcile Data:</strong> Check that the "Total Units" on the General Info tab matches the unit breakdown on the Multifamily tab.</li></ul><p><strong>Quick Win:</strong> Use the built-in "Spell Check Macro" on the Tools tab of your report template to catch typos before the coordinator sees them.</p><p><strong>Warning Signs:</strong> "Yellow cells" remaining in the workbook or a mismatched unit count in the reconciliation tracker.</p><h3><a id="_pg3v1wy9b6h9"></a><strong>Lesson 3: Match Notes to Photos</strong></h3><p><strong>Core Concept:</strong> Digital Trust is built on the consistency between written claims and visual evidence. Contradictions—such as noting "no life safety hazards" while uploading a photo of an unsecured pool gate—undermine the entire report’s credibility.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Implement the "Two-Photo Rule" for defects:</strong> Capture one wide-angle "context" shot showing the area/elevation and one "detail" shot with a scale reference.</li><li><strong>Cross-reference the DM Grid:</strong> Ensure every item in your "Deferred Maintenance" list is linked to a specific photo number.</li><li><strong>Use "ID Photos":</strong> Always make your first photo an overview of the building and its address signage to establish a clear audit trail.</li></ol><p><strong>Examples from the Sources:</strong></p><ul><li><strong>Rejection Example:</strong> "Damage not documented - Need roof angle too" (This indicates the inspector provided a close-up without the necessary context).</li><li><strong>Corrective Action:</strong> Provide an overview photograph of the room or elevation before providing specific "damage or lack of damage" shots.</li></ul><p><strong>Quick Win:</strong> Label a specific photo in your next report using the format: "Stained ceiling tiles at the northwest corner of unit B" rather than just "ceiling stain".</p><p><strong>Warning Signs:</strong> Providing only close-up photos of damage without showing where the issue is located on the property.</p><h3><a id="_yusw7fwhw72m"></a><strong>Lesson 4: Handle Rejections Professionally</strong></h3><p><strong>Core Concept:</strong> High-stakes lending relies on 24- to 48-hour turnarounds. A professional responder views a revision request as a performance benchmark and an opportunity to refine personal "Prevention Rules" to ensure long-term job flow.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Log every rejection</strong> in a personal Revision Tracker, documenting the firm, the request, and the root cause.</li><li><strong>Adopt a "Prevention Rule"</strong> for every mistake (e.g., "Always shoot tight+wide address") to ensure the same error never reaches a coordinator twice.</li><li><strong>Acknowledge and fix immediately:</strong> Speed in revisions is essential to prevent "jumpy" buyers from pulling out of a deal.</li></ol><p><strong>Examples from the Sources:</strong></p><ul><li><strong>Revision Tracker Entry:</strong> Order 123456 | Request: "Missing rear photo" | Fix: Added correct angle | Prevention Rule: "Always shoot 4 sides complete".</li><li><strong>Outcome:</strong> Status changes from "Revised" to "Approved" instantly when technical rules are followed.</li></ul><p><strong>Quick Win:</strong> Review your last three rejected orders and write down one "Prevention Rule" for each to add to your pre-submit checklist.</p><p><strong>Warning Signs:</strong> Arguing with technical requirements or providing "hasty, over-priced" explanations rather than fixing the underlying data error.</p><h3><a id="_n9293li5y5oy"></a><strong>Lesson 5: Communicate with Coordinators Effectively</strong></h3><p><strong>Core Concept:</strong> Effective communication is "Short. Professional. Timestamped. No drama". In an ecosystem governed by privacy laws like the GLBA, inspectors must also maintain professional boundaries, never discussing loan status with unauthorized parties.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Use standardized scripts</strong> for common issues like Status Checks, Access Denials, or Portal Failures to keep communications clear and factual.</li><li><strong>Escalate safety or access issues immediately:</strong> If an area is unsafe (e.g., a crawlspace) or access is blocked, upload photos of the barrier and contact the coordinator for guidance.</li><li><strong>Document technical failures:</strong> If a portal fails, capture a screenshot of the error message and include it in your timestamped escalation email.</li></ol><p><strong>Examples from the Sources:</strong></p><ul><li><strong>Access Denial Script:</strong> "On [DATE/TIME] I arrived at [Address]. Access was blocked by [barrier]. Entry was not attempted per policy. Photos and timestamped notes are uploaded. Please advise next steps".</li><li><strong>Professional Boundary:</strong> Never tell a neighbor the property is in foreclosure; strictly follow the "nonaffiliated third party" privacy guidelines.</li></ul><p><strong>Quick Win:</strong> Save the "Status Check" and "Access Denied" email scripts into your phone’s notes app for instant use in the field.</p><p><strong>Warning Signs:</strong> Lengthy, emotional emails or failing to notify the mortgagee promptly of safety issues that prevent a complete observation.</p>', 
            'text', 
            'https://youtu.be/REoW8dINYoI'
        );
        

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'bcc11993-83ac-4140-9046-c42724437607', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'flashcards _2_.pdf', 
                'Reference material', 
                '/training/module-4/flashcards _2_.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'fc543293-d84c-4c10-a567-bfba437551b5', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'Hidden_Risk_Industrial_Standards_and_Mortgage_Data.m4a', 
                'Reference material', 
                '/training/module-4/Hidden_Risk_Industrial_Standards_and_Mortgage_Data.m4a', 
                'm4a'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '95cbb6a0-aef7-4506-bcf7-b1fa4477cd45', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'Learning Objectives_ .docx', 
                'Reference material', 
                '/training/module-4/Learning Objectives_ .docx', 
                'docx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'c4095d8b-6e3c-4b76-944e-94b66c97a82d', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'Module4_1_Report_Writing_Cheat_Sheet.pdf', 
                'Reference material', 
                '/training/module-4/Module4_1_Report_Writing_Cheat_Sheet.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '3f25067b-bf9e-41fe-8389-37c1cc1fcd53', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'Module4_2_PreSubmit_Ritual_Card.pdf', 
                'Reference material', 
                '/training/module-4/Module4_2_PreSubmit_Ritual_Card.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '7fa3e492-f019-4873-b267-0071f5a0812c', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'Module4_3_Rejection_Response_Template.pdf', 
                'Reference material', 
                '/training/module-4/Module4_3_Rejection_Response_Template.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '9576e375-2833-4e91-84e3-98ca4479f7e3', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'Module4_4_Coordinator_Communication_Guide.pdf', 
                'Reference material', 
                '/training/module-4/Module4_4_Coordinator_Communication_Guide.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '45eaaaba-790f-441d-a8b3-128910c78fca', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'Quiz.docx', 
                'Reference material', 
                '/training/module-4/Quiz.docx', 
                'docx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '5a8e5a95-14d1-4dba-bcde-5fd67aebef2b', 
                '2a311104-2e60-4b63-aabd-459e5f0fb4aa', 
                'Scenarios.docx', 
                'Reference material', 
                '/training/module-4/Scenarios.docx', 
                'docx'
            );
            

    -- Module 5
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES ('a84e3005-4f73-4cc7-892a-155951d5f184', 5, 'Module 5', 'This module provides the final 40% of the skills you need to turn your current background into a high-income field inspection business. In this business, you are the "eyes and ears" for lenders, and your primary duty is to document facts without ever overstepping into diagnosis or assessment. This module focuses on the high-stakes scenarios where your ability to identify hazards and handle human conflict determines your safety and your pay. 1. Learning Objectives per Audience Segment Existing Field Inspectors: Master the "Installed vs. Delivered" rule to mitigate fraud and ensure your reports meet the highest integrity standards required by the Nested Objects firm network.', '📚', 1)
    ON CONFLICT DO NOTHING;
    

        INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
        VALUES (
            '10b8be01-27b2-4c2d-a868-b0a486d7ab7e', 
            'a84e3005-4f73-4cc7-892a-155951d5f184', 
            1, 
            'Core Concepts', 
            '<p>This module prepares you to handle high-stakes human interactions and environmental hazards that can stall your progress toward $300–500/day. You already have 60% of the skills from your experience in notary work, real estate, or the gig economy; we are teaching you the final 40% to protect your income and safety.</p><h3><a id="_l65v5u47roaw"></a><strong>Lesson 1: Recognizing Immediate Safety Threats</strong></h3><p><strong>Core Concept:</strong> Your primary authority is the decision of personal safety: "Is it safe for ME to enter?". You are not a habitability expert; you are an observer of facts.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Conduct a Perimeter Sweep:</strong> Before exiting your vehicle, scan for "Beware of Dog" signs, drug paraphernalia, or unusual security measures.</li><li><strong>Identify Behavioral Zones:</strong> Categorize the environment into Green (Baseline), Yellow (Concerning), or Red (Imminent).</li><li><strong>Execute the "Probe" Method:</strong> Use a stick or tool to probe tall grass for snakes or hidden hazards before stepping.</li><li><strong>Confirm Ignition Safety:</strong> If you smell "rotten eggs" (mercaptan), do not touch any electrical switch, phone, or flashlight.</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Notaries:</strong> Just as you verify an ID, you are verifying the safety of the "signing room" (the property). If the environment is hostile, the transaction stops.</li><li><strong>Realtors:</strong> This is a perimeter sweep you already do for showings, but here, the data is for a lender, not a buyer.</li></ul><p><strong>Quick Win:</strong> Keep your vehicle running and pointed toward the exit for a three-second departure if a Red flag appears.</p><p><strong>Warning Signs:</strong></p><ul><li><strong>Red Flag (Exit Immediately):</strong> Clenched fists, verbal threats, or a <strong>gun visible in an occupant''s waistband</strong>.</li><li><strong>Biological Flag:</strong> A "beeline" of insects flying toward a wall cavity—indicates an active swarm.</li><li><strong>Meth Flag:</strong> Windows blackened or covered in foil with a strong smell of "cat urine" or ammonia.</li></ul><h3><a id="_vu1npr9p4itl"></a><strong>Lesson 2: De-escalating Aggressive Occupants</strong></h3><p><strong>Core Concept:</strong> Use purposeful actions to move an individual from the emotional "right brain" back to the rational "left brain" to complete your 15-minute job without conflict.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Maintain Physical Stance:</strong> Stand 4–6 feet away, positioned off to the side (not directly in front), with hands visible and open.</li><li><strong>Acknowledge Without Agreeing:</strong> Use the phrase, "I realize this situation is frustrating".</li><li><strong>Frame the Identity:</strong> State clearly: "I am here to provide a property condition update for the lender''s records".</li><li><strong>Strategic Silence:</strong> Allow the occupant to vent for 30 seconds without interruption to lower their "temperature".</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Gig Workers:</strong> This is similar to a difficult delivery drop-off. Keep it professional, document the interaction, and move to the next high-paying job.</li><li><strong>Existing Inspectors:</strong> Refresh your script to avoid "debt talk" which triggers hostility.</li></ul><p><strong>Quick Win:</strong> If an occupant is uncooperative, offer a choice: "Would you prefer I take the exterior photos first while you wait inside?".</p><p><strong>Warning Signs:</strong></p><ul><li><strong>Squatter Encounter:</strong> A person who refuses to identify themselves but is living in a property marked as "Vacant".</li><li><strong>Agitation Flags:</strong> Pacing, heavy breathing, or a flushed complexion.</li></ul><h3><a id="_9tjm1xetwqw6"></a><strong>Lesson 3: Handling Sensitive Bankruptcy and No-Contact Orders</strong></h3><p><strong>Core Concept:</strong> High-paying $100–150 jobs often involve legal sensitivities where any contact could violate a court order.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Review Work Order Tags:</strong> Look for "No-Contact" or "Legal/Bankruptcy" status before starting.</li><li><strong>Street-Side Documentation:</strong> Take all required photos from the sidewalk or street using a zoom lens if necessary.</li><li><strong>Verify Occupancy Silently:</strong> Look for "silent indicators" like curtains, mowed lawns, or porch lights instead of knocking.</li><li><strong>No Door Hangers:</strong> Do not leave cards or envelopes unless the work order explicitly commands it for that specific date.</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Notaries:</strong> This is the property equivalent of a "Confidentiality Agreement." Follow the instructions strictly to maintain your vetted status.</li><li><strong>Realtors:</strong> Think of this as a "Pocket Listing." Minimal visibility is the goal.</li></ul><p><strong>Quick Win:</strong> If you see someone in the yard of a No-Contact property, document "Person present, no contact made per instructions," and leave.</p><p><strong>Warning Signs:</strong></p><ul><li><strong>Police Presence:</strong> If the <strong>police are called on you</strong> while observing from the street, remain calm and present your ID badge and work order.</li></ul><h3><a id="_en2yrm6fjaub"></a><strong>Lesson 4: Documenting Refusals and Hostile Neighbors</strong></h3><p><strong>Core Concept:</strong> A refusal is still a completed job. Objective documentation ensures you get paid even if you can’t get on the grass.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Initiate the "OHNO" Framework:</strong> Observe, initiate a Hello, navigate the risk, and obtain help if needed.</li><li><strong>Document Verbal Refusals Verbatim:</strong> Record the exact words of a hostile neighbor or occupant.</li><li><strong>Capture Environmental Context:</strong> If you cannot photograph the house, photograph the "Street Sign" and the "Refusal Location" to prove you were on-site.</li><li><strong>Avoid Personal Opinions:</strong> Use objective language only. Do not say "Neighbor was crazy"; say "Neighbor yelled and gestured for me to leave".</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Gig Workers:</strong> A refusal is a "Delivery Attempted" status. You still put in the miles and time; ensure your report reflects the facts so the fee is processed.</li><li><strong>Realtors:</strong> You know neighbors can be protective. Use your local rapport but maintain the lender''s legal boundary.</li></ul><p><strong>Quick Win:</strong> If a neighbor follows you, drive to a nearby public parking lot before completing your data entry in the InspectorADE app.</p><p><strong>Warning Signs:</strong></p><ul><li><strong>Occupant blocks your vehicle</strong> in the driveway. This is an immediate trigger to contact your coordinator.</li></ul><h3><a id="_5qsctvk8772o"></a><strong>Lesson 5: The "Exit and Report" Protocol</strong></h3><p><strong>Core Concept:</strong> Your role is the "eyes and ears" for the client, not a hero or a problem-solver. Knowing when to leave is as vital as knowing how to inspect.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>The 3-Second Rule:</strong> If you feel your pulse rise or see a Red Flag, you have 3 seconds to reach your vehicle and lock the doors.</li><li><strong>Exit First, Call Second:</strong> Do not call your coordinator from the front porch of a hostile site.</li><li><strong>Formalize the Incident:</strong> Complete an incident report using the "5 Ws" (Who, What, Where, When, Why).</li><li><strong>Notify the Coordinator:</strong> Once safe, call your Account Manager to describe the hazard (e.g., "Active <strong>dog attack</strong> prevented entry" or "Structural ridgeline sagging 2 feet").</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Existing Inspectors:</strong> Avoid "Gold Plating"—don''t try to fix a situation to get the photos. If it''s unsafe, it''s a "Hazard Refusal".</li><li><strong>Notaries:</strong> This is the same as a "Refusal to Sign." Document the reason and close the file.</li></ul><p><strong>Quick Win:</strong> Flag the property in your personal notes so you remember to approach with caution if the client sends you back next month.</p><p><strong>Warning Signs:</strong></p><ul><li><strong>Booby Traps:</strong> Unnatural ground features (e.g., a pile of leaves in a clear yard) or trip wires across a path.</li><li><strong>Imminent Hazard:</strong> An audible "hissing" near a gas meter or a pool of septic waste in the yard.</li></ul>', 
            'text', 
            'https://youtu.be/B6gCrwPaLyk'
        );
        

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '64ccb9d1-797c-4712-9001-60984f142e54', 
                'a84e3005-4f73-4cc7-892a-155951d5f184', 
                'Beyond the Crash_ 4 Surprising Details from a Fatal Highway Accident That Reveal a Broken System (1).pdf', 
                'Reference material', 
                '/training/module-5/Beyond the Crash_ 4 Surprising Details from a Fatal Highway Accident That Reveal a Broken System (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'bf2d1db0-573d-4476-a946-495c721193bd', 
                'a84e3005-4f73-4cc7-892a-155951d5f184', 
                'flashcards (5).xlsx', 
                'Reference material', 
                '/training/module-5/flashcards (5).xlsx', 
                'xlsx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'c6d07d8b-d441-49ba-b59c-92b02390d550', 
                'a84e3005-4f73-4cc7-892a-155951d5f184', 
                'Module5_1_Threat_Recognition_Matrix (2).pdf', 
                'Reference material', 
                '/training/module-5/Module5_1_Threat_Recognition_Matrix (2).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '2f06f0c9-7039-45cd-a60f-144348c2a9a7', 
                'a84e3005-4f73-4cc7-892a-155951d5f184', 
                'Module5_2_Deescalation_Script_Library (2).pdf', 
                'Reference material', 
                '/training/module-5/Module5_2_Deescalation_Script_Library (2).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '32dc04ec-4985-4cb3-948e-eee36cd16104', 
                'a84e3005-4f73-4cc7-892a-155951d5f184', 
                'Module5_3_Refusal_Documentation_Template (2).pdf', 
                'Reference material', 
                '/training/module-5/Module5_3_Refusal_Documentation_Template (2).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '010afc2f-d095-4b08-8322-0b3fbe15a27c', 
                'a84e3005-4f73-4cc7-892a-155951d5f184', 
                'Module5_4_Legal_Boundary_Reference (2).pdf', 
                'Reference material', 
                '/training/module-5/Module5_4_Legal_Boundary_Reference (2).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '8657976e-5db8-4217-94f1-3d042f39708c', 
                'a84e3005-4f73-4cc7-892a-155951d5f184', 
                'Module5_Deep_Research_Safety_Protocols_Deescalation (1).pdf', 
                'Reference material', 
                '/training/module-5/Module5_Deep_Research_Safety_Protocols_Deescalation (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '820db7e6-a4b5-49a7-89ed-e35548a3f440', 
                'a84e3005-4f73-4cc7-892a-155951d5f184', 
                'Quiz.docx', 
                'Reference material', 
                '/training/module-5/Quiz.docx', 
                'docx'
            );
            

    -- Module 6
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES ('1a40623b-71be-4a69-9aa1-372eb9f7597e', 6, 'Module 6', 'Module 6: The Augmented Field Inspector – AI Tools for Field Services This module is your fast-track to mastering the technology that turns a standard inspector into a high-volume income generator. You already have 60% of the skills (driving, phone, customer service); we are teaching you the other 40%—the AI-powered tools that allow you to complete more jobs per day with zero rejections. 1. Learning Objectives per Audience Segment', '📚', 1)
    ON CONFLICT DO NOTHING;
    

        INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
        VALUES (
            'e451dfe7-d718-4766-8435-ac8e5f5c5c89', 
            '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
            1, 
            'Core Concepts', 
            '<h3><a id="_kz073pyc9gez"></a><strong>Module 6: The AI-Augmented Inspector — Accelerating Your Income</strong></h3><p>The mortgage field services industry is transitioning from legacy paper-based processes to mobile-first, AI-driven platforms. As a field inspector, AI is your sophisticated documentation assistant, designed to enhance your efficiency and accuracy without expanding your professional scope. By mastering these tools, you can move from a reactive "firefighting" mindset to a proactive, high-earning operation.</p><p><strong>The ROI of AI:</strong> A traditional inspector often spends 45 minutes typing a report after a 30-minute site visit. With AI voice notes and NLP report generation, that same report is completed in 5 minutes. This allows for 2-3 additional jobs per day, translating to <strong>$100-150 in extra daily revenue</strong>.</p><h4><a id="_l2en8xc3lkk6"></a><strong>Lesson 1: AI-Powered Report Generation and Objective Language Refinement</strong></h4><p><strong>Core Concept:</strong> Transforming fragmented field notes into high-fidelity, objective reports required by financial institutions using Natural Language Processing (NLP).</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Input Data:</strong> Upload raw observations or voice memos into your AI-integrated report writer.</li><li><strong>Review Suggestions:</strong> The AI identifies issues like wear or moisture and suggests pre-written, standardized comments.</li><li><strong>Verify and Edit:</strong> Accept the comment as-is or adjust it to ensure it perfectly matches the on-site reality.</li><li><strong>Finalize:</strong> Click to add refined comments directly into the report template.</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Notaries:</strong> Use your eye for detail to verify that the AI’s "drafted" property narrative matches your physical observations.</li><li><strong>Realtors:</strong> Shift from "selling a home" language to "lender-ready" objective language instantly.</li></ul><p><strong>Quick Win:</strong> Use an "Image Defect Detector" to automatically generate descriptions for common issues like roof wear or foundation cracks, saving 15 minutes of typing per report.</p><p><strong>Critical AI Limitations &amp; Warnings:</strong></p><ul><li><strong>Hallucination Risk:</strong> AI may generate plausible-sounding but false facts; always review AI-generated reports against on-site observations.</li><li><strong>Scope Limitation:</strong> AI might suggest a "repair recommendation." <strong>Never</strong> include this. Your role is objective documentation only.</li></ul><h4><a id="_slkx3aecy5wk"></a><strong>Lesson 2: Photo Quality Analysis and Computer Vision Validation</strong></h4><p><strong>Core Concept:</strong> Using real-time computer vision to validate image clarity, framing, and lighting before you leave the property, eliminating costly re-trips.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Capture:</strong> Take required photos (front, address, street sign) through the InspectorADE app.</li><li><strong>Automated Check:</strong> The AI analyzes the "Blur Score" and "Brightness Score" instantly.</li><li><strong>Immediate Correction:</strong> If an image is flagged as blurry or underexposed, the app prompts an immediate retake.</li><li><strong>Geospatial Verification:</strong> The system confirms the photo GPS metadata matches the subject property address.</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Gig Workers:</strong> Treat this like a high-stakes delivery photo. The AI ensures your "proof of work" is incontestable.</li><li><strong>Existing Inspectors:</strong> Reduce your "returned report" rate to near zero by letting AI catch fingers in the frame or blurry rooflines.</li></ul><p><strong>Quick Win:</strong> Enable "Live Feedback" in your app to receive an instant alert if your front-of-house shot is missing the roofline.</p><p><strong>Critical AI Limitations &amp; Warnings:</strong></p><ul><li><strong>Lighting Sensitivity:</strong> Poor lighting or reflections can confuse AI algorithms, leading to false-positive defect detections.</li><li><strong>Black-Box Logic:</strong> The reasoning behind an AI "flag" may not be clear; use it for visual grounding but provide the final judgment yourself.</li></ul><h4><a id="_k5xkblkt5lua"></a><strong>Lesson 3: Voice-to-Text and Hands-Free Field Documentation</strong></h4><p><strong>Core Concept:</strong> Utilizing Natural Language Understanding (NLU) to fill inspection fields through speech, allowing you to document safely while navigating ladders or crawlspaces.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Activate:</strong> Tap the microphone icon within the field note screen.</li><li><strong>Dictate Naturally:</strong> Speak your observations (e.g., "Standing water in basement, tag as plumbing, due Friday").</li><li><strong>Smart Mapping:</strong> The AI interprets your "intent" and populates the ''Status,'' ''Tag,'' and ''Description'' fields automatically.</li><li><strong>Confirm:</strong> Review the auto-filled fields for accuracy before saving.</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Notaries:</strong> Document property conditions with the same precision you use for loan signing notes, but without the paperwork.</li><li><strong>Gig Workers:</strong> Use the same voice-to-text skills you use for navigation to complete high-value inspections 20% faster.</li></ul><p><strong>Quick Win:</strong> Use "Audio FastFill" to map voice input to checkboxes and numbers, allowing you to finish the "heavy lifting" of data entry while walking back to your car.</p><p><strong>Critical AI Limitations &amp; Warnings:</strong></p><ul><li><strong>Ambient Noise:</strong> Construction noise or wind may cause transcription errors; always perform a quick manual review of the text.</li><li><strong>Confirmation Loops:</strong> AI may prompt you to clarify a finding. Stick to observable facts (e.g., "shingle wear") and avoid diagnostics (e.g., "roof failure").</li></ul><h4><a id="_p8n4e82yqzf4"></a><strong>Lesson 4: AI Chat Assistants for Real-Time Protocol Guidance</strong></h4><p><strong>Core Concept:</strong> Accessing instant, client-specific instructions and troubleshooting via 24/7 AI chatbots, reducing the need for phone calls to coordinators.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Query:</strong> Ask the bot a natural language question (e.g., "Does Client A require a water meter photo for this order?").</li><li><strong>Receive Guidance:</strong> The AI pulls the specific requirement from thousands of pages of lender guidelines.</li><li><strong>Verify:</strong> Click the provided citation to see the exact page in the client manual for 100% compliance.</li><li><strong>Escalate:</strong> If the situation is an "edge-case," use the bot to route a concise summary to a human coordinator.</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Realtors:</strong> Use chat assistants to quickly understand the nuances of FHA habitability standards compared to standard appraisals.</li><li><strong>Existing Inspectors:</strong> Rapidly toggle between different client protocols without carrying multiple physical manuals.</li></ul><p><strong>Quick Win:</strong> Use a "Scenario AI" tool to get instant answers on complex "gray area" guidelines, ensuring you don''t miss a required photo and delay your payout.</p><p><strong>Critical AI Limitations &amp; Warnings:</strong></p><ul><li><strong>Domain Specificity:</strong> General bots (like standard ChatGPT) don''t know lender-specific overlays. Only use "mortgage-native" assistants trained on industry data.</li><li><strong>Human-in-the-Loop Mandate:</strong> If guidelines are unclear, <strong>stop and ask the coordinator</strong>. AI is a guide, not the rule-maker.</li></ul><h4><a id="_m8iwdxw9obsi"></a><strong>Lesson 5: Workflow Automation: Routing, Scheduling, and Coordinator Communication</strong></h4><p><strong>Core Concept:</strong> Leveraging AI to automatically optimize your daily route and handle occupant communication, maximizing your jobs-per-day.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Download Orders:</strong> Hit "download" in your app to sync new assignments and check for cancellations.</li><li><strong>Optimize Route:</strong> The AI analyzes job priority and traffic to create the most fuel-efficient sequence.</li><li><strong>Automate Pre-Calls:</strong> AI voice agents confirm appointments and share prep instructions with occupants.</li><li><strong>Track Status:</strong> Real-time updates keep coordinators informed of your ETA without you needing to text or call.</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Gig Workers:</strong> Move from $5 deliveries to $50-150 inspections by using AI routing that matches your existing driving skills to higher-paying territory.</li><li><strong>Realtors:</strong> Integrate your field work into your existing calendar seamlessly, using AI to fill "gaps" in your schedule with vetted jobs.</li></ul><p><strong>Quick Win:</strong> Implementing AI routing typically results in a <strong>15% decrease in mileage</strong> and a <strong>20% increase in job completion rates</strong>, directly increasing your net profit.</p><p><strong>Critical AI Limitations &amp; Warnings:</strong></p><ul><li><strong>Dynamic Changes:</strong> While AI reroutes for last-minute cancellations, always double-check the "Instructions" field for new property-specific access notes.</li><li><strong>Dependency Risk:</strong> Do not rely solely on automation; maintain a basic understanding of your territory in case of system outages.</li></ul><h4><a id="_5tbg07bxaykg"></a><strong>Lesson 6: AI Learning Tools and Continuous Professional Development</strong></h4><p><strong>Core Concept:</strong> Using AI-powered training modules and scenario practice to master new lender requirements (like NSPIRE or FHA) and increase your earning potential.</p><p><strong>Step-by-Step Instructions:</strong></p><ol><li><strong>Analyze Requirements:</strong> Upload new lender matrices or property preservation guides to an AI quiz generator.</li><li><strong>Practice Scenarios:</strong> Use "Scenario AI" to simulate complex borrower interactions or unusual property conditions.</li><li><strong>Review Performance:</strong> Use AI-driven dashboards to identify which of your "tags" or "statuses" are most frequently corrected.</li><li><strong>Upskill:</strong> Complete AI-powered certification courses to gain access to higher-paying specialty inspection networks.</li></ol><p><strong>Audience-Specific Examples:</strong></p><ul><li><strong>Notaries:</strong> Leverage your "Certified" status to quickly pick up property-specific certifications (FEMA, FHA) using AI learning paths.</li><li><strong>Existing Inspectors:</strong> Use AI to stay updated on shifting regulatory landscapes like the "Interagency AVM Rule" or new inspection data standards.</li></ul><p><strong>Quick Win:</strong> Turn a 100-page lender PDF into a 10-question interactive quiz to master their specific photo requirements in 5 minutes.</p><p><strong>Critical AI Limitations &amp; Warnings:</strong></p><ul><li><strong>Training Data Age:</strong> AI tools are only as good as the documents they were trained on. Ensure you are uploading the <strong>most current</strong> version of lender guidelines.</li><li><strong>Accountability:</strong> An AI certification proves knowledge, but your <strong>professional liability</strong> remains tied to your physical signature on the final report.</li></ul>', 
            'text', 
            'https://youtu.be/4EB3BQ6KB9o'
        );
        

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '67c66e78-4f61-4d54-98d7-7f249d8f98b8', 
                '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
                'Autonomous_AI_Bias_and_Human_Judgment (1).m4a', 
                'Reference material', 
                '/training/module-6/Autonomous_AI_Bias_and_Human_Judgment (1).m4a', 
                'm4a'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'af2a2184-feac-42e2-af8e-8685aacab796', 
                '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
                'infographic.png', 
                'Reference material', 
                '/training/module-6/infographic.png', 
                'png'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '463c3959-028b-4030-9e32-e0126d7f1373', 
                '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
                'Module6_1_AI_Tools_Comparison_Matrix (1).pdf', 
                'Reference material', 
                '/training/module-6/Module6_1_AI_Tools_Comparison_Matrix (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '4c4992b1-2c0c-4d05-a583-c5f508159fce', 
                '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
                'Module6_2_Photo_Quality_Validation_Checklist (1).pdf', 
                'Reference material', 
                '/training/module-6/Module6_2_Photo_Quality_Validation_Checklist (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '455e9521-cb67-4882-b841-6c1b3d7196a7', 
                '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
                'Module6_3_Voice_Documentation_Best_Practices.pdf', 
                'Reference material', 
                '/training/module-6/Module6_3_Voice_Documentation_Best_Practices.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '849ce0ca-1177-40c2-8ab5-df5794abf394', 
                '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
                'Module6_4_AI_Limitation_Verification_Protocol.pdf', 
                'Reference material', 
                '/training/module-6/Module6_4_AI_Limitation_Verification_Protocol.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'ee54e9a5-ef90-436b-a25f-d8d59db612f3', 
                '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
                'Quiz (1).docx', 
                'Reference material', 
                '/training/module-6/Quiz (1).docx', 
                'docx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'bafdb689-d75c-4ce2-83c9-326863e8fc7f', 
                '1a40623b-71be-4a69-9aa1-372eb9f7597e', 
                'Scenarios.docx', 
                'Reference material', 
                '/training/module-6/Scenarios.docx', 
                'docx'
            );
            

    -- Module 7
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES ('f7390983-e832-43d1-ba4b-562af51a2422', 7, 'Module 7', 'Module 7: Income Diversification - Specialized Inspection Types This module is designed to turn your existing skills into a $300-500/day enterprise by expanding your service portfolio beyond basic occupancy checks. The professional field services landscape is shifting from simple mortgage verification to a diversified ecosystem where financial institutions, healthcare providers, and federal agencies rely on localized data for risk mitigation. By mastering technical documentation protocols across multiple verticals, you can build a resilient, multi-stream business model that stays profitable regardless of market volatility. 1. Learning Objectives per Audience Segment', '📚', 1)
    ON CONFLICT DO NOTHING;
    

        INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
        VALUES (
            '55069349-e2c2-4f92-a015-0198253223c9', 
            'f7390983-e832-43d1-ba4b-562af51a2422', 
            1, 
            'Core Concepts', 
            '<h3><a id="_gb3gdjeo9xk6"></a><strong>Module 7: Income Diversification – Specialized Inspection Types</strong></h3><p>Diversification is how you turn a side hustle into a $300–500/day professional enterprise. Relying on a single inspection type leaves your income vulnerable to interest rate hikes or seasonal slumps. By "stacking" specialized services, you access 5–6x more work orders and command premium rates for technical documentation.</p><p><strong>The Diversification Math:</strong></p><ul><li><strong>Single-Stream:</strong> 10 Mortgage Occupancy Checks ($15/each) = <strong>$150/day.</strong></li><li><strong>Multi-Stream:</strong> 3 Mortgage Inspections ($50/each) + 1 Loss Draft ($150) + 2 Mystery Shops ($25/each) + 1 Property Preservation order ($100) = <strong>$450/day.</strong>.</li></ul><h3><a id="_g7si6lqez1hh"></a><strong>Lesson 1: Mystery Shopping &amp; Compliance Audits</strong></h3><p><strong>Role:</strong> Act as a covert auditor to evaluate brand standards, operational compliance, and legal mandates (e.g., tobacco ID checks or ADA accessibility).</p><ul><li><strong>Hiring Entities:</strong> IntelliShop, BestMark, Market Force.</li><li><strong>Documentation:</strong> Time-stamped photos, time measurements (checkout duration), and adherence to strict "shop guidelines".</li><li><strong>Rate Range:</strong> $25 (basic retail) to $200+ for specialized video shops or ADA audits.</li><li><strong>Volume Potential:</strong> High; includes in-person, phone-based, and digital journeys.</li><li><strong>Required Credentials:</strong> Successful completion of platform-specific screening tests; 24-inch digital level and door pressure gauge for ADA work.</li><li><strong>Positioning:</strong> Focus on your "technical documentation accuracy" and "high-speed reporting turnaround."</li><li><strong>Workflow:</strong> 1. Claim shop. 2. Study guidelines. 3. Visit covertly. 4. Document facts. 5. Submit web report.</li></ul><h3><a id="_vg5m01zf4wae"></a><strong>Lesson 2: Medical Courier Field Verification</strong></h3><p><strong>Role:</strong> Transport and document the secure delivery of lab specimens, pharmaceuticals, and medical devices while maintaining "cold chain" integrity.</p><ul><li><strong>Hiring Entities:</strong> Go2 Delivery, DeVries Business Services, Pillow Logistics.</li><li><strong>Documentation:</strong> Chain of custody logs, barcode scanning, digital signatures, and real-time temperature sensor logs.</li><li><strong>Rate Range:</strong> $15–$25 per hour or per-parcel rates depending on the contract.</li><li><strong>Volume Potential:</strong> Extremely stable; decentralized healthcare relies on daily specimen transport.</li><li><strong>Required Credentials:</strong> <strong>HIPAA Certification</strong> (mandatory) and <strong>Bloodborne Pathogens (BBP) Certification</strong>.</li><li><strong>Positioning:</strong> "HIPAA-certified field professional with temperature-controlled logistics experience."</li><li><strong>Workflow:</strong> 1. Secure pickup. 2. Verify PHI-confidentiality. 3. Monitor temperature. 4. Scan at transfer. 5. Secure delivery signature.</li></ul><h3><a id="_2on4dvm1bg60"></a><strong>Lesson 3: Property Preservation Services</strong></h3><p><strong>Role:</strong> Oversee the maintenance of vacant assets to ensure "conveyance condition" (e.g., winterization, debris removal, lawn care).</p><ul><li><strong>Hiring Entities:</strong> MCS, Safeguard, ServiceLink, National Field Representatives (NFR).</li><li><strong>Documentation:</strong> Comprehensive "before/during/after" photo sets; 20-30 photos for winterization (showing pressure gauges and antifreeze placement).</li><li><strong>Rate Range:</strong> Grass cuts ($28–$50), Dry Winterization ($70–$100), Wet Winterization ($105–$250).</li><li><strong>Volume Potential:</strong> High, especially during seasonal transitions (winterization and grass cut seasons).</li><li><strong>Required Credentials:</strong> <strong>ShieldID (ABC#)</strong> via Aspen Grove/ShieldHub.</li><li><strong>Positioning:</strong> "Certified preservation vendor specialized in seasonal risk mitigation (Winterization)."</li><li><strong>Workflow:</strong> 1. Verify vacancy. 2. Document pre-existing damage. 3. Execute work per investor guidelines. 4. Complete photo documentation. 5. Submit report.</li></ul><h3><a id="_br99di6ek4vt"></a><strong>Lesson 4: Insurance Loss Draft Inspections</strong></h3><p><strong>Role:</strong> Verify the percentage of completion for property repairs to facilitate the release of escrowed insurance funds.</p><ul><li><strong>Hiring Entities:</strong> Mortgage servicers and third-party loss draft providers like GIS Field Services and Pat Neff &amp; Associates (PNA).</li><li>**Documentation:**Math-based calculation of % complete against an official Scope of Work (SOW); photos of all installed repairs.</li><li><strong>Rate Range:</strong> $100–$300 per job.</li><li><strong>Volume Potential:</strong> High after regional storm events; requires rapid (24-hour) contact with homeowners.</li><li><strong>Required Credentials:</strong> Mastery of the <strong>"Materials vs. Installed Doctrine"</strong> (shingles on the ground = 0%; shingles on roof = complete).</li><li><strong>Positioning:</strong> "Objective third-party auditor specializing in percentage-of-completion verification for monitored claims."</li><li><strong>Workflow:</strong> 1. Call homeowner within 6 hours. 2. Verify SOW line items. 3. Calculate % complete. 4. Obtain homeowner signature. 5. Submit report.</li></ul><h3><a id="_qx1g5l45sy1d"></a><strong>Lesson 5: FEMA/Disaster Inspections</strong></h3><p><strong>Role:</strong> Deploy to disaster zones to document property damage and residential habitability for federal aid eligibility.</p><ul><li><strong>Hiring Entities:</strong> WSP USA Inspection Services and Vanguard EM.</li><li><strong>Documentation:</strong> Standardized government data collection using ACE Field Software on issued iPads; interior/exterior habitability photos.</li><li><strong>Rate Range:</strong> $26–$29 hourly (WSP) or high per-inspection volume rates during active deployments.</li><li><strong>Volume Potential:</strong> Cyclical but intense; deployment lasts weeks to months.</li><li><strong>Required Credentials:</strong> <strong>Moderate Risk Background Investigation (MBI)</strong> (includes neighbors/fingerprints) and U.S. Citizenship.</li><li><strong>Positioning:</strong> "Federally vetted rapid-response inspector available for immediate deployment."</li><li><strong>Workflow:</strong> 1. Pass MBI. 2. Complete readiness training. 3. Deploy within 24 hours. 4. Document habitability. 5. Submit ACE report.</li></ul><h3><a id="_wrzaxr4oupks"></a><strong>Lesson 6: REO Property Services</strong></h3><p><strong>Role:</strong> Manage the transition of bank-owned properties, including lockouts, utility verification, and Cash-for-Keys (CFK) negotiations.</p><ul><li><strong>Hiring Entities:</strong> Radian, ServiceLink, ROI Properties, Consolidated Analytics.</li><li><strong>Documentation:</strong> Verifiable ID of occupants, move-out condition walkthrough, and lock change verification.</li><li><strong>Rate Range:</strong> $75 (lockouts) to premium negotiation fees.</li><li><strong>Volume Potential:</strong> Consistent; banks require "boots on the ground" for asset recovery year-round.</li><li><strong>Required Credentials:</strong> <strong>ShieldID (ABC#)</strong>; understanding of local "self-help" eviction laws (never lockout without authority).</li><li><strong>Positioning:</strong> "Occupancy transition specialist experienced in CFK negotiations and asset security."</li><li><strong>Workflow:</strong> 1. Verify occupant identity. 2. Propose CFK deal. 3. Formalize written agreement. 4. Conduct walkthrough. 5. Exchange keys for check and change locks.</li></ul>', 
            'text', 
            'https://youtu.be/24YaMwxp26Q'
        );
        

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '17a3f6b8-74d7-4e73-83ec-9e680f1f81e7', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'HIPAA_Fraud_ADA_Audit_Risk_Management (1).m4a', 
                'Reference material', 
                '/training/module-7/HIPAA_Fraud_ADA_Audit_Risk_Management (1).m4a', 
                'm4a'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '7b461cd9-f90e-4e44-9c9c-d4995cf48c1b', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'Module7_1_Specialized_Inspection_Types_Matrix.pdf', 
                'Reference material', 
                '/training/module-7/Module7_1_Specialized_Inspection_Types_Matrix.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'a667dec8-05ff-4b75-9b91-17589e3ea416', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'Module7_2_Credential_Certification_Roadmap.pdf', 
                'Reference material', 
                '/training/module-7/Module7_2_Credential_Certification_Roadmap.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'a6ac4999-387b-47d9-af58-40e2e33d3517', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'Module7_3_Rate_Card_Negotiation_Guide.pdf', 
                'Reference material', 
                '/training/module-7/Module7_3_Rate_Card_Negotiation_Guide.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '019f7bc2-a29a-4aa5-acda-a3772cb04ea7', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'Module7_4_Multi_Stream_Weekly_Schedule.pdf', 
                'Reference material', 
                '/training/module-7/Module7_4_Multi_Stream_Weekly_Schedule.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'bdcd5c40-f513-4267-b8ab-19531ef81e6e', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'Module7_Deep_Research_Income_Diversification (1).pdf', 
                'Reference material', 
                '/training/module-7/Module7_Deep_Research_Income_Diversification (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'cfdca3ad-4aa2-4165-ac43-cbbaceaa644b', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'Professional_Risk_Mastery_Playbook (1) (1).pdf', 
                'Reference material', 
                '/training/module-7/Professional_Risk_Mastery_Playbook (1) (1).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '44ec1469-c0f7-41c1-affb-ec4a1e42f993', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'Quiz (2).docx', 
                'Reference material', 
                '/training/module-7/Quiz (2).docx', 
                'docx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '689d96cd-7d64-4206-bf22-3d35cceed548', 
                'f7390983-e832-43d1-ba4b-562af51a2422', 
                'Scenarios (1).docx', 
                'Reference material', 
                '/training/module-7/Scenarios (1).docx', 
                'docx'
            );
            

    -- Module 8
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES ('992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 8, 'Module 8', 'Module 8: Advanced Operational Standards – Scaling to Elite Professional Status This module is designed to transition you from a casual participant in the mortgage field services industry into an elite professional capable of managing high-volume territories and complex property types. While standard field inspections provide a solid income, elite operational mastery allows you to scale your earnings from $500/week to $1,500–$2,500/week by maximizing efficiency and securing preferred vendor status with national firms. 1. Learning Objectives', '📚', 1)
    ON CONFLICT DO NOTHING;
    

        INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
        VALUES (
            'e9cb0794-1810-43da-a675-a32d26b5e2f2', 
            '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
            1, 
            'Core Concepts', 
            '<h3><a id="_ic4wdxbd1412"></a><strong>Module 8: Advanced Operational Standards – Scaling to Elite Professional Status</strong></h3><p>To move from a casual $500/week inspector to an elite professional clearing $1,500–$2,500/week, you must stop "driving routes" and start "engineering logistics". This module focuses on the operational mastery required to handle high-volume territories and complex property types with zero rejections.</p><h3><a id="_8wpumwnv0x85"></a><strong>Lesson 1: Logistical Engineering &amp; Route Optimization</strong></h3><p><strong>The Technique:</strong> Moving beyond chronological work orders to <strong>Geospatial Clustering</strong> using algorithmic software like WorkWave, Mapline, or FieldCamp. These platforms analyze hundreds of addresses to create tight geographic loops, minimizing "windshield time"—your biggest non-billable expense.</p><ul><li><strong>Efficiency Gains:</strong> Achieve a 30% ROI through reduced fuel consumption and vehicle wear while doubling your daily stop capacity.</li><li><strong>Scope Boundary:</strong> Advanced routing allows you to sequence exterior-only jobs during peak traffic and interior access jobs during midday windows to maximize the "eyes and ears" time without diagnostic creep.</li><li><strong>Step-by-Step Workflow:</strong><ul><li><strong>"Download Before the Field":</strong> Review all client-specific checklists on a desktop before departing to eliminate onsite delays.</li><li><strong>Cluster:</strong> Use software to organize stops into 1–3 mile intervals.</li><li><strong>"One-and-Done":</strong> Complete the report and upload all photos via InspectorADE or Pruvan before shifting the vehicle into drive.</li></ul></li><li><strong>Real Math:</strong><ul><li>Manual Planning: 2–4 stops/hr @ $15 = $30–$60/hr.</li><li>Algorithmic Planning: 6–8+ stops/hr @ $15 = <strong>$90–$120/hr</strong>.</li><li><strong>The Elite Day:</strong> A 50-stop day at $15/stop = <strong>$750/day</strong> vs. a 15-stop manual day = $225/day.</li></ul></li></ul><h3><a id="_rqwjlammmj2i"></a><strong>Lesson 2: Environmental Adaptability &amp; Seasonal Standards</strong></h3><p><strong>The Technique:</strong> Maintaining unassailable documentation regardless of the weather. Elite inspectors use specific hardware protection and advanced photography settings to ensure data integrity in sub-freezing or extreme heat conditions.</p><ul><li><strong>Efficiency Gains:</strong> Eliminates "callbacks" caused by fogged lenses, thermal shutdowns, or dark/grainy interior photos.</li><li><strong>Scope Boundary:</strong> Observe and document seasonal compliance (e.g., antifreeze in toilets) without performing the actual maintenance or repairs.</li><li><strong>Step-by-Step Workflow:</strong><ol><li><strong>Winterization Verification:</strong> Document that water is off, faucets are open, antifreeze is in traps, and thermostats are set to $55^{\circ}F$–$60^{\circ}F$.</li><li><strong>Heat Management:</strong> Use thermal-insulated bags and reflective cloths; avoid moving chilled devices into humid air to prevent internal condensation.</li><li><strong>Low-Light Mastery:</strong> Use "fast" prime lenses ($f/1.8$) and tripods to allow slower shutter speeds without "digital noise" in homes without power.</li></ol></li><li><strong>Benchmark:</strong> Zero reports rejected due to "unclear photos" or "weather-related equipment failure."</li></ul><h3><a id="_abnhdog6e20r"></a><strong>Lesson 3: Specialized Property Type Mastery</strong></h3><p><strong>The Technique:</strong> Developing expertise in complex assignments like Multi-Family, Rural, and Loss Draft (Draw) inspections. This requires mastering the <strong>Materials vs. Installed Doctrine</strong> to ensure bank funds are released accurately.</p><ul><li><strong>Efficiency Gains:</strong> High-value niche specialization commands a "Rural Premium" or "Specialized Fee," increasing the revenue-per-stop.</li><li><strong>Scope Boundary:</strong> Document % completion vs. Scope of Work; do NOT estimate repair costs or certify legal property boundaries.</li><li><strong>Step-by-Step Workflow:</strong><ol><li><strong>Multi-Family:</strong> Use a "top-down" approach (Roof -&gt; Common Areas -&gt; Unit-by-Unit PCR).</li><li><strong>Rural:</strong> Use GIS-enabled platforms (Acres.com) to verify access easements and USPLSS orientation.</li><li><strong>Loss Draft:</strong> Verify "Installed Completion" only. (e.g., $10k of cabinets in a garage = 0% completion for the Kitchen draw).</li></ol></li><li><strong>Benchmark:</strong> Successfully manage contractor/occupant pressure by utilizing "Objective Distance" scripts: <em>"I am the eyes and ears for the bank to verify status, not the authority to release funds"</em>.</li></ul><h3><a id="_nanoslmz27jz"></a><strong>Lesson 4: Advanced Damage Documentation</strong></h3><p><strong>The Technique:</strong> Moving from random photos to <strong>Narrative Photography</strong>. Construction of a visual narrative using the <strong>Context + Detail</strong> framework allows coordinators 500 miles away to interpret conditions with certainty.</p><ul><li><strong>Efficiency Gains:</strong> Reduces time-consuming follow-up questions from quality control by providing "coordinator-ready" reports.</li><li><strong>Scope Boundary:</strong> Provide high-definition, context-layered evidence that allows an engineer to diagnose the issue while you stay strictly within the observer role.</li><li><strong>Step-by-Step Workflow (The 4-Shot Sequence):</strong><ol><li><strong>Establishing Shot:</strong> Wide-angle view showing the defect relative to the structure/grade.</li><li><strong>Relationship Shot:</strong> Mid-range view showing proximity to environmental factors (e.g., trees/downspouts).</li><li><strong>Detail Shot:</strong> Close-up with a measurement tool (ruler/coin) for scale.</li><li><strong>Comparison Shot:</strong> Photo of an unaffected area to highlight the deviation.</li></ol></li></ul><h3><a id="_wmwer77l9fqi"></a><strong>Lesson 5: Administrative Resilience &amp; Dispute Resolution</strong></h3><p><strong>The Technique:</strong> Managing rejections and conflicts through clinical, professional protocols rather than emotional disputes. Elite inspectors build <strong>Case File Packages</strong> to appeal erroneous rejections.</p><ul><li><strong>Efficiency Gains:</strong> Protects your "Preferred Vendor" status and ensures on-time payment by resolving disputes faster than the standard 30-day window.</li><li><strong>Scope Boundary:</strong> Limit all rebuttals to facts and documents previously exchanged in the work order; never use subjective opinions.</li><li><strong>Step-by-Step Workflow:</strong><ol><li><strong>Clinical Rebuttal:</strong> Submit responses using objective scripts: <em>"Photo #7 shows active meter at GPS $$, fulfilling requirement X"</em>.</li><li><strong>Management Escalation:</strong> If the portal response is unsatisfactory, escalate to a regional supervisor with the original instruction evidence.</li><li><strong>Conflict Management:</strong> Maintain objective distance from hostile occupants using scripted professional boundaries.</li></ol></li></ul><h3><a id="_zackikaq7kg0"></a><strong>Lesson 6: Sustainable Business Growth</strong></h3><p><strong>The Technique:</strong> Transitioning from an on-demand vendor to a <strong>Strategic Partner</strong>. This involves client diversification across the mortgage lifecycle and volume-based rate negotiations.</p><ul><li><strong>Efficiency Gains:</strong> Guaranteed "First-Right-of-Refusal" on high-volume zones reduces time spent looking for work.</li><li><strong>Scope Boundary:</strong> Scale your business by mentoring others in the "Objective Observer" framework, ensuring they never use financial terms like "foreclosure" or "default" with homeowners.</li><li><strong>Step-by-Step Workflow:</strong><ol><li><strong>Diversify:</strong> Maintain active contracts with 3–5 clients across bankruptcy, disaster assessment, and delinquency sectors.</li><li><strong>Negotiate:</strong> Implement <strong>Tiered Pricing</strong> (Base Rate + Rural Premium + Rush Surcharges).</li><li><strong>Credentialing:</strong> Maintain ABC# via Shield Hub to simplify onboarding with national firms.</li></ol></li><li><strong>The Master Inspector Identity:</strong> Mastery is achieving a sub-10-minute onsite duration for a visual narrative while navigating a 50-stop day with zero rejections.</li></ul>', 
            'text', 
            'https://youtu.be/VSwh4ECowc4'
        );
        

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '830b8394-8fe1-47bb-8c35-f9c5ded164f7', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'ADA_Foreclosures_and_Caregiving_Standards (1).m4a', 
                'Reference material', 
                '/training/module-8/ADA_Foreclosures_and_Caregiving_Standards (1).m4a', 
                'm4a'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '05e0d003-fabe-4dca-a0b2-bdf25388fc39', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Beyond the Obvious_ 5 Counter-Intuitive Rules Shaping Society (2).pdf', 
                'Reference material', 
                '/training/module-8/Beyond the Obvious_ 5 Counter-Intuitive Rules Shaping Society (2).pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'ea3d8a61-33a2-4eb5-aa0d-589053a52d7b', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Invisible_Blueprint (1).mp4', 
                'Reference material', 
                '/training/module-8/Invisible_Blueprint (1).mp4', 
                'mp4'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '0791dd4e-226a-442b-82f4-f1ec57de1509', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Module8_1_Route_Optimization_Efficiency_Calculator.pdf', 
                'Reference material', 
                '/training/module-8/Module8_1_Route_Optimization_Efficiency_Calculator.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'ec84de1f-e8c7-49c3-8a64-40dcab7fb950', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Module8_2_Seasonal_Equipment_Documentation_Checklist.pdf', 
                'Reference material', 
                '/training/module-8/Module8_2_Seasonal_Equipment_Documentation_Checklist.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '804c685e-6db1-47ad-82fa-12ece04286ea', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Module8_3_Advanced_Damage_Documentation_Framework.pdf', 
                'Reference material', 
                '/training/module-8/Module8_3_Advanced_Damage_Documentation_Framework.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '32ec883a-8e56-4db0-9b74-b22d36179011', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Module8_4_Preferred_Vendor_Scorecard_Growth_Roadmap.pdf', 
                'Reference material', 
                '/training/module-8/Module8_4_Preferred_Vendor_Scorecard_Growth_Roadmap.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '2a3d3ef5-d047-47c6-aa27-702c3cfc02e1', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Module8_Deep_Research_Advanced_Operational_Standards.pdf', 
                'Reference material', 
                '/training/module-8/Module8_Deep_Research_Advanced_Operational_Standards.pdf', 
                'pdf'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '1710ce2f-1026-47c9-b936-fd7822686b71', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Quiz (3).docx', 
                'Reference material', 
                '/training/module-8/Quiz (3).docx', 
                'docx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                '90eefa90-e360-4bc1-b4a2-482965f5fa4a', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'Scenario A_ The 40-Order Logistical Engineering Challenge.docx', 
                'Reference material', 
                '/training/module-8/Scenario A_ The 40-Order Logistical Engineering Challenge.docx', 
                'docx'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'da24bedc-76ca-47d4-8fc8-958eed9aa10c', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'unnamed (5).png', 
                'Reference material', 
                '/training/module-8/unnamed (5).png', 
                'png'
            );
            

            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                'f317d0de-f1f5-4584-a708-38ad72d0b998', 
                '992e3f69-3108-4eac-91c0-fb7a4abdfdf8', 
                'unnamed (6).png', 
                'Reference material', 
                '/training/module-8/unnamed (6).png', 
                'png'
            );
            