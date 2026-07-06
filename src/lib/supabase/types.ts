// Hand-written to match supabase/migrations/*.sql. Regenerate with
// `supabase gen types typescript` once the project is linked, and this file
// can be replaced by the generated output.
//
// Row shapes use `type` rather than `interface` deliberately: this Database
// type is checked against @supabase/supabase-js's GenericSchema constraint,
// and interfaces (being open for declaration merging) don't satisfy a
// `Record<string, unknown>` constraint in that generic position — only
// closed object type aliases do.

export type OrgUnitType = "directorate" | "division" | "office" | "unit";
export type StaffRole = "staff" | "head" | "registry_officer" | "admin";
export type DelegationStatus = "active" | "ended" | "revoked";
export type DocumentStatus =
  | "draft"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "dispatched"
  | "closed";
export type MovementMode = "digital" | "physical" | "both";
export type AttachmentKind = "scan" | "acknowledgment" | "original" | "other";
export type CorrespondenceChannel = "physical" | "email" | "fax" | "courier";
export type CorrespondenceDirection = "incoming" | "outgoing";

export type OrgUnit = {
  id: string;
  parent_id: string | null;
  name: string;
  unit_type: OrgUnitType;
  code: string;
  is_registry: boolean;
  head_user_id: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  org_unit_id: string;
  role: StaffRole;
  is_active: boolean;
  on_leave: boolean;
  leave_start: string | null;
  leave_end: string | null;
  created_at: string;
};

export type Delegation = {
  id: string;
  absent_user_id: string;
  delegate_user_id: string;
  org_unit_id: string;
  start_date: string;
  end_date: string;
  status: DelegationStatus;
  created_by: string;
  created_at: string;
  ended_at: string | null;
};

export type DocumentType = {
  id: string;
  name: string;
  code_prefix: string;
  is_external_correspondence: boolean;
  is_active: boolean;
};

export type DocumentRow = {
  id: string;
  reference_code: string;
  document_type_id: string;
  title: string;
  summary: string | null;
  origin_org_unit_id: string;
  current_org_unit_id: string;
  current_custodian_id: string | null;
  status: DocumentStatus;
  has_physical_copy: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DocumentWithStatus = DocumentRow & {
  current_org_unit_name: string;
  current_org_unit_code: string;
  origin_org_unit_name: string;
  document_type_name: string;
  code_prefix: string;
  last_moved_at: string | null;
  days_in_current_office: number | null;
};

export type DocumentMovement = {
  id: string;
  document_id: string;
  from_org_unit_id: string | null;
  to_org_unit_id: string;
  mode: MovementMode;
  sent_by: string;
  sent_at: string;
  received_by: string | null;
  received_at: string | null;
  remarks: string | null;
  action_taken: string | null;
};

export type DocumentExternalMeta = {
  document_id: string;
  direction: CorrespondenceDirection;
  channel: CorrespondenceChannel;
  correspondent_name: string | null;
  correspondent_organization: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  external_reference_no: string | null;
  dispatch_ack_received: boolean;
  dispatch_ack_scan_path: string | null;
  dispatch_ack_received_at: string | null;
};

export type DocumentAttachment = {
  id: string;
  document_id: string;
  storage_path: string;
  file_name: string;
  kind: AttachmentKind;
  uploaded_by: string;
  uploaded_at: string;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
type View<Row> = { Row: Row; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      org_units: Table<OrgUnit>;
      profiles: Table<Profile>;
      delegations: Table<Delegation>;
      document_types: Table<DocumentType>;
      documents: Table<DocumentRow>;
      document_movements: Table<DocumentMovement>;
      document_external_meta: Table<DocumentExternalMeta>;
      document_attachments: Table<DocumentAttachment>;
    };
    Views: {
      documents_with_status: View<DocumentWithStatus>;
    };
    Functions: {
      org_unit_descendants: { Args: { root: string }; Returns: { id: string }[] };
    };
  };
};
