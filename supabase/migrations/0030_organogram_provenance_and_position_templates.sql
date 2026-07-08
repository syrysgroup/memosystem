-- Backfills provenance on the org_units created by 0028, and creates a
-- position_type template for every named post shown across the four source
-- chart images -- not as pre-filled blank Positions, as establishment
-- templates that real positions will reference once people are assigned.
--
-- Chart identification used below:
--   SPEAKER chart = Honourable Speaker overview (shows Speaker -> SG ->
--     {Director Admin & Finance, Director Parliamentary Affairs & Research}
--     as direct, drawn-in-image lines)
--   SG chart      = Secretary-General's own detail chart (Legal, Bureau &
--     Strategic Planning, Communication Division, Protocol Division as
--     direct children, drawn within this same image)
--   DAF chart     = Director Administration & Finance's own detail chart
--     (Finance, General Admin & Conference, Infrastructure, Human Resource
--     Divisions as direct children, drawn within this same image)
--   PAR chart     = Director Parliamentary Affairs & Research's own detail
--     chart (Parliamentary Business, Hansard, Language Services, Library/
--     Documentation & Research Divisions as direct children, drawn within
--     this same image)
--
-- The SG, DAF, and PAR chart root boxes are each identified with their
-- counterpart node in the SPEAKER chart by matching title + grade across
-- the two images -- none of the three detail charts draws a line back to
-- its parent within its own image. That is flagged explicitly below on
-- exactly the three org_units rows where it applies (Office of the
-- Secretary-General, Directorate of Administration & Finance, Directorate
-- of Parliamentary Affairs & Research); everywhere else, the parent-child
-- edge is drawn directly within a single source image.

-- 1. Provenance backfill on org_units.

update org_units set source =
  'Seeded from institution-provided scanned organogram images (four charts), pending HR confirmation. Root node, no parent shown.'
  where id = '0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9'; -- Office of the Honourable Speaker

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link to Office of the Honourable Speaker is drawn directly within the SPEAKER chart. Its own subordinate structure (Office of the Principal Legal Adviser, Bureau & Strategic Planning, Communication Division, Protocol Division, and the two Directorates) comes from a separate chart (SG chart) whose root box ("Secretary General (D2)") is identified with this node by matching title and grade across the two images, not by an explicit cross-chart pointer -- the SG chart does not itself draw a line back to the Speaker. Confirm with HR before treating this identification as certain.'
  where id = 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc'; -- Office of the Secretary-General

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link to the Office of the Secretary-General is drawn directly within the SG chart.'
  where id in (
    '0d70dc90-a7db-4448-9113-ca0223eccf84', -- Office of the Principal Legal Adviser
    'ebc6df99-47d0-4edb-89bb-9d056553056f', -- Bureau & Strategic Planning
    '211e3e9d-81c9-450b-aa9f-9ff85b15c3e8'  -- Protocol Division
  );

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link to the Office of the Secretary-General is drawn directly within the SG chart. Note: this row supersedes three earlier demo-only org units (Directorate of Communication, Corporate Communication Division, Press & Media Office) invented before the real organogram was provided -- none of those three appear anywhere on the actual chart. They were retired in favor of this one because "Communication Division" is the only communications-related unit the real chart shows, reporting directly to the SG. Confirm with HR that no separate press/media office actually exists.'
  where id = '9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8'; -- Communication Division

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link to Office of the Secretary-General is drawn directly within the SPEAKER chart. Its own subordinate structure (the four Divisions) comes from a separate chart (DAF chart) whose root box ("Director Administration and Finance, D1" -- source chart shows an apparent scan typo, "Financece") is identified with this node by matching title and grade across the two images, not an explicit cross-chart pointer -- the DAF chart does not itself draw a line back to the SG. Confirm with HR before treating this identification as certain.'
  where id = 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec'; -- Directorate of Administration & Finance

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link drawn directly within the DAF chart.'
  where id = '7fe2fde1-f501-430b-8799-2877c3925357'; -- Finance Division

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link drawn directly within the DAF chart. Note: is_registry was set on this unit as a provisional assumption -- nothing on the source chart is labeled "Registry"; this is the closest functional match (admin/conference services). Confirm with HR or reassign.'
  where id = 'da942ac0-b8f8-4f02-9135-0d8d5bef8465'; -- General Admin & Conference Division

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link drawn directly within the DAF chart.'
  where id = '79eba651-ff78-480e-8967-0fe68e346ffe'; -- Infrastructure Division

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link drawn directly within the DAF chart. Name corrected from prior demo seed ("Human Resources Division" -> "Human Resource Division") to match the source chart exactly.'
  where id = '933c1b52-7efe-4f4c-8690-8e5a39276982'; -- Human Resource Division

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link to Office of the Secretary-General is drawn directly within the SPEAKER chart. Its own subordinate structure (the four Divisions) comes from a separate chart (PAR chart) whose root box ("Director, Parliamentary Affairs & Research, D1") is identified with this node by matching title and grade across the two images, not an explicit cross-chart pointer -- the PAR chart does not itself draw a line back to the SG. This is the specific inference flagged for confirmation before treating it as structural fact. Confirm with HR.'
  where id = '7d61f573-12b3-44a3-b455-be58ecbb26a8'; -- Directorate of Parliamentary Affairs & Research

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link drawn directly within the PAR chart.'
  where id in (
    '8fa8630d-6a03-4794-a891-d210b2340082', -- Parliamentary Business Division
    'ae4aff08-382d-4f7e-bdb6-e9cfd5876b0c', -- Hansard Division
    '0105ea60-a915-4742-9dba-9f79e3ba0e67', -- Language Services Division
    '01041cb6-3561-490f-a6fc-e1cb15ddfbc3'  -- Library, Documentation & Research Division
  );

