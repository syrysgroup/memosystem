-- Optional demo data: a small org hierarchy, one Position per role, and a
-- handful of sample documents so a reviewer can log in and see something
-- without first building an organogram by hand. Safe to skip (or delete
-- afterwards) on a real institutional deployment — nothing else in the
-- schema depends on these rows. Credentials: see README "Demo accounts"
-- (all demo accounts share the password "EcowasDemo#2026").
--
-- Note: inserts into auth.users/auth.identities and the positions.named_role
-- bypass (via a temporary trigger disable) require running as the Postgres
-- service role — this migration cannot be applied through the app's own
-- authenticated session, only via the Supabase SQL editor/CLI/MCP as done
-- here.

insert into org_units (id, parent_id, unit_type, name) values
  ('68d3a29c-ae36-47cb-8902-ca4d10c8ef76', null, 'directorate', 'Office of the President'),
  ('dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec', null, 'directorate', 'Directorate of Administration & Finance'),
  ('933c1b52-7efe-4f4c-8690-8e5a39276982', 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec', 'division', 'Human Resources Division'),
  ('1e693d75-2bec-4fb4-b762-d70cb382f194', 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec', 'office', 'Registry Office'),
  ('a32901a9-bcc1-4b1f-ac02-46d28f875584', null, 'directorate', 'Directorate of Communication'),
  ('a19fb1ec-3494-486d-8329-262b9ac492ef', 'a32901a9-bcc1-4b1f-ac02-46d28f875584', 'division', 'Corporate Communication Division'),
  ('0204440c-a660-4e6e-b146-111f2d9bfe1c', 'a19fb1ec-3494-486d-8329-262b9ac492ef', 'office', 'Press & Media Office');

insert into prefix_decode_table (prefix, unit_name, org_unit_id) values
  ('OSG', 'Office of the President', '68d3a29c-ae36-47cb-8902-ca4d10c8ef76'),
  ('DAF', 'Directorate of Administration & Finance', 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec'),
  ('HRD', 'Human Resources Division', '933c1b52-7efe-4f4c-8690-8e5a39276982'),
  ('REG', 'Registry Office', '1e693d75-2bec-4fb4-b762-d70cb382f194'),
  ('DOC', 'Directorate of Communication', 'a32901a9-bcc1-4b1f-ac02-46d28f875584'),
  ('CCD', 'Corporate Communication Division', 'a19fb1ec-3494-486d-8329-262b9ac492ef'),
  ('PMO', 'Press & Media Office', '0204440c-a660-4e6e-b146-111f2d9bfe1c');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token
) values
  ('00000000-0000-0000-0000-000000000000', 'bcf1711b-06e6-4031-8137-bb81c377f34e', 'authenticated', 'authenticated', 'demo.admin@ecowas-demo.org', extensions.crypt('EcowasDemo#2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
  ('00000000-0000-0000-0000-000000000000', '4ec49df2-a7b2-4fc6-bd2c-aca1ef736207', 'authenticated', 'authenticated', 'demo.sg@ecowas-demo.org', extensions.crypt('EcowasDemo#2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
  ('00000000-0000-0000-0000-000000000000', '12c2a093-cc09-4d1f-a0e7-f1d3e1145f09', 'authenticated', 'authenticated', 'demo.finance@ecowas-demo.org', extensions.crypt('EcowasDemo#2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
  ('00000000-0000-0000-0000-000000000000', '05af06aa-4227-44dd-b4c0-d12ada6b25cb', 'authenticated', 'authenticated', 'demo.hr@ecowas-demo.org', extensions.crypt('EcowasDemo#2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
  ('00000000-0000-0000-0000-000000000000', '53c21cf5-f5f9-4c56-a79a-da6b32f60970', 'authenticated', 'authenticated', 'demo.commsmanager@ecowas-demo.org', extensions.crypt('EcowasDemo#2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
  ('00000000-0000-0000-0000-000000000000', '138fb3b9-8fe7-463a-8d58-b2b563ab43bf', 'authenticated', 'authenticated', 'demo.staff@ecowas-demo.org', extensions.crypt('EcowasDemo#2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
  ('00000000-0000-0000-0000-000000000000', '31046f6e-e84f-4f5b-bd2c-576622a6a330', 'authenticated', 'authenticated', 'demo.registry@ecowas-demo.org', extensions.crypt('EcowasDemo#2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select gen_random_uuid(), u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', now(), now(), now()
from auth.users u
where u.email like 'demo.%@ecowas-demo.org';

insert into profiles (id, full_name, email, is_admin, on_leave) values
  ('bcf1711b-06e6-4031-8137-bb81c377f34e', 'Amara Okonkwo (Demo Admin)', 'demo.admin@ecowas-demo.org', true, false),
  ('4ec49df2-a7b2-4fc6-bd2c-aca1ef736207', 'H.E. Fatoumata Diallo (Demo SG)', 'demo.sg@ecowas-demo.org', false, false),
  ('12c2a093-cc09-4d1f-a0e7-f1d3e1145f09', 'Kwame Boateng (Demo Director Admin & Finance)', 'demo.finance@ecowas-demo.org', false, false),
  ('05af06aa-4227-44dd-b4c0-d12ada6b25cb', 'Aissatou Barry (Demo Head of HR)', 'demo.hr@ecowas-demo.org', false, false),
  ('53c21cf5-f5f9-4c56-a79a-da6b32f60970', 'Ibrahim Toure (Demo Office Manager)', 'demo.commsmanager@ecowas-demo.org', false, false),
  ('138fb3b9-8fe7-463a-8d58-b2b563ab43bf', 'Grace Mensah (Demo Staff)', 'demo.staff@ecowas-demo.org', false, true),
  ('31046f6e-e84f-4f5b-bd2c-576622a6a330', 'Samuel Adeyemi (Demo Registry)', 'demo.registry@ecowas-demo.org', false, false);

update profiles set leave_start = current_date - 2, leave_end = current_date + 5
  where id = '138fb3b9-8fe7-463a-8d58-b2b563ab43bf';

-- named_role is normally admin-only-settable via the app (see 0017); the
-- seed itself needs to bypass that check once, since it runs with no
-- authenticated session (auth.uid() is null here).
alter table positions disable trigger positions_named_role_admin_only_insert;

insert into positions (id, org_unit_id, profile_id, role, named_role) values
  ('d4f02f33-f871-41fa-839b-61916ceb9c79', 'a32901a9-bcc1-4b1f-ac02-46d28f875584', 'bcf1711b-06e6-4031-8137-bb81c377f34e', 'head', null),
  ('376ed70f-1fee-4079-95f4-9e5da3574f78', '68d3a29c-ae36-47cb-8902-ca4d10c8ef76', '4ec49df2-a7b2-4fc6-bd2c-aca1ef736207', 'head', 'sg'),
  ('b5e514af-cb9b-4d14-a560-d025c8ba80ba', 'dcc04c02-b1e8-4d4a-a37f-b7a0646c45ec', '12c2a093-cc09-4d1f-a0e7-f1d3e1145f09', 'head', 'director_admin_finance'),
  ('a7b6d121-23c1-484b-a0ec-5f8fc4a5c9e2', '933c1b52-7efe-4f4c-8690-8e5a39276982', '05af06aa-4227-44dd-b4c0-d12ada6b25cb', 'head', 'head_hr'),
  ('1468e0ab-ed63-40c4-872e-1b148d51b9a3', '0204440c-a660-4e6e-b146-111f2d9bfe1c', '53c21cf5-f5f9-4c56-a79a-da6b32f60970', 'office_manager', null),
  ('6706e695-e53e-40c5-a7fd-9828e37bb74b', '0204440c-a660-4e6e-b146-111f2d9bfe1c', '138fb3b9-8fe7-463a-8d58-b2b563ab43bf', 'staff', null),
  ('d52dc16f-f328-40e3-8a57-2a5782cfaf8c', '1e693d75-2bec-4fb4-b762-d70cb382f194', '31046f6e-e84f-4f5b-bd2c-576622a6a330', 'staff', null);

alter table positions enable trigger positions_named_role_admin_only_insert;

insert into delegations (original_position_id, delegate_position_id, start_date, end_date, status, created_by) values
  ('6706e695-e53e-40c5-a7fd-9828e37bb74b', '1468e0ab-ed63-40c4-872e-1b148d51b9a3', current_date - 2, current_date + 5, 'active', 'bcf1711b-06e6-4031-8137-bb81c377f34e');

-- Sample documents. prepare_new_document() still mints unique_code and sets
-- requester_tier from the originating position's role on insert; the rest
-- of each document's state is set directly here (rather than via a series
-- of UPDATEs) since enforce_document_update_rules() requires an
-- authenticated session for its authorization checks, which this seed has
-- none of.
insert into documents (
  id, document_type_id, subject, summary, originating_position_id,
  digital_status, physical_status, decision_status,
  current_digital_custodian_id, current_physical_custodian_id, created_at
) values (
  '2508761a-fb79-4b16-81c6-96ac5158f6dd', '26386096-ed5c-4d07-9f57-da1b8e5adda2',
  'Q3 Communication Strategy Review', 'Draft review of the Q3 outreach and media plan.',
  '6706e695-e53e-40c5-a7fd-9828e37bb74b',
  'at_office', 'not_dispatched', 'open',
  '1468e0ab-ed63-40c4-872e-1b148d51b9a3', '6706e695-e53e-40c5-a7fd-9828e37bb74b', now() - interval '2 days'
);

insert into documents (
  id, document_type_id, subject, summary, originating_position_id,
  digital_status, physical_status, decision_status,
  current_digital_custodian_id, current_physical_custodian_id, created_at
) values (
  '4fb4726f-f098-4b00-bdca-c63729154238', 'd2a09652-d97c-41f5-a948-fd330d835557',
  'Circular: Updated Travel Authorisation Procedure', 'New travel request workflow ahead of Q4.',
  '1468e0ab-ed63-40c4-872e-1b148d51b9a3',
  'minuted', 'in_transit', 'pending_decision',
  '376ed70f-1fee-4079-95f4-9e5da3574f78', '1468e0ab-ed63-40c4-872e-1b148d51b9a3', now() - interval '3 days'
);

insert into minutes (document_id, author_position_id, content, created_at) values (
  '4fb4726f-f098-4b00-bdca-c63729154238', '1468e0ab-ed63-40c4-872e-1b148d51b9a3',
  'Requesting SG approval ahead of the Q4 travel season — procedure attached for review.',
  now() - interval '2 days'
);

insert into documents (
  id, document_type_id, subject, summary, originating_position_id,
  digital_status, physical_status, decision_status,
  decision_summary, decision_number, decided_at, is_closed,
  current_digital_custodian_id, current_physical_custodian_id, created_at
) values (
  '2abf230f-e1b1-470e-8ccf-6d7eae6cc546', '26386096-ed5c-4d07-9f57-da1b8e5adda2',
  'HR Policy Update — Remote Work Guidelines', 'Revised remote work policy for 2026.',
  'a7b6d121-23c1-484b-a0ec-5f8fc4a5c9e2',
  'decided', 'delivered', 'approved',
  'Approved as submitted.', 'DAF-HRD-2026-014', now() - interval '2 days', true,
  'a7b6d121-23c1-484b-a0ec-5f8fc4a5c9e2', 'a7b6d121-23c1-484b-a0ec-5f8fc4a5c9e2', now() - interval '10 days'
);

insert into documents (
  id, document_type_id, subject, summary, originating_position_id,
  digital_status, physical_status, decision_status,
  current_digital_custodian_id, current_physical_custodian_id, created_at
) values (
  '90b81af6-6408-4bfc-bf1d-4aec17a606f9', 'c4eb1f05-8700-4fb2-b9c1-b1b0139e9f6a',
  'Correspondence from Ministry of Trade — Tariff Consultation', 'Forwarded for review and response.',
  'd52dc16f-f328-40e3-8a57-2a5782cfaf8c',
  'at_office', 'delivered', 'open',
  'b5e514af-cb9b-4d14-a560-d025c8ba80ba', 'd52dc16f-f328-40e3-8a57-2a5782cfaf8c', now() - interval '9 days'
);

-- Backdate each origination movement_event so "days in office" reflects the
-- backdated created_at above (the AFTER INSERT trigger stamps occurred_at
-- with real now() regardless of the created_at passed into the INSERT).
update movement_events set occurred_at = d.created_at
from documents d
where movement_events.document_id = d.id
  and movement_events.from_position_id is null
  and d.id in (
    '2508761a-fb79-4b16-81c6-96ac5158f6dd', '4fb4726f-f098-4b00-bdca-c63729154238',
    '2abf230f-e1b1-470e-8ccf-6d7eae6cc546', '90b81af6-6408-4bfc-bf1d-4aec17a606f9'
  );

-- Doc B's re-route from the office manager to the SG, landing "now" so its
-- own days-in-office starts fresh from the actual routing moment.
insert into movement_events (document_id, channel, from_position_id, to_position_id, cause, resulting_digital_status, resulting_decision_status)
values (
  '4fb4726f-f098-4b00-bdca-c63729154238', 'digital',
  '1468e0ab-ed63-40c4-872e-1b148d51b9a3', '376ed70f-1fee-4079-95f4-9e5da3574f78',
  'normal', 'minuted', 'pending_decision'
);

insert into messages (org_unit_id, sender_id, body) values
  ('0204440c-a660-4e6e-b146-111f2d9bfe1c', '53c21cf5-f5f9-4c56-a79a-da6b32f60970', 'Morning team — please review the Q3 strategy memo before Friday''s meeting.');

insert into messages (recipient_id, sender_id, body) values
  ('138fb3b9-8fe7-463a-8d58-b2b563ab43bf', '53c21cf5-f5f9-4c56-a79a-da6b32f60970', 'Hope your leave is going well — flagging that I''ve picked up your open items as delegate.');
