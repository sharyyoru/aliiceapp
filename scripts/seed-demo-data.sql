-- ============================================================
-- ALiice Demo Data Seed Script
-- Creates comprehensive demo data for showcasing the platform
-- Run after SETUP_DATABASE.sql
-- ============================================================

-- Start transaction for atomicity
BEGIN;

-- ============================================================
-- PART 1: PROVIDERS (Doctors)
-- ============================================================
INSERT INTO providers (id, name, specialty, email, phone, gln, zsr) VALUES
('11111111-1111-1111-1111-111111111111', 'Dr. Sophie Laurent', 'Plastic Surgery', 'sophie.laurent@clinic.ch', '+41 21 123 4561', '7601003456789', 'C123456'),
('22222222-2222-2222-2222-222222222222', 'Dr. Marc Dubois', 'Dermatology', 'marc.dubois@clinic.ch', '+41 21 123 4562', '7601003456790', 'C123457'),
('33333333-3333-3333-3333-333333333333', 'Dr. Elena Fischer', 'Aesthetic Medicine', 'elena.fischer@clinic.ch', '+41 21 123 4563', '7601003456791', 'C123458'),
('44444444-4444-4444-4444-444444444444', 'Dr. Thomas Müller', 'General Surgery', 'thomas.muller@clinic.ch', '+41 21 123 4564', '7601003456792', 'C123459')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 2: PATIENTS (25 diverse patients)
-- ============================================================
INSERT INTO patients (id, first_name, last_name, email, phone, gender, dob, marital_status, nationality, street_address, street_number, postal_code, town, country, profession, language_preference, lifecycle_stage, source, notes) VALUES
-- Active patients with complete profiles
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Marie', 'Dumont', 'marie.dumont@email.ch', '+41 79 123 4501', 'female', '1985-03-15', 'married', 'Swiss', 'Rue du Lac', '24', '1003', 'Lausanne', 'Switzerland', 'Marketing Manager', 'fr', 'customer', 'manual', 'VIP client, prefers morning appointments'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Jean-Pierre', 'Favre', 'jp.favre@email.ch', '+41 79 123 4502', 'male', '1978-07-22', 'married', 'Swiss', 'Avenue de Cour', '156', '1007', 'Lausanne', 'Switzerland', 'Banker', 'fr', 'customer', 'google', 'Interested in anti-aging treatments'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Anna', 'Schneider', 'anna.schneider@email.ch', '+41 79 123 4503', 'female', '1990-11-08', 'single', 'German', 'Chemin des Roses', '12', '1004', 'Lausanne', 'Switzerland', 'Software Engineer', 'en', 'customer', 'meta', 'First-time patient, referred by friend'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Philippe', 'Martin', 'philippe.martin@email.ch', '+41 79 123 4504', 'male', '1972-04-30', 'divorced', 'French', 'Route de Berne', '89', '1010', 'Lausanne', 'Switzerland', 'Architect', 'fr', 'lead', 'event', 'Met at wellness fair'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sophie', 'Bernard', 'sophie.bernard@email.ch', '+41 79 123 4505', 'female', '1988-09-12', 'married', 'Swiss', 'Place de la Gare', '5', '1003', 'Lausanne', 'Switzerland', 'Lawyer', 'fr', 'customer', 'manual', 'Regular patient for skincare'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Lucas', 'Weber', 'lucas.weber@email.ch', '+41 79 123 4506', 'male', '1995-01-25', 'single', 'Swiss', 'Rue de Genève', '78', '1004', 'Lausanne', 'Switzerland', 'Personal Trainer', 'en', 'customer', 'google', 'Athletic, interested in body contouring'),
('11111111-aaaa-bbbb-cccc-111111111111', 'Isabelle', 'Rochat', 'isabelle.rochat@email.ch', '+41 79 123 4507', 'female', '1982-06-18', 'married', 'Swiss', 'Avenue de Rumine', '42', '1005', 'Lausanne', 'Switzerland', 'Doctor', 'fr', 'customer', 'manual', 'Colleague referral, very detail-oriented'),
('22222222-aaaa-bbbb-cccc-222222222222', 'Nicolas', 'Blanc', 'nicolas.blanc@email.ch', '+41 79 123 4508', 'male', '1980-12-05', 'married', 'French', 'Chemin du Bois', '15', '1018', 'Lausanne', 'Switzerland', 'CEO', 'fr', 'customer', 'event', 'High-value client, prefers discretion'),
('33333333-aaaa-bbbb-cccc-333333333333', 'Camille', 'Fournier', 'camille.fournier@email.ch', '+41 79 123 4509', 'female', '1993-08-21', 'single', 'French', 'Rue du Midi', '33', '1003', 'Lausanne', 'Switzerland', 'Artist', 'fr', 'lead', 'meta', 'Interested in lip fillers'),
('44444444-aaaa-bbbb-cccc-444444444444', 'Alexandre', 'Mercier', 'alex.mercier@email.ch', '+41 79 123 4510', 'male', '1975-02-14', 'married', 'Swiss', 'Avenue de Provence', '67', '1007', 'Lausanne', 'Switzerland', 'Consultant', 'en', 'customer', 'google', 'Regular botox appointments'),
-- More diverse patients
('55555555-aaaa-bbbb-cccc-555555555555', 'Emma', 'Leroy', 'emma.leroy@email.ch', '+41 79 123 4511', 'female', '1997-05-03', 'single', 'French', 'Rue de la Paix', '18', '1201', 'Geneva', 'Switzerland', 'Model', 'fr', 'customer', 'meta', 'Professional model, needs flexible scheduling'),
('66666666-aaaa-bbbb-cccc-666666666666', 'David', 'Moser', 'david.moser@email.ch', '+41 79 123 4512', 'male', '1968-10-28', 'married', 'Swiss', 'Bahnhofstrasse', '45', '8001', 'Zurich', 'Switzerland', 'Investment Banker', 'de', 'customer', 'manual', 'Travels for appointments, VIP'),
('77777777-aaaa-bbbb-cccc-777777777777', 'Charlotte', 'Girard', 'charlotte.girard@email.ch', '+41 79 123 4513', 'female', '1986-07-09', 'married', 'Belgian', 'Rue du Stand', '22', '1204', 'Geneva', 'Switzerland', 'HR Director', 'fr', 'lead', 'event', 'Interested in facial rejuvenation'),
('88888888-aaaa-bbbb-cccc-888888888888', 'Pierre', 'Roux', 'pierre.roux@email.ch', '+41 79 123 4514', 'male', '1983-03-17', 'single', 'French', 'Avenue du Léman', '99', '1005', 'Lausanne', 'Switzerland', 'Chef', 'fr', 'customer', 'google', 'Prefers evening appointments'),
('99999999-aaaa-bbbb-cccc-999999999999', 'Claire', 'Petit', 'claire.petit@email.ch', '+41 79 123 4515', 'female', '1991-12-24', 'engaged', 'Swiss', 'Rue de la Fontaine', '7', '1003', 'Lausanne', 'Switzerland', 'Pharmacist', 'fr', 'customer', 'manual', 'Getting married, wants pre-wedding treatments'),
('aaaabbbb-cccc-dddd-eeee-111111111111', 'François', 'Dupont', 'francois.dupont@email.ch', '+41 79 123 4516', 'male', '1970-09-06', 'widowed', 'Swiss', 'Chemin du Signal', '30', '1018', 'Lausanne', 'Switzerland', 'Retired Professor', 'fr', 'lead', 'manual', 'Recently inquired about procedures'),
('aaaabbbb-cccc-dddd-eeee-222222222222', 'Nathalie', 'Simon', 'nathalie.simon@email.ch', '+41 79 123 4517', 'female', '1979-04-11', 'married', 'Swiss', 'Place du Port', '8', '1006', 'Lausanne', 'Switzerland', 'Real Estate Agent', 'fr', 'customer', 'event', 'Long-term client, quarterly treatments'),
('aaaabbbb-cccc-dddd-eeee-333333333333', 'Julien', 'Moreau', 'julien.moreau@email.ch', '+41 79 123 4518', 'male', '1992-08-30', 'single', 'French', 'Rue de Bourg', '55', '1003', 'Lausanne', 'Switzerland', 'Actor', 'fr', 'customer', 'meta', 'Needs camera-ready treatments'),
('aaaabbbb-cccc-dddd-eeee-444444444444', 'Valérie', 'Robert', 'valerie.robert@email.ch', '+41 79 123 4519', 'female', '1984-01-19', 'married', 'Swiss', 'Avenue de Montchoisi', '41', '1006', 'Lausanne', 'Switzerland', 'Teacher', 'fr', 'lead', 'google', 'Summer availability preferred'),
('aaaabbbb-cccc-dddd-eeee-555555555555', 'Olivier', 'Garcia', 'olivier.garcia@email.ch', '+41 79 123 4520', 'male', '1987-06-25', 'married', 'Spanish', 'Rue de la Louve', '14', '1003', 'Lausanne', 'Switzerland', 'Engineer', 'en', 'customer', 'manual', 'Tech-savvy, uses patient portal')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 3: DEAL STAGES (ensure they exist with IDs)
-- ============================================================
DELETE FROM deal_stages;
INSERT INTO deal_stages (id, name, type, sort_order, is_default) VALUES
('stage-0001-0001-0001-000000000001', 'New Lead', 'lead', 1, true),
('stage-0001-0001-0001-000000000002', 'Contacted', 'lead', 2, false),
('stage-0001-0001-0001-000000000003', 'Consultation Scheduled', 'consultation', 3, false),
('stage-0001-0001-0001-000000000004', 'Consultation Complete', 'consultation', 4, false),
('stage-0001-0001-0001-000000000005', 'Quote Sent', 'consultation', 5, false),
('stage-0001-0001-0001-000000000006', 'Surgery Scheduled', 'surgery', 6, false),
('stage-0001-0001-0001-000000000007', 'Surgery Complete', 'surgery', 7, false),
('stage-0001-0001-0001-000000000008', 'Post-Op Care', 'post_op', 8, false),
('stage-0001-0001-0001-000000000009', 'Follow-Up', 'follow_up', 9, false),
('stage-0001-0001-0001-000000000010', 'Closed Won', 'other', 10, false),
('stage-0001-0001-0001-000000000011', 'Closed Lost', 'other', 11, false);

