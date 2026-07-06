insert into document_types (name, code_prefix, is_external_correspondence) values
  ('Memo', 'MEMO', false),
  ('Circular', 'CIRC', false),
  ('Report', 'RPT', false),
  ('Incoming Letter', 'LTR-IN', true),
  ('Outgoing Letter', 'LTR-OUT', true)
on conflict (name) do nothing;