-- 2. Position-type templates, grouped by org unit, one row per named box on
--    the source charts. grade_band carries the full slash-separated range
--    as shown; slot_count matches the stated headcount (default 1 where
--    unstated). No actual `positions` rows are created here -- only real
--    incumbents get one, referencing these templates.

-- Office of the Honourable Speaker (SPEAKER chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9', 'Honourable Speaker', ARRAY[]::text[], 1, 'Seeded from SPEAKER chart, pending HR confirmation. Elected/political office; no grade code shown on the source chart.'),
  ('0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9', 'Office Aide', ARRAY['G1','G2','G3'], 1, 'Seeded from SPEAKER chart, pending HR confirmation.'),
  ('0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9', 'Communication Adviser', ARRAY['P3','P4'], 1, 'Seeded from SPEAKER chart, pending HR confirmation.'),
  ('0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9', 'Executive Assistant', ARRAY['P4'], 1, 'Seeded from SPEAKER chart, pending HR confirmation. Source chart reads "Executive of Assistant" -- treated as a scan artifact of "Executive Assistant".'),
  ('0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9', 'Administrative Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from SPEAKER chart, pending HR confirmation.');

-- Office of the Secretary-General (SG chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('d1d17549-dc55-4a01-bddc-6d5e21eeb6bc', 'Secretary-General', ARRAY['D2'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('d1d17549-dc55-4a01-bddc-6d5e21eeb6bc', 'Office Manager', ARRAY['G5','G6','G7'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('d1d17549-dc55-4a01-bddc-6d5e21eeb6bc', 'Administrative Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('d1d17549-dc55-4a01-bddc-6d5e21eeb6bc', 'Office Aide', ARRAY['G1','G2','G3'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('d1d17549-dc55-4a01-bddc-6d5e21eeb6bc', 'Inter-institutional Liaison Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from SG chart, pending HR confirmation.');

-- Office of the Principal Legal Adviser (SG chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('0d70dc90-a7db-4448-9113-ca0223eccf84', 'Principal Legal Adviser', ARRAY['P5'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('0d70dc90-a7db-4448-9113-ca0223eccf84', 'Legal Adviser', ARRAY['P3','P4'], 1, 'Seeded from SG chart, pending HR confirmation.');

-- Bureau & Strategic Planning (SG chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('ebc6df99-47d0-4edb-89bb-9d056553056f', 'Bureau & Strategic Planning Manager', ARRAY['P5'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('ebc6df99-47d0-4edb-89bb-9d056553056f', 'Strategic Planning Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from SG chart, pending HR confirmation.');

-- Communication Division (SG chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8', 'Head of Communication Division', ARRAY['P5'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8', 'Communication Officer', ARRAY['P3','P4'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8', 'Assistant Communication Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8', 'Communication Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from SG chart, pending HR confirmation.');

-- Protocol Division (SG chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('211e3e9d-81c9-450b-aa9f-9ff85b15c3e8', 'Head of Protocol Division', ARRAY['P5'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('211e3e9d-81c9-450b-aa9f-9ff85b15c3e8', 'Protocol Officer', ARRAY['P3','P4'], 1, 'Seeded from SG chart, pending HR confirmation.'),
  ('211e3e9d-81c9-450b-aa9f-9ff85b15c3e8', 'Assistant Protocol Officer', ARRAY['P1','P2','P3'], 2, 'Seeded from SG chart, pending HR confirmation. Source chart states "02 Assistant Protocol Officers".'),
  ('211e3e9d-81c9-450b-aa9f-9ff85b15c3e8', 'Protocol Assistant', ARRAY['G4','G5','G6'], 5, 'Seeded from SG chart, pending HR confirmation. Source chart states "05 Protocol Assistants".');

-- Directorate of Administration & Finance (DAF chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec', 'Director, Administration & Finance', ARRAY['D1'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec', 'Office Manager', ARRAY['G5','G6','G7'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec', 'Office Aide', ARRAY['G1','G2','G3'], 1, 'Seeded from DAF chart, pending HR confirmation.');

-- Finance Division (DAF chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('7fe2fde1-f501-430b-8799-2877c3925357', 'Head of Finance Division', ARRAY['P5'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('7fe2fde1-f501-430b-8799-2877c3925357', 'Accountant, Financial Reporting & Treasury', ARRAY['P3','P4'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('7fe2fde1-f501-430b-8799-2877c3925357', 'Assistant Accountant', ARRAY['P1','P2','P3'], 2, 'Seeded from DAF chart, pending HR confirmation. Source chart states "02 Assistant Accountants".'),
  ('7fe2fde1-f501-430b-8799-2877c3925357', 'Budget Officer', ARRAY['P3','P4'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('7fe2fde1-f501-430b-8799-2877c3925357', 'Assistant Budget Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from DAF chart, pending HR confirmation.');

-- General Admin & Conference Division (DAF chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Head of General Admin & Conference Division', ARRAY['P5'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Administrative Officer', ARRAY['P3','P4'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Assistant Administrative Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Stores Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Receptionist', ARRAY['G3','G4','G5'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Office Aide', ARRAY['G1','G2','G3'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Conference Officer', ARRAY['P3','P4'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Conference Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Procurement Officer', ARRAY['P3','P4'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'Procurement Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from DAF chart, pending HR confirmation.');

-- Infrastructure Division (DAF chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'Head of Infrastructure Division', ARRAY['P5'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'IT Officer', ARRAY['P3','P4'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'Webmaster', ARRAY['P1','P2','P3'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'Facility Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'Technician', ARRAY['G4','G5','G6'], 2, 'Seeded from DAF chart, pending HR confirmation. Source chart states "02 Technicians".'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'Transport Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'Driver', ARRAY['G1','G2','G3'], 11, 'Seeded from DAF chart, pending HR confirmation. Source chart states "11 Drivers".'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'Chief Security Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'Security Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from DAF chart, pending HR confirmation.');

-- Human Resource Division (DAF chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('933c1b52-7efe-4f4c-8690-8e5a39276982', 'Head of Human Resource Division', ARRAY['P5'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('933c1b52-7efe-4f4c-8690-8e5a39276982', 'Human Resource Officer', ARRAY['P3','P4'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('933c1b52-7efe-4f4c-8690-8e5a39276982', 'Assistant HR Officer', ARRAY['P1','P2','P3'], 1, 'Seeded from DAF chart, pending HR confirmation.'),
  ('933c1b52-7efe-4f4c-8690-8e5a39276982', 'HR Clerk', ARRAY['G2','G3','G4'], 1, 'Seeded from DAF chart, pending HR confirmation.');

-- Directorate of Parliamentary Affairs & Research (PAR chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('7d61f573-12b3-44a3-b455-be58ecbb26a8', 'Director, Parliamentary Affairs & Research', ARRAY['D1'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('7d61f573-12b3-44a3-b455-be58ecbb26a8', 'Office Manager', ARRAY['G5','G6','G7'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('7d61f573-12b3-44a3-b455-be58ecbb26a8', 'Clerk, Parliamentary Groupings', ARRAY['P2','P3','P4'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('7d61f573-12b3-44a3-b455-be58ecbb26a8', 'Office Aide', ARRAY['G1','G2','G3'], 1, 'Seeded from PAR chart, pending HR confirmation.');

-- Parliamentary Business Division (PAR chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('8fa8630d-6a03-4794-a891-d210b2340082', 'Head of Parliamentary Business Division', ARRAY['P5'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('8fa8630d-6a03-4794-a891-d210b2340082', 'Committee Clerk', ARRAY['P2','P3','P4'], 13, 'Seeded from PAR chart, pending HR confirmation. Source chart states "13 Committee Clerks".'),
  ('8fa8630d-6a03-4794-a891-d210b2340082', 'Committee Clerk Assistant', ARRAY['G4','G5','G6'], 3, 'Seeded from PAR chart, pending HR confirmation. Source chart states "03 Committee Clerk Assistants".');

-- Hansard Division (PAR chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('ae4aff08-382d-4f7e-bdb6-e9cfd5876b0c', 'Head of Hansard Division', ARRAY['P5'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('ae4aff08-382d-4f7e-bdb6-e9cfd5876b0c', 'Assistant Editor of Debates', ARRAY['P1','P2','P3'], 3, 'Seeded from PAR chart, pending HR confirmation. Source chart states "03 Assistant Editors of Debates".'),
  ('ae4aff08-382d-4f7e-bdb6-e9cfd5876b0c', 'Reporter', ARRAY['P1','P2'], 3, 'Seeded from PAR chart, pending HR confirmation. Source chart states "03 Reporters".');

-- Language Services Division (PAR chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('0105ea60-a915-4742-9dba-9f79e3ba0e67', 'Head of Language Services Division', ARRAY['P5'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('0105ea60-a915-4742-9dba-9f79e3ba0e67', 'Revisor', ARRAY['P5'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('0105ea60-a915-4742-9dba-9f79e3ba0e67', 'Translator', ARRAY['P3','P4'], 3, 'Seeded from PAR chart, pending HR confirmation. Source chart states "03 Translators".'),
  ('0105ea60-a915-4742-9dba-9f79e3ba0e67', 'Language Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from PAR chart, pending HR confirmation.');

-- Library, Documentation & Research Division (PAR chart)
insert into position_types (org_unit_id, title, grade_band, slot_count, source) values
  ('01041cb6-3561-490f-a6fc-e1cb15ddfbc3', 'Head of Library, Documentation & Research Division', ARRAY['P5'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('01041cb6-3561-490f-a6fc-e1cb15ddfbc3', 'Parliamentary Research Officer', ARRAY['P2','P3','P4'], 3, 'Seeded from PAR chart, pending HR confirmation. Source chart states "03 Parliamentary Research Officers".'),
  ('01041cb6-3561-490f-a6fc-e1cb15ddfbc3', 'Librarian/Documentalist', ARRAY['P3','P4'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('01041cb6-3561-490f-a6fc-e1cb15ddfbc3', 'Assistant Librarian/Documentalist', ARRAY['P1','P2','P3'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('01041cb6-3561-490f-a6fc-e1cb15ddfbc3', 'Library Assistant', ARRAY['G4','G5','G6'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('01041cb6-3561-490f-a6fc-e1cb15ddfbc3', 'Reproduction Assistant', ARRAY['G2','G3','G4'], 1, 'Seeded from PAR chart, pending HR confirmation.'),
  ('01041cb6-3561-490f-a6fc-e1cb15ddfbc3', 'Document Assistant', ARRAY['G1','G2','G3'], 1, 'Seeded from PAR chart, pending HR confirmation.');

-- 3. Link the demo incumbents that have a clean, unambiguous title match to
--    a template, so the new columns are exercised end-to-end and not just
--    theoretical. Left unlinked where no template title is a clean match
--    (demo.commsmanager, demo.staff, demo.registry) -- forcing an
--    approximate fit would misrepresent the data.

update positions set
  position_type_id = (select id from position_types where org_unit_id = 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc' and title = 'Secretary-General'),
  grade = 'D2'
  where id = '376ed70f-1fee-4079-95f4-9e5da3574f78'; -- demo.sg

update positions set
  position_type_id = (select id from position_types where org_unit_id = 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec' and title = 'Director, Administration & Finance'),
  grade = 'D1'
  where id = 'b5e514af-cb9b-4d14-a560-d025c8ba80ba'; -- demo.finance

update positions set
  position_type_id = (select id from position_types where org_unit_id = '933c1b52-7efe-4f4c-8690-8e5a39276982' and title = 'Head of Human Resource Division'),
  grade = 'P5'
  where id = 'a7b6d121-23c1-484b-a0ec-5f8fc4a5c9e2'; -- demo.hr

update positions set
  position_type_id = (select id from position_types where org_unit_id = '9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8' and title = 'Head of Communication Division'),
  grade = 'P5'
  where id = 'd4f02f33-f871-41fa-839b-61916ceb9c79'; -- demo.admin
