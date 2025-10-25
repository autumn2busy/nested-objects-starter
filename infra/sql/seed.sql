
-- Minimal seed data
insert into public.firms (name, niche, website, phone, email, location, pay_range, requirements, notes)
values
('Atlas Field Services', 'property inspection', 'https://atlas.example.com', '555-123-4567', 'recruiting@atlas.example.com', 'National', '$10–$35 per order', 'Background check, smartphone, reliable car', 'High volume, pays twice monthly'),
('Civic Data Inspections', 'occupancy', 'https://civicdata.example.com', null, 'vendors@civicdata.example.com', 'Southeast', '$8–$25 per order', 'ABC# required, GPS photos', 'Good starter firm');

insert into public.resources (title, type, description, url, access_level)
values
('Field Inspection Starter Kit', 'guide', 'Everything you need to land your first inspection in 7 days.', 'https://members.nestedobjects.com/resources/starter-kit', 'pro'),
('AI Resume Builder Walkthrough', 'video', 'How to turn your background into an inspector-ready resume.', 'https://members.nestedobjects.com/resources/ai-resume-video', 'free');
