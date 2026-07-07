-- Starter set. document_types.code is admin-configurable, so an institution
-- can add finer-grained subtypes later (the spec's own example code,
-- "PROC-MEM", suggests something like a Memo/Procurement split) without a
-- schema change.
insert into document_types (name, code, decision_authority_role, physical_copy_required, is_external_correspondence) values
  ('Memo', 'MEM', array['current_custodian'], false, false),
  ('Circular', 'CIRC', array['sg', 'director_admin_finance', 'head_hr'], false, false),
  ('Report', 'RPT', array['current_custodian'], false, false),
  ('Incoming Letter', 'LTR-IN', array['current_custodian'], true, true),
  ('Outgoing Letter', 'LTR-OUT', array['current_custodian'], true, true)
on conflict (name) do nothing;
