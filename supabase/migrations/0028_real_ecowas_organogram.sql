-- Replace the placeholder demo org structure with the actual ECOWAS
-- Parliament organogram (as provided by the institution), down to
-- Directorate/Division/Office level. This is provisional — "for now, until
-- HR updates the organogram" — and is expected to be revised again once HR
-- supplies a confirmed structure.
--
-- Scope note: `positions` is Role + Person + OrgUnit with no grade/job-title
-- field, so the individual named posts shown on the chart (e.g. "13
-- Committee Clerks, P2/P3/P4", "11 Drivers, G1/G2/G3") are not modelled as
-- separate org_units here — those are staff establishment slots within a
-- Division, to be added as real positions once people are assigned. Only
-- the boxes that are themselves organizational units (Directorate/
-- Division/Office, each potentially a document custodian) become org_units.
--
-- Registry assumption: nothing on the chart is literally labeled
-- "Registry." General Admin & Conference Division is flagged is_registry
-- as the closest functional match (admin/conference services commonly
-- absorb registry & mail intake) — flag this explicitly for HR to confirm
-- or reassign; it's a one-column UPDATE, not a structural change.

-- 1. New org_units for the real structure. Fixed ids so later statements in
--    this migration (position reassignment, prefix table) can reference them.
insert into org_units (id, unit_type, name, parent_id) values
  ('0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9', 'office',      'Office of the Honourable Speaker', null),
  ('d1d17549-dc55-4a01-bddc-6d5e21eeb6bc', 'office',      'Office of the Secretary-General', '0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9'),
  ('0d70dc90-a7db-4448-9113-ca0223eccf84', 'office',      'Office of the Principal Legal Adviser', 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc'),
  ('ebc6df99-47d0-4edb-89bb-9d056553056f', 'office',      'Bureau & Strategic Planning', 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc'),
  ('9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8', 'division',    'Communication Division', 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc'),
  ('211e3e9d-81c9-450b-aa9f-9ff85b15c3e8', 'division',    'Protocol Division', 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc'),
  ('7d61f573-12b3-44a3-b455-be58ecbb26a8', 'directorate', 'Directorate of Parliamentary Affairs & Research', 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc'),
  ('8fa8630d-6a03-4794-a891-d210b2340082', 'division',    'Parliamentary Business Division', '7d61f573-12b3-44a3-b455-be58ecbb26a8'),
  ('ae4aff08-382d-4f7e-bdb6-e9cfd5876b0c', 'division',    'Hansard Division', '7d61f573-12b3-44a3-b455-be58ecbb26a8'),
  ('0105ea60-a915-4742-9dba-9f79e3ba0e67', 'division',    'Language Services Division', '7d61f573-12b3-44a3-b455-be58ecbb26a8'),
  ('01041cb6-3561-490f-a6fc-e1cb15ddfbc3', 'division',    'Library, Documentation & Research Division', '7d61f573-12b3-44a3-b455-be58ecbb26a8'),
  ('7fe2fde1-f501-430b-8799-2877c3925357', 'division',    'Finance Division', 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec'),
  ('da942ac0-b8f8-4f02-9135-0d8d5bef8465', 'division',    'General Admin & Conference Division', 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec'),
  ('79eba651-ff78-480e-8967-0fe68e346ffe', 'division',    'Infrastructure Division', 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec');

update org_units set is_registry = true where id = 'da942ac0-b8f8-4f02-9135-0d8d5bef8465'; -- General Admin & Conference Division

-- 2. Existing units that match the real chart 1:1 — reparent/rename in
--    place rather than retire+recreate, since it's the same real unit.
update org_units set parent_id = 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc' -- Office of the Secretary-General
  where id = 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec'; -- Directorate of Administration & Finance

update org_units set name = 'Human Resource Division'
  where id = '933c1b52-7efe-4f4c-8690-8e5a39276982'; -- (was "Human Resources Division"), parent already correct

-- 3. Retire demo-only units that don't correspond to anything on the real
--    chart, pointing each at its closest real successor.
update org_units set effective_to = now(), superseded_by_id = '9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8' -- Communication Division
  where id in (
    'a19fb1ec-3494-486d-8329-262b9ac492ef', -- Corporate Communication Division
    'a32901a9-bcc1-4b1f-ac02-46d28f875584', -- Directorate of Communication
    '0204440c-a660-4e6e-b146-111f2d9bfe1c'  -- Press & Media Office
  );

update org_units set effective_to = now(), superseded_by_id = 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc' -- Office of the Secretary-General
  where id = '68d3a29c-ae36-47cb-8902-ca4d10c8ef76'; -- Office of the President

update org_units set effective_to = now(), superseded_by_id = 'da942ac0-b8f8-4f02-9135-0d8d5bef8465' -- General Admin & Conference Division
  where id = '1e693d75-2bec-4fb4-b762-d70cb382f194'; -- Registry Office

-- 4. Move demo positions off retired units onto their real successors.
update positions set org_unit_id = '9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8' -- Communication Division
  where id in (
    'd4f02f33-f871-41fa-839b-61916ceb9c79', -- demo.admin, was Directorate of Communication (head)
    '1468e0ab-ed63-40c4-872e-1b148d51b9a3', -- demo.commsmanager, was Press & Media Office (office_manager)
    '6706e695-e53e-40c5-a7fd-9828e37bb74b'  -- demo.staff, was Press & Media Office (staff)
  );

update positions set org_unit_id = 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc' -- Office of the Secretary-General
  where id = '376ed70f-1fee-4079-95f4-9e5da3574f78'; -- demo.sg, was Office of the President

update positions set org_unit_id = 'da942ac0-b8f8-4f02-9135-0d8d5bef8465' -- General Admin & Conference Division
  where id = 'd52dc16f-f328-40e3-8a57-2a5782cfaf8c'; -- demo.registry, was Registry Office

-- 5. Prefix decode table: retire prefixes for retired units, add prefixes
--    for every new unit (unminted code origination fails without one).
update prefix_decode_table set effective_to = now()
  where org_unit_id in (
    'a19fb1ec-3494-486d-8329-262b9ac492ef', -- Corporate Communication Division
    'a32901a9-bcc1-4b1f-ac02-46d28f875584', -- Directorate of Communication
    '0204440c-a660-4e6e-b146-111f2d9bfe1c', -- Press & Media Office
    '68d3a29c-ae36-47cb-8902-ca4d10c8ef76', -- Office of the President
    '1e693d75-2bec-4fb4-b762-d70cb382f194'  -- Registry Office
  ) and effective_to is null;

update prefix_decode_table set unit_name = 'Human Resource Division'
  where org_unit_id = '933c1b52-7efe-4f4c-8690-8e5a39276982' and effective_to is null;

insert into prefix_decode_table (prefix, unit_name, org_unit_id) values
  ('SPK', 'Office of the Honourable Speaker', '0f4c2cd7-8c74-46ef-8d35-974a5ee8d3b9'),
  ('OSG', 'Office of the Secretary-General', 'd1d17549-dc55-4a01-bddc-6d5e21eeb6bc'),
  ('LEG', 'Office of the Principal Legal Adviser', '0d70dc90-a7db-4448-9113-ca0223eccf84'),
  ('BSP', 'Bureau & Strategic Planning', 'ebc6df99-47d0-4edb-89bb-9d056553056f'),
  ('COM', 'Communication Division', '9f82a92b-a0b5-4fa2-99e4-8ced196eb1c8'),
  ('PRO', 'Protocol Division', '211e3e9d-81c9-450b-aa9f-9ff85b15c3e8'),
  ('PAR', 'Directorate of Parliamentary Affairs & Research', '7d61f573-12b3-44a3-b455-be58ecbb26a8'),
  ('PBD', 'Parliamentary Business Division', '8fa8630d-6a03-4794-a891-d210b2340082'),
  ('HAN', 'Hansard Division', 'ae4aff08-382d-4f7e-bdb6-e9cfd5876b0c'),
  ('LSD', 'Language Services Division', '0105ea60-a915-4742-9dba-9f79e3ba0e67'),
  ('LDR', 'Library, Documentation & Research Division', '01041cb6-3561-490f-a6fc-e1cb15ddfbc3'),
  ('FIN', 'Finance Division', '7fe2fde1-f501-430b-8799-2877c3925357'),
  ('GAC', 'General Admin & Conference Division', 'da942ac0-b8f8-4f02-9135-0d8d5bef8465'),
  ('INF', 'Infrastructure Division', '79eba651-ff78-480e-8967-0fe68e346ffe');