-- ============================================================
-- PART 4: DEALS (Patient opportunities at various stages)
-- ============================================================
INSERT INTO deals (id, patient_id, stage_id, pipeline, title, value, notes, service_interest, source, created_at) VALUES
-- New leads
('deal-0001-0001-0001-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'stage-0001-0001-0001-000000000001', 'main', 'Philippe Martin - Rhinoplasty Inquiry', 8500, 'Interested in nose reshaping, sent inquiry form', 'Rhinoplasty', 'event', NOW() - INTERVAL '2 days'),
('deal-0002-0002-0002-000000000002', '77777777-aaaa-bbbb-cccc-777777777777', 'stage-0001-0001-0001-000000000001', 'main', 'Charlotte Girard - Facelift Consultation', 12000, 'Wants to discuss facelift options', 'Facelift', 'event', NOW() - INTERVAL '1 day'),
('deal-0003-0003-0003-000000000003', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'stage-0001-0001-0001-000000000002', 'main', 'François Dupont - Eyelid Surgery', 4500, 'Contacted via phone, scheduling consultation', 'Blepharoplasty', 'manual', NOW() - INTERVAL '5 days'),
-- Consultation scheduled
('deal-0004-0004-0004-000000000004', '33333333-aaaa-bbbb-cccc-333333333333', 'stage-0001-0001-0001-000000000003', 'main', 'Camille Fournier - Lip Augmentation', 800, 'Consultation scheduled for next week', 'Lip Fillers', 'meta', NOW() - INTERVAL '3 days'),
('deal-0005-0005-0005-000000000005', 'aaaabbbb-cccc-dddd-eeee-444444444444', 'stage-0001-0001-0001-000000000003', 'main', 'Valérie Robert - Skin Rejuvenation', 2500, 'Package consultation booked', 'Skin Treatments', 'google', NOW() - INTERVAL '4 days'),
-- Consultation complete
('deal-0006-0006-0006-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'stage-0001-0001-0001-000000000004', 'main', 'Marie Dumont - Breast Augmentation', 9500, 'Consultation done, very interested', 'Breast Augmentation', 'manual', NOW() - INTERVAL '10 days'),
('deal-0007-0007-0007-000000000007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'stage-0001-0001-0001-000000000004', 'main', 'Anna Schneider - Laser Treatment Package', 3200, '3-session laser package discussed', 'Laser CO2', 'meta', NOW() - INTERVAL '8 days'),
-- Quote sent
('deal-0008-0008-0008-000000000008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'stage-0001-0001-0001-000000000005', 'main', 'Jean-Pierre Favre - Full Face Rejuvenation', 6800, 'Quote sent: Botox + Fillers + PRP', 'Injectables', 'google', NOW() - INTERVAL '7 days'),
('deal-0009-0009-0009-000000000009', '22222222-aaaa-bbbb-cccc-222222222222', 'stage-0001-0001-0001-000000000005', 'main', 'Nicolas Blanc - Body Contouring', 5500, 'CoolSculpting quote sent', 'Coolsculpting', 'event', NOW() - INTERVAL '6 days'),
-- Surgery scheduled
('deal-0010-0010-0010-000000000010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'stage-0001-0001-0001-000000000006', 'main', 'Sophie Bernard - Liposuction', 7200, 'Surgery scheduled for next month', 'Liposuction', 'manual', NOW() - INTERVAL '14 days'),
-- Post-op care
('deal-0011-0011-0011-000000000011', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'stage-0001-0001-0001-000000000008', 'main', 'Lucas Weber - Gynecomastia Recovery', 5800, 'Surgery complete, in recovery phase', 'Gynecomastia', 'google', NOW() - INTERVAL '21 days'),
-- Closed won
('deal-0012-0012-0012-000000000012', '11111111-aaaa-bbbb-cccc-111111111111', 'stage-0001-0001-0001-000000000010', 'main', 'Isabelle Rochat - Rhinoplasty', 9200, 'Successfully completed, very satisfied', 'Rhinoplasty', 'manual', NOW() - INTERVAL '60 days'),
('deal-0013-0013-0013-000000000013', '44444444-aaaa-bbbb-cccc-444444444444', 'stage-0001-0001-0001-000000000010', 'main', 'Alexandre Mercier - Annual Botox Package', 2400, 'Recurring annual package purchased', 'Botox', 'google', NOW() - INTERVAL '90 days'),
('deal-0014-0014-0014-000000000014', '55555555-aaaa-bbbb-cccc-555555555555', 'stage-0001-0001-0001-000000000010', 'main', 'Emma Leroy - Dermal Fillers', 1800, 'Completed treatment series', 'Fillers', 'meta', NOW() - INTERVAL '45 days'),
-- Closed lost
('deal-0015-0015-0015-000000000015', '66666666-aaaa-bbbb-cccc-666666666666', 'stage-0001-0001-0001-000000000011', 'main', 'David Moser - Facelift', 15000, 'Decided to postpone due to travel schedule', 'Facelift', 'manual', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 5: APPOINTMENTS (Past, current, and future)
-- ============================================================
INSERT INTO appointments (id, patient_id, provider_id, start_time, end_time, status, reason, location, source) VALUES
-- Past completed appointments
('appt-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 hour', 'completed', 'Initial Consultation - Breast Augmentation', 'Clinic Lausanne', 'manual'),
('appt-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days' + INTERVAL '45 minutes', 'completed', 'Botox Treatment - Full Face', 'Clinic Lausanne', 'manual'),
('appt-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '30 minutes', 'completed', 'Laser CO2 Session 1', 'Clinic Lausanne', 'ai'),
('appt-0004-0004-0004-000000000004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '2 hours', 'completed', 'Pre-Op Assessment - Liposuction', 'Clinic Lausanne', 'manual'),
('appt-0005-0005-0005-000000000005', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '3 hours', 'completed', 'Gynecomastia Surgery', 'Operating Room 1', 'manual'),
('appt-0006-0006-0006-000000000006', '11111111-aaaa-bbbb-cccc-111111111111', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '4 hours', 'completed', 'Rhinoplasty Surgery', 'Operating Room 2', 'manual'),
('appt-0007-0007-0007-000000000007', '44444444-aaaa-bbbb-cccc-444444444444', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '30 minutes', 'completed', 'Botox Touch-Up', 'Clinic Lausanne', 'ai'),
('appt-0008-0008-0008-000000000008', '55555555-aaaa-bbbb-cccc-555555555555', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days' + INTERVAL '1 hour', 'completed', 'Dermal Filler Treatment', 'Clinic Lausanne', 'manual'),
-- No-shows
('appt-0009-0009-0009-000000000009', '66666666-aaaa-bbbb-cccc-666666666666', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days' + INTERVAL '1 hour', 'no_show', 'Facelift Consultation', 'Clinic Lausanne', 'manual'),
-- Cancelled
('appt-0010-0010-0010-000000000010', '88888888-aaaa-bbbb-cccc-888888888888', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes', 'cancelled', 'PRP Session', 'Clinic Lausanne', 'ai'),
-- Today's appointments
('appt-0011-0011-0011-000000000011', 'aaaabbbb-cccc-dddd-eeee-222222222222', '33333333-3333-3333-3333-333333333333', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'confirmed', 'Quarterly Skin Treatment', 'Clinic Lausanne', 'manual'),
('appt-0012-0012-0012-000000000012', 'aaaabbbb-cccc-dddd-eeee-333333333333', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours', 'confirmed', 'Camera-Ready Facial', 'Clinic Lausanne', 'ai'),
-- Upcoming appointments
('appt-0013-0013-0013-000000000013', '33333333-aaaa-bbbb-cccc-333333333333', '33333333-3333-3333-3333-333333333333', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'scheduled', 'Lip Filler Consultation', 'Clinic Lausanne', 'manual'),
('appt-0014-0014-0014-000000000014', 'aaaabbbb-cccc-dddd-eeee-444444444444', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '1 hour', 'scheduled', 'Skin Rejuvenation Consultation', 'Clinic Lausanne', 'ai'),
('appt-0015-0015-0015-000000000015', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', 'confirmed', 'Liposuction Surgery', 'Operating Room 1', 'manual'),
('appt-0016-0016-0016-000000000016', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '45 minutes', 'scheduled', 'Botox Follow-Up', 'Clinic Lausanne', 'ai'),
('appt-0017-0017-0017-000000000017', '99999999-aaaa-bbbb-cccc-999999999999', '33333333-3333-3333-3333-333333333333', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 hours', 'scheduled', 'Pre-Wedding Facial Package', 'Clinic Lausanne', 'manual'),
('appt-0018-0018-0018-000000000018', '22222222-aaaa-bbbb-cccc-222222222222', '11111111-1111-1111-1111-111111111111', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '1 hour', 'scheduled', 'Body Contouring Assessment', 'Clinic Lausanne', 'ai'),
-- Post-op follow-ups
('appt-0019-0019-0019-000000000019', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '30 minutes', 'scheduled', 'Gynecomastia Post-Op Check', 'Clinic Lausanne', 'manual'),
('appt-0020-0020-0020-000000000020', '11111111-aaaa-bbbb-cccc-111111111111', '11111111-1111-1111-1111-111111111111', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '30 minutes', 'scheduled', 'Rhinoplasty 3-Month Follow-Up', 'Clinic Lausanne', 'manual')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 6: EMAILS (Between staff and patients)
-- ============================================================
INSERT INTO emails (id, patient_id, deal_id, to_address, from_address, subject, body, status, direction, sent_at, created_at) VALUES
-- Outbound emails to patients
('email-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deal-0006-0006-0006-000000000006', 'marie.dumont@email.ch', 'info@clinic.ch', 'Your Consultation Appointment Confirmation', '<p>Dear Marie,</p><p>Thank you for scheduling your consultation for breast augmentation. We look forward to seeing you on the scheduled date.</p><p>Please bring your insurance card and any relevant medical documents.</p><p>Best regards,<br>Clinic Lausanne Team</p>', 'sent', 'outbound', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('email-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'deal-0008-0008-0008-000000000008', 'jp.favre@email.ch', 'info@clinic.ch', 'Your Personalized Treatment Quote', '<p>Dear Mr. Favre,</p><p>As discussed during our consultation, please find attached your personalized quote for the Full Face Rejuvenation package including Botox, Fillers, and PRP treatments.</p><p>Total: CHF 6,800</p><p>Please do not hesitate to contact us with any questions.</p>', 'sent', 'outbound', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('email-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, 'anna.schneider@email.ch', 'info@clinic.ch', 'Laser Treatment Session 2 - Appointment Reminder', '<p>Dear Anna,</p><p>This is a reminder for your upcoming Laser CO2 treatment session scheduled for next week.</p><p>Please avoid sun exposure 48 hours before the appointment.</p><p>See you soon!</p>', 'sent', 'outbound', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('email-0004-0004-0004-000000000004', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'deal-0011-0011-0011-000000000011', 'lucas.weber@email.ch', 'info@clinic.ch', 'Post-Op Care Instructions - Gynecomastia', '<p>Dear Lucas,</p><p>Congratulations on your successful procedure! Here are your post-operative care instructions:</p><ul><li>Wear the compression garment for 4-6 weeks</li><li>Avoid strenuous activities for 3 weeks</li><li>Take prescribed medications as directed</li><li>Contact us immediately if you experience unusual symptoms</li></ul><p>Your follow-up appointment is scheduled for next week.</p>', 'sent', 'outbound', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('email-0005-0005-0005-000000000005', '11111111-aaaa-bbbb-cccc-111111111111', 'deal-0012-0012-0012-000000000012', 'isabelle.rochat@email.ch', 'info@clinic.ch', '3-Month Post-Op Follow-Up Invitation', '<p>Dear Isabelle,</p><p>It has been 3 months since your rhinoplasty procedure. We hope you are pleased with the results!</p><p>We would like to schedule a follow-up appointment to ensure everything is healing perfectly.</p><p>Please let us know your availability.</p>', 'sent', 'outbound', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('email-0006-0006-0006-000000000006', '99999999-aaaa-bbbb-cccc-999999999999', NULL, 'claire.petit@email.ch', 'info@clinic.ch', 'Your Pre-Wedding Beauty Package Details', '<p>Dear Claire,</p><p>Congratulations on your upcoming wedding! We are excited to help you look your absolute best for your special day.</p><p>Your personalized Pre-Wedding Beauty Package includes:</p><ul><li>3 Facial treatments</li><li>Botox touch-up</li><li>LED Light therapy sessions</li></ul><p>Total: CHF 2,200</p>', 'sent', 'outbound', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
-- Inbound emails from patients
('email-0007-0007-0007-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deal-0006-0006-0006-000000000006', 'info@clinic.ch', 'marie.dumont@email.ch', 'Re: Your Consultation Appointment Confirmation', '<p>Hello,</p><p>Thank you for the confirmation. I have a few questions about the procedure:</p><ol><li>What is the typical recovery time?</li><li>Will I need someone to drive me home after?</li><li>Are there financing options available?</li></ol><p>Looking forward to my appointment!</p><p>Marie</p>', 'sent', 'inbound', NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
('email-0008-0008-0008-000000000008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'deal-0008-0008-0008-000000000008', 'info@clinic.ch', 'jp.favre@email.ch', 'Re: Your Personalized Treatment Quote', '<p>Dear Team,</p><p>Thank you for the quote. I would like to proceed with the treatment.</p><p>Can we schedule the first session for next week? I prefer morning appointments if possible.</p><p>Best regards,<br>Jean-Pierre Favre</p>', 'sent', 'inbound', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('email-0009-0009-0009-000000000009', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'deal-0011-0011-0011-000000000011', 'info@clinic.ch', 'lucas.weber@email.ch', 'Question about Recovery', '<p>Hi,</p><p>I have been following the post-op instructions carefully. I noticed some swelling on the left side - is this normal at this stage of recovery?</p><p>Also, when can I return to my regular gym routine?</p><p>Thanks,<br>Lucas</p>', 'sent', 'inbound', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('email-0010-0010-0010-000000000010', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'deal-0001-0001-0001-000000000001', 'info@clinic.ch', 'philippe.martin@email.ch', 'Rhinoplasty Inquiry', '<p>Hello,</p><p>I attended your wellness fair booth last week and am interested in learning more about rhinoplasty options.</p><p>I have always been self-conscious about my nose profile and would like to explore what is possible.</p><p>Could you please provide more information and consultation availability?</p><p>Philippe Martin</p>', 'sent', 'inbound', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
-- Follow-up thread
('email-0011-0011-0011-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deal-0006-0006-0006-000000000006', 'marie.dumont@email.ch', 'info@clinic.ch', 'Re: Re: Your Consultation Appointment Confirmation', '<p>Dear Marie,</p><p>Great questions! Here are the answers:</p><ol><li>Recovery time is typically 1-2 weeks for initial swelling, with full results visible after 3-6 months</li><li>Yes, you will need someone to drive you home</li><li>We offer flexible payment plans - we can discuss options during your consultation</li></ol><p>See you soon!</p>', 'sent', 'outbound', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
-- Draft emails
('email-0012-0012-0012-000000000012', '77777777-aaaa-bbbb-cccc-777777777777', 'deal-0002-0002-0002-000000000002', 'charlotte.girard@email.ch', 'info@clinic.ch', 'Facelift Consultation Information', '<p>Dear Charlotte,</p><p>Thank you for your interest in our facelift procedures. I am drafting this to provide you with comprehensive information...</p>', 'draft', 'outbound', NULL, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 7: PATIENT NOTES (Clinical notes)
-- ============================================================
INSERT INTO patient_notes (id, patient_id, author_name, body, created_at) VALUES
('note-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dr. Sophie Laurent', 'Initial consultation completed. Patient is a good candidate for breast augmentation. Discussed implant options (silicone vs saline), sizing, and expected outcomes. Patient prefers a natural look. Scheduled 3D imaging for next visit.', NOW() - INTERVAL '30 days'),
('note-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dr. Sophie Laurent', '3D imaging completed. Patient reviewed simulation results and is very satisfied with projected outcome. Proceeding with surgery planning.', NOW() - INTERVAL '25 days'),
('note-0003-0003-0003-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Dr. Marc Dubois', 'Botox treatment administered. 35 units total: 20 units forehead, 10 units crow feet, 5 units glabella. Patient tolerated procedure well. Advised to avoid lying down for 4 hours.', NOW() - INTERVAL '25 days'),
('note-0004-0004-0004-000000000004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Dr. Elena Fischer', 'Laser CO2 session 1 completed. Settings: 15W, 2mm spot size. Treated full face with focus on periorbital area. Moderate erythema expected for 5-7 days. Prescribed healing ointment.', NOW() - INTERVAL '20 days'),
('note-0005-0005-0005-000000000005', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Dr. Thomas Müller', 'Gynecomastia surgery completed successfully. Liposuction of bilateral chest with gland excision. 180ml removed left, 200ml removed right. Patient stable, discharged with compression garment.', NOW() - INTERVAL '21 days'),
('note-0006-0006-0006-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Dr. Thomas Müller', 'Post-op day 7: Healing well. Minor swelling left side (normal). Bruising resolving. Patient advised to continue compression garment for another 3 weeks. Return in 2 weeks.', NOW() - INTERVAL '14 days'),
('note-0007-0007-0007-000000000007', '11111111-aaaa-bbbb-cccc-111111111111', 'Dr. Sophie Laurent', 'Rhinoplasty surgery completed. Open approach used. Dorsal hump reduced, tip refined. Splint applied. Patient stable, discharged same day with detailed care instructions.', NOW() - INTERVAL '60 days'),
('note-0008-0008-0008-000000000008', '11111111-aaaa-bbbb-cccc-111111111111', 'Dr. Sophie Laurent', '1 month post-op: Excellent healing. Swelling 80% resolved. Patient very happy with profile. No breathing issues. Continue gentle massage as instructed.', NOW() - INTERVAL '30 days'),
('note-0009-0009-0009-000000000009', '44444444-aaaa-bbbb-cccc-444444444444', 'Dr. Marc Dubois', 'Regular Botox maintenance. Same treatment areas as previous. Patient notes excellent results lasting 4 months. Increased dosage slightly per patient request.', NOW() - INTERVAL '10 days'),
('note-0010-0010-0010-000000000010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Dr. Thomas Müller', 'Pre-op assessment for liposuction. Patient in good health. BMI 27. Target areas: abdomen and flanks. Discussed realistic expectations. Lab work ordered.', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 8: TASKS (Assigned work items)
-- ============================================================
INSERT INTO tasks (id, patient_id, name, content, status, priority, type, activity_date, created_by_name, assigned_user_name, created_at) VALUES
('task-0001-0001-0001-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Call Philippe Martin', 'Follow up on rhinoplasty inquiry from wellness fair. Patient seemed very interested.', 'not_started', 'high', 'call', NOW() + INTERVAL '1 day', 'Reception', 'Charline', NOW() - INTERVAL '2 days'),
('task-0002-0002-0002-000000000002', '77777777-aaaa-bbbb-cccc-777777777777', 'Send facelift information', 'Email Charlotte Girard with detailed facelift procedure information and pricing.', 'in_progress', 'medium', 'email', NOW(), 'Dr. Sophie Laurent', 'Elite', NOW() - INTERVAL '1 day'),
('task-0003-0003-0003-000000000003', 'aaaabbbb-cccc-dddd-eeee-111111111111', 'Schedule consultation', 'François Dupont ready to book consultation for eyelid surgery. Contact to schedule.', 'not_started', 'medium', 'call', NOW() + INTERVAL '2 days', 'Reception', 'Audrey', NOW() - INTERVAL '5 days'),
('task-0004-0004-0004-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Prepare treatment room', 'Set up treatment room for Jean-Pierre Favre Botox session tomorrow.', 'completed', 'high', 'todo', NOW() - INTERVAL '1 day', 'Dr. Marc Dubois', 'Victoria', NOW() - INTERVAL '2 days'),
('task-0005-0005-0005-000000000005', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Check post-op progress', 'Call Lucas Weber to check recovery progress and answer any questions.', 'completed', 'high', 'call', NOW() - INTERVAL '10 days', 'Dr. Thomas Müller', 'Charline', NOW() - INTERVAL '14 days'),
('task-0006-0006-0006-000000000006', '99999999-aaaa-bbbb-cccc-999999999999', 'Create treatment plan', 'Prepare comprehensive pre-wedding beauty package for Claire Petit.', 'completed', 'medium', 'todo', NOW() - INTERVAL '5 days', 'Dr. Elena Fischer', 'Elite', NOW() - INTERVAL '7 days'),
('task-0007-0007-0007-000000000007', '66666666-aaaa-bbbb-cccc-666666666666', 'Reschedule facelift consultation', 'Patient David Moser no-showed. Try to reschedule when he returns from travel.', 'not_started', 'low', 'call', NOW() + INTERVAL '30 days', 'Reception', 'Audrey', NOW() - INTERVAL '30 days'),
('task-0008-0008-0008-000000000008', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Confirm surgery date', 'Final confirmation call for Sophie Bernard liposuction surgery.', 'not_started', 'high', 'call', NOW() + INTERVAL '5 days', 'Dr. Thomas Müller', 'Charline', NOW() - INTERVAL '3 days'),
('task-0009-0009-0009-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Send financing options', 'Marie Dumont requested financing information. Send available payment plan options.', 'in_progress', 'medium', 'email', NOW(), 'Reception', 'Victoria', NOW() - INTERVAL '1 day'),
('task-0010-0010-0010-000000000010', '22222222-aaaa-bbbb-cccc-222222222222', 'VIP preparation', 'Nicolas Blanc is a high-value client. Ensure premium service and discretion.', 'not_started', 'high', 'todo', NOW() + INTERVAL '20 days', 'Dr. Sophie Laurent', 'Elite', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 9: EMAIL TEMPLATES (Reusable templates)
-- ============================================================
INSERT INTO email_templates (id, name, type, subject_template, body_template, created_at) VALUES
('tmpl-0001-0001-0001-000000000001', 'Appointment Confirmation', 'patient', 'Your Appointment at {{clinic_name}} - {{appointment_date}}', '<p>Dear {{patient.first_name}},</p><p>This email confirms your appointment:</p><ul><li><strong>Date:</strong> {{appointment_date}}</li><li><strong>Time:</strong> {{appointment_time}}</li><li><strong>Service:</strong> {{service_name}}</li><li><strong>Doctor:</strong> {{doctor_name}}</li><li><strong>Location:</strong> {{location}}</li></ul><p>Please arrive 10 minutes early. Bring your insurance card and ID.</p><p>Best regards,<br>{{clinic_name}} Team</p>', NOW() - INTERVAL '90 days'),
('tmpl-0002-0002-0002-000000000002', 'Post-Op Care Instructions', 'post_op', 'Important Post-Operative Care Instructions - {{procedure_name}}', '<p>Dear {{patient.first_name}},</p><p>Congratulations on your successful {{procedure_name}}!</p><h3>Care Instructions:</h3><ul><li>Rest for the first 24-48 hours</li><li>Take medications as prescribed</li><li>Keep the treated area clean and dry</li><li>Avoid strenuous activity for {{recovery_days}} days</li><li>Attend all follow-up appointments</li></ul><h3>Contact Us If:</h3><ul><li>You experience excessive bleeding</li><li>Signs of infection (fever, increased redness)</li><li>Severe or worsening pain</li></ul><p>Your next appointment: {{followup_date}}</p><p>We are here for you!</p>', NOW() - INTERVAL '90 days'),
('tmpl-0003-0003-0003-000000000003', 'Treatment Quote', 'patient', 'Your Personalized Treatment Quote - {{service_name}}', '<p>Dear {{patient.first_name}} {{patient.last_name}},</p><p>Thank you for your consultation. We are pleased to provide your personalized treatment quote:</p><h3>Treatment Plan</h3><table><tr><td>Service:</td><td>{{service_name}}</td></tr><tr><td>Sessions:</td><td>{{session_count}}</td></tr><tr><td>Total:</td><td>CHF {{total_amount}}</td></tr></table><p>This quote is valid for 30 days.</p><p>Payment options available. Contact us to proceed!</p>', NOW() - INTERVAL '90 days'),
('tmpl-0004-0004-0004-000000000004', 'Appointment Reminder', 'patient', 'Reminder: Your Appointment Tomorrow - {{service_name}}', '<p>Dear {{patient.first_name}},</p><p>This is a friendly reminder of your appointment tomorrow:</p><ul><li><strong>Date:</strong> {{appointment_date}}</li><li><strong>Time:</strong> {{appointment_time}}</li><li><strong>Service:</strong> {{service_name}}</li></ul><h3>Preparation Tips:</h3><ul><li>{{preparation_tip_1}}</li><li>{{preparation_tip_2}}</li></ul><p>Need to reschedule? Please call us at least 24 hours in advance.</p><p>See you soon!</p>', NOW() - INTERVAL '90 days'),
('tmpl-0005-0005-0005-000000000005', 'Welcome New Patient', 'patient', 'Welcome to {{clinic_name}} - Your Journey Begins!', '<p>Dear {{patient.first_name}},</p><p>Welcome to {{clinic_name}}! We are delighted to have you.</p><h3>What to Expect:</h3><ul><li>Personalized care tailored to your needs</li><li>State-of-the-art facilities</li><li>Experienced medical professionals</li><li>24/7 support during recovery</li></ul><h3>Next Steps:</h3><ol><li>Complete your patient profile online</li><li>Upload any relevant medical documents</li><li>Schedule your first consultation</li></ol><p>Questions? Contact us anytime at {{clinic_phone}}.</p><p>Welcome aboard!</p>', NOW() - INTERVAL '90 days'),
('tmpl-0006-0006-0006-000000000006', 'Insurance Information Request', 'insurance', 'Insurance Verification Request - {{patient.full_name}}', '<p>Dear Insurance Team,</p><p>We are requesting coverage verification for the following patient:</p><ul><li><strong>Patient:</strong> {{patient.full_name}}</li><li><strong>DOB:</strong> {{patient.dob}}</li><li><strong>Policy Number:</strong> {{insurance_policy}}</li><li><strong>Planned Procedure:</strong> {{procedure_name}}</li><li><strong>Estimated Cost:</strong> CHF {{estimated_cost}}</li></ul><p>Please confirm coverage and any pre-authorization requirements.</p><p>Thank you.</p>', NOW() - INTERVAL '90 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 10: WORKFLOWS (Automated processes)
-- ============================================================
INSERT INTO workflows (id, name, trigger_type, active, config, created_at) VALUES
('wkfl-0001-0001-0001-000000000001', 'New Patient Welcome', 'patient_created', true, '{"delay_minutes": 5, "send_email": true, "template_id": "tmpl-0005-0005-0005-000000000005"}', NOW() - INTERVAL '90 days'),
('wkfl-0002-0002-0002-000000000002', 'Appointment Confirmation', 'appointment_created', true, '{"send_email": true, "template_id": "tmpl-0001-0001-0001-000000000001"}', NOW() - INTERVAL '90 days'),
('wkfl-0003-0003-0003-000000000003', 'Appointment Reminder (24h)', 'appointment_created', true, '{"delay_hours": -24, "send_email": true, "template_id": "tmpl-0004-0004-0004-000000000004"}', NOW() - INTERVAL '90 days'),
('wkfl-0004-0004-0004-000000000004', 'Post-Surgery Follow-Up', 'appointment_completed', true, '{"delay_days": 1, "send_email": true, "template_id": "tmpl-0002-0002-0002-000000000002", "filter": {"reason_contains": "surgery"}}', NOW() - INTERVAL '90 days'),
('wkfl-0005-0005-0005-000000000005', 'Quote Follow-Up', 'deal_stage_changed', true, '{"trigger_stage": "quote_sent", "delay_days": 3, "send_email": true, "create_task": true}', NOW() - INTERVAL '90 days'),
('wkfl-0006-0006-0006-000000000006', 'Post-Consultation Survey', 'appointment_completed', true, '{"delay_days": 2, "send_email": true, "filter": {"reason_contains": "consultation"}}', NOW() - INTERVAL '90 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 11: WORKFLOW ENROLLMENTS (Active workflow instances)
-- ============================================================
INSERT INTO workflow_enrollments (id, workflow_id, patient_id, deal_id, status, enrolled_at) VALUES
('enrl-0001-0001-0001-000000000001', 'wkfl-0001-0001-0001-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'deal-0001-0001-0001-000000000001', 'active', NOW() - INTERVAL '2 days'),
('enrl-0002-0002-0002-000000000002', 'wkfl-0002-0002-0002-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'deal-0010-0010-0010-000000000010', 'active', NOW() - INTERVAL '5 days'),
('enrl-0003-0003-0003-000000000003', 'wkfl-0005-0005-0005-000000000005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'deal-0008-0008-0008-000000000008', 'active', NOW() - INTERVAL '7 days'),
('enrl-0004-0004-0004-000000000004', 'wkfl-0004-0004-0004-000000000004', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'deal-0011-0011-0011-000000000011', 'completed', NOW() - INTERVAL '21 days'),
('enrl-0005-0005-0005-000000000005', 'wkfl-0001-0001-0001-000000000001', '77777777-aaaa-bbbb-cccc-777777777777', 'deal-0002-0002-0002-000000000002', 'active', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 12: MARKETING LISTS (Audience segments)
-- ============================================================
INSERT INTO marketing_lists (id, name, description, filter, created_at) VALUES
('mktl-0001-0001-0001-000000000001', 'VIP Clients', 'High-value patients with completed procedures over CHF 5000', '{"lifecycle_stage": "customer", "min_deal_value": 5000}', NOW() - INTERVAL '60 days'),
('mktl-0002-0002-0002-000000000002', 'Botox Candidates', 'Patients aged 35-55 who have shown interest in anti-aging', '{"age_range": [35, 55], "interests": ["botox", "anti-aging", "fillers"]}', NOW() - INTERVAL '45 days'),
('mktl-0003-0003-0003-000000000003', 'New Leads (Last 30 Days)', 'Recent inquiries not yet converted', '{"lifecycle_stage": "lead", "created_after": "30_days_ago"}', NOW() - INTERVAL '30 days'),
('mktl-0004-0004-0004-000000000004', 'Skin Treatment Patients', 'Patients who have had laser or skin treatments', '{"services_received": ["laser", "peeling", "dermapen"]}', NOW() - INTERVAL '30 days'),
('mktl-0005-0005-0005-000000000005', 'Follow-Up Needed', 'Patients with completed treatments needing follow-up', '{"lifecycle_stage": "customer", "last_visit_over": "90_days"}', NOW() - INTERVAL '15 days'),
('mktl-0006-0006-0006-000000000006', 'Wedding Season', 'Engaged patients for bridal packages', '{"marital_status": "engaged"}', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 13: MARKETING CAMPAIGNS (Email campaigns)
-- ============================================================
INSERT INTO marketing_campaigns (id, name, list_id, subject, status, total_recipients, total_sent, total_opened, created_at, started_at, completed_at) VALUES
('cmpn-0001-0001-0001-000000000001', 'Summer Skin Refresh Special', 'mktl-0004-0004-0004-000000000004', '☀️ Summer Special: 20% Off Laser Treatments', 'sent', 45, 43, 18, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('cmpn-0002-0002-0002-000000000002', 'VIP Appreciation Event', 'mktl-0001-0001-0001-000000000001', 'You are Invited: Exclusive VIP Evening', 'sent', 12, 12, 9, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('cmpn-0003-0003-0003-000000000003', 'New Year New You', 'mktl-0002-0002-0002-000000000002', '✨ Start the Year with Confidence', 'sent', 28, 27, 12, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
('cmpn-0004-0004-0004-000000000004', 'Bridal Beauty Package', 'mktl-0006-0006-0006-000000000006', '💒 Your Perfect Wedding Day Awaits', 'sending', 8, 5, 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
('cmpn-0005-0005-0005-000000000005', 'Win Back Campaign', 'mktl-0005-0005-0005-000000000005', 'We Miss You! Special Offer Inside', 'draft', 0, 0, 0, NOW() - INTERVAL '1 day', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 14: CONSULTATIONS (Medical records with invoices)
-- ============================================================
INSERT INTO consultations (id, patient_id, consultation_id, title, record_type, doctor_name, scheduled_at, payment_method, content, invoice_total_amount, invoice_is_paid, created_at) VALUES
('cons-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '26-00001', 'Initial Consultation - Breast Augmentation', 'notes', 'Dr. Sophie Laurent', NOW() - INTERVAL '30 days', 'card', 'Patient presents for breast augmentation consultation. Good candidate. Discussed options.', 150.00, true, NOW() - INTERVAL '30 days'),
('cons-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '26-00002', 'Botox Treatment Full Face', 'invoice', 'Dr. Marc Dubois', NOW() - INTERVAL '25 days', 'card', 'Botox 35 units administered. Forehead, crow feet, glabella.', 450.00, true, NOW() - INTERVAL '25 days'),
('cons-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '26-00003', 'Laser CO2 Session 1', 'invoice', 'Dr. Elena Fischer', NOW() - INTERVAL '20 days', 'insurance', 'First session of 3-part laser treatment series.', 500.00, true, NOW() - INTERVAL '20 days'),
('cons-0004-0004-0004-000000000004', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '26-00004', 'Gynecomastia Surgery', 'invoice', 'Dr. Thomas Müller', NOW() - INTERVAL '21 days', 'bank_transfer', 'Bilateral gynecomastia correction. Liposuction + gland excision.', 5800.00, true, NOW() - INTERVAL '21 days'),
('cons-0005-0005-0005-000000000005', '11111111-aaaa-bbbb-cccc-111111111111', '26-00005', 'Rhinoplasty Surgery', 'invoice', 'Dr. Sophie Laurent', NOW() - INTERVAL '60 days', 'bank_transfer', 'Open rhinoplasty. Dorsal hump reduction, tip refinement.', 9200.00, true, NOW() - INTERVAL '60 days'),
('cons-0006-0006-0006-000000000006', '44444444-aaaa-bbbb-cccc-444444444444', '26-00006', 'Botox Touch-Up', 'invoice', 'Dr. Marc Dubois', NOW() - INTERVAL '10 days', 'card', 'Regular maintenance Botox. Same areas as previous.', 350.00, true, NOW() - INTERVAL '10 days'),
('cons-0007-0007-0007-000000000007', '55555555-aaaa-bbbb-cccc-555555555555', '26-00007', 'Dermal Filler Treatment', 'invoice', 'Dr. Elena Fischer', NOW() - INTERVAL '45 days', 'card', 'Hyaluronic acid filler. Cheeks and nasolabial folds.', 800.00, true, NOW() - INTERVAL '45 days'),
('cons-0008-0008-0008-000000000008', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '26-00008', 'Pre-Op Assessment', 'notes', 'Dr. Thomas Müller', NOW() - INTERVAL '15 days', NULL, 'Pre-operative assessment for liposuction. All vitals normal. Labs ordered.', 0.00, false, NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 15: PATIENT INSURANCES
-- ============================================================
INSERT INTO patient_insurances (id, patient_id, provider_name, card_number, insurance_type, created_at) VALUES
('pins-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CSS Assurance', '756.1234.5678.90', 'private', NOW() - INTERVAL '30 days'),
('pins-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Swica', '756.2345.6789.01', 'private', NOW() - INTERVAL '30 days'),
('pins-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Helsana', '756.3456.7890.12', 'semi_private', NOW() - INTERVAL '30 days'),
('pins-0004-0004-0004-000000000004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sanitas', '756.4567.8901.23', 'basic', NOW() - INTERVAL '30 days'),
('pins-0005-0005-0005-000000000005', '11111111-aaaa-bbbb-cccc-111111111111', 'Groupe Mutuel', '756.5678.9012.34', 'private', NOW() - INTERVAL '60 days'),
('pins-0006-0006-0006-000000000006', '22222222-aaaa-bbbb-cccc-222222222222', 'Visana', '756.6789.0123.45', 'private', NOW() - INTERVAL '30 days'),
('pins-0007-0007-0007-000000000007', '55555555-aaaa-bbbb-cccc-555555555555', 'Concordia', '756.7890.1234.56', 'semi_private', NOW() - INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 16: WHATSAPP MESSAGES (Patient communication)
-- ============================================================
INSERT INTO whatsapp_messages (id, patient_id, to_number, from_number, body, status, direction, sent_at, created_at) VALUES
('wapp-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+41791234501', '+41211234567', 'Hello Marie! This is a reminder for your appointment tomorrow at 10:00 AM. Please confirm by replying YES.', 'delivered', 'outbound', NOW() - INTERVAL '31 days', NOW() - INTERVAL '31 days'),
('wapp-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+41211234567', '+41791234501', 'YES, confirmed. See you tomorrow!', 'delivered', 'inbound', NOW() - INTERVAL '31 days' + INTERVAL '2 hours', NOW() - INTERVAL '31 days' + INTERVAL '2 hours'),
('wapp-0003-0003-0003-000000000003', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '+41791234506', '+41211234567', 'Hi Lucas! Just checking in on your recovery. How are you feeling today?', 'delivered', 'outbound', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('wapp-0004-0004-0004-000000000004', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '+41211234567', '+41791234506', 'Hi! Feeling much better, thank you. The swelling has gone down significantly.', 'delivered', 'inbound', NOW() - INTERVAL '18 days' + INTERVAL '1 hour', NOW() - INTERVAL '18 days' + INTERVAL '1 hour'),
('wapp-0005-0005-0005-000000000005', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '+41791234505', '+41211234567', 'Dear Sophie, your surgery is confirmed for next week. Please remember to fast from midnight the night before. Any questions?', 'delivered', 'outbound', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('wapp-0006-0006-0006-000000000006', '99999999-aaaa-bbbb-cccc-999999999999', '+41791234515', '+41211234567', 'Congratulations on your upcoming wedding Claire! Your beauty package appointment is confirmed for the 14th. 💒✨', 'delivered', 'outbound', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 17: MARKETING CAMPAIGN RECIPIENTS (Tracking)
-- ============================================================
INSERT INTO marketing_campaign_recipients (id, campaign_id, patient_id, email, status, sent_at, opened_at) VALUES
-- Summer Skin campaign recipients
('mcpr-0001-0001-0001-000000000001', 'cmpn-0001-0001-0001-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'anna.schneider@email.ch', 'opened', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days'),
('mcpr-0002-0002-0002-000000000002', 'cmpn-0001-0001-0001-000000000001', 'aaaabbbb-cccc-dddd-eeee-222222222222', 'nathalie.simon@email.ch', 'opened', NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days'),
('mcpr-0003-0003-0003-000000000003', 'cmpn-0001-0001-0001-000000000001', '88888888-aaaa-bbbb-cccc-888888888888', 'pierre.roux@email.ch', 'sent', NOW() - INTERVAL '30 days', NULL),
-- VIP Event recipients
('mcpr-0004-0004-0004-000000000004', 'cmpn-0002-0002-0002-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'marie.dumont@email.ch', 'opened', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('mcpr-0005-0005-0005-000000000005', 'cmpn-0002-0002-0002-000000000002', '22222222-aaaa-bbbb-cccc-222222222222', 'nicolas.blanc@email.ch', 'opened', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days'),
('mcpr-0006-0006-0006-000000000006', 'cmpn-0002-0002-0002-000000000002', '66666666-aaaa-bbbb-cccc-666666666666', 'david.moser@email.ch', 'opened', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days'),
-- Bridal campaign (in progress)
('mcpr-0007-0007-0007-000000000007', 'cmpn-0004-0004-0004-000000000004', '99999999-aaaa-bbbb-cccc-999999999999', 'claire.petit@email.ch', 'opened', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('mcpr-0008-0008-0008-000000000008', 'cmpn-0004-0004-0004-000000000004', '55555555-aaaa-bbbb-cccc-555555555555', 'emma.leroy@email.ch', 'sent', NOW() - INTERVAL '2 days', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART 18: DOCUMENTS (Patient documents)
-- ============================================================
INSERT INTO documents (id, patient_id, deal_id, type, title, content, created_by, created_at) VALUES
('docs-0001-0001-0001-000000000001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'deal-0011-0011-0011-000000000011', 'post_op', 'Gynecomastia Post-Op Instructions', 'Detailed post-operative care instructions for gynecomastia surgery including compression garment guidelines, activity restrictions, and medication schedule.', 'Dr. Thomas Müller', NOW() - INTERVAL '21 days'),
('docs-0002-0002-0002-000000000002', '11111111-aaaa-bbbb-cccc-111111111111', 'deal-0012-0012-0012-000000000012', 'post_op', 'Rhinoplasty Recovery Guide', 'Complete rhinoplasty recovery guide with daily care instructions, splint care, and what to expect during the healing process.', 'Dr. Sophie Laurent', NOW() - INTERVAL '60 days'),
('docs-0003-0003-0003-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deal-0006-0006-0006-000000000006', 'report', 'Breast Augmentation Consultation Report', 'Summary of consultation findings, patient goals, recommended implant options, and surgical approach discussion.', 'Dr. Sophie Laurent', NOW() - INTERVAL '30 days'),
('docs-0004-0004-0004-000000000004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'deal-0010-0010-0010-000000000010', 'other', 'Pre-Op Clearance Form', 'Medical clearance documentation for liposuction surgery including lab results and anesthesia evaluation.', 'Dr. Thomas Müller', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COMPLETE!
-- ============================================================
COMMIT;

-- Summary of seeded data:
-- - 4 Providers (doctors)
-- - 20 Patients with full profiles
-- - 11 Deal stages
-- - 15 Deals at various pipeline stages
-- - 20 Appointments (past, today, future)
-- - 12 Email threads (inbound + outbound)
-- - 10 Patient clinical notes
-- - 10 Tasks assigned to team members
-- - 6 Email templates
-- - 6 Automated workflows
-- - 5 Workflow enrollments
-- - 6 Marketing audience lists
-- - 5 Marketing campaigns
-- - 8 Campaign recipients with tracking
-- - 8 Consultation records with invoices
-- - 7 Patient insurance records
-- - 6 WhatsApp messages
-- - 4 Patient documents
