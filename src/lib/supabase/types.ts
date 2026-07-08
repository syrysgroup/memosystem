// Hand-written to match supabase/migrations/*.sql. Regenerate with
// `supabase gen types typescript` once convenient, and this file can be
// replaced by the generated output.
//
// Row shapes use `type` rather than `interface` deliberately: this Database
// type is checked against @supabase/supabase-js's GenericSchema constraint,
// and interfaces (being open for declaration merging) don't satisfy a
// `Record<string, unknown>` constraint in that generic position — only
// closed object type aliases do.

export type OrgUnitType = "directorate" | "division" | "office";
export type PositionRole = "head" | "office_manager" | "staff";
export type DigitalStatus =
  | "drafted"
  | "in_transit"
  | "at_office"
  | "under_review"
  | "minuted"
  | "decided"
  | "reassigned";
export type PhysicalStatus = "not_dispatched" | "in_transit" | "delivered" | "delivery_failed";
export type DecisionStatus = "open" | "pending_decision" | "approved" | "rejected" | "withdrawn";
export type RequesterTier = "senior_originator" | "junior_originator";
export type DeliveryFailureReason =
  | "recipient_absent"
  | "office_closed"
  | "recipient_refused"
  | "wrong_office"
  | "document_damaged"
  | "other";
export type MovementChannel = "digital" | "physical";
export type MovementCause = "normal" | "office_dissolved" | "decision_stamp";
export type DeliveryOutcome = "delivered" | "failed";
export type DelegationStatus = "active" | "ended" | "revoked";
export type GrantStatus = "active" | "expired" | "revoked";
export type AttachmentKind = "scan" | "acknowledgment" | "decision_stamp" | "other";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_org_admin: boolean;
  is_security_admin: boolean;
  is_active: boolean;
  on_leave: boolean;
  leave_start: string | null;
  leave_end: string | null;
  phone_number: string | null;
  nationality: string | null;
  bio: string | null;
  date_of_appointment: string | null;
  avatar_path: string | null;
  created_at: string;
};

export type OrgUnit = {
  id: string;
  stable_key: string;
  parent_id: string | null;
  unit_type: OrgUnitType;
  name: string;
  is_registry: boolean;
  // Distinguishes structure that was deliberately designed in-system from
  // structure seeded from an external source (e.g. a scanned organogram)
  // pending confirmation. Null for rows with no recorded provenance.
  source: string | null;
  effective_from: string;
  effective_to: string | null;
  superseded_by_id: string | null;
  created_at: string;
};

export type PositionType = {
  id: string;
  org_unit_id: string;
  title: string;
  // Full grade range as shown on the source ("P2"/"P3"/"P4"), not yet
  // narrowed to one incumbent's actual grade. Empty for offices with no
  // formal grade code (e.g. an elected/political office).
  grade_band: string[];
  slot_count: number;
  source: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
};

export type PrefixDecodeEntry = {
  id: string;
  prefix: string;
  unit_name: string;
  org_unit_id: string | null;
  effective_from: string;
  effective_to: string | null;
};

export type Position = {
  id: string;
  org_unit_id: string;
  profile_id: string;
  role: PositionRole;
  named_role: string | null;
  // The specific establishment post this incumbent fills, and the one grade
  // (out of that post's grade_band) they were actually assigned -- both
  // independent of `role`/`named_role`, which drive permission scoping.
  position_type_id: string | null;
  grade: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
};

export type DocumentType = {
  id: string;
  name: string;
  code: string;
  routing_rule: Record<string, unknown>;
  decision_authority_role: string[];
  retention_period: string | null;
  template: Record<string, string> | null;
  physical_copy_required: boolean;
  is_external_correspondence: boolean;
  is_active: boolean;
};

export type DocumentRow = {
  id: string;
  unique_code: string;
  document_type_id: string;
  subject: string;
  summary: string | null;
  originating_position_id: string;
  requester_tier: RequesterTier;
  digital_status: DigitalStatus;
  physical_status: PhysicalStatus;
  decision_status: DecisionStatus;
  decision_summary: string | null;
  decision_number: string | null;
  decided_at: string | null;
  is_closed: boolean;
  physical_failure_reason: DeliveryFailureReason | null;
  physical_failure_note: string | null;
  current_digital_custodian_id: string | null;
  current_physical_custodian_id: string | null;
  related_document_id: string | null;
  relation_type: string | null;
  superseded_at: string | null;
  superseded_reason: string | null;
  superseded_by_position_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentWithStatus = DocumentRow & {
  document_type_name: string;
  document_type_code: string;
  current_org_unit_id: string | null;
  current_org_unit_name: string | null;
  current_physical_org_unit_id: string | null;
  current_physical_org_unit_name: string | null;
  arrived_at_current_office: string | null;
  days_in_office: number | null;
  days_in_system: number | null;
};

export type MovementEvent = {
  id: string;
  document_id: string;
  channel: MovementChannel;
  from_position_id: string | null;
  to_position_id: string;
  occurred_at: string;
  cause: MovementCause;
  delivery_outcome: DeliveryOutcome | null;
  failure_reason: DeliveryFailureReason | null;
  failure_note: string | null;
  resulting_digital_status: DigitalStatus | null;
  resulting_physical_status: PhysicalStatus | null;
  resulting_decision_status: DecisionStatus | null;
  recorded_by: string | null;
};

export type Minute = {
  id: string;
  document_id: string;
  author_position_id: string;
  content: string;
  created_at: string;
};

export type Delegation = {
  id: string;
  original_position_id: string;
  delegate_position_id: string;
  start_date: string;
  end_date: string;
  status: DelegationStatus;
  created_by: string;
  created_at: string;
  ended_at: string | null;
};

export type Grant = {
  id: string;
  grantor_position_id: string | null;
  grantee_profile_id: string;
  audit_period_start: string;
  audit_period_end: string;
  issued_at: string;
  expires_at: string;
  original_length_days: number;
  total_extension_days: number;
  status: GrantStatus;
  reason: string | null;
  issued_by: string;
  created_at: string;
};

export type DocumentAttachment = {
  id: string;
  document_id: string;
  movement_event_id: string | null;
  storage_path: string;
  file_name: string;
  kind: AttachmentKind;
  uploaded_by: string;
  uploaded_at: string;
};

export type Message = {
  id: string;
  org_unit_id: string | null;
  sender_id: string;
  recipient_id: string | null;
  body: string;
  created_at: string;
};

export type AuditLogEntry = {
  id: string;
  user_id: string | null;
  acting_as_position_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
type View<Row> = { Row: Row; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      org_units: Table<OrgUnit>;
      prefix_decode_table: Table<PrefixDecodeEntry>;
      positions: Table<Position>;
      position_types: Table<PositionType>;
      document_types: Table<DocumentType>;
      documents: Table<DocumentRow>;
      movement_events: Table<MovementEvent>;
      minutes: Table<Minute>;
      delegations: Table<Delegation>;
      grants: Table<Grant>;
      document_attachments: Table<DocumentAttachment>;
      audit_log: Table<AuditLogEntry>;
      messages: Table<Message>;
    };
    Views: {
      documents_with_status: View<DocumentWithStatus>;
    };
    Functions: {
      org_unit_descendants: { Args: { root: string }; Returns: { id: string }[] };
      decode_unique_code_origin: { Args: { p_unique_code: string }; Returns: string };
      supersede_circular: { Args: { p_document_id: string; p_reason: string }; Returns: DocumentRow };
      grant_auto_extend: { Args: { p_grant_id: string }; Returns: Grant };
      reporting_line_summary: {
        Args: { root_org_unit_id: string };
        Returns: { bucket: string; tag: string; newly_inherited: boolean; doc_count: number }[];
      };
      reporting_line_drilldown: {
        Args: { root_org_unit_id: string };
        Returns: {
          document_id: string;
          unique_code: string;
          subject: string;
          originating_office_name: string;
          pending_office_name: string;
          decision_pending: boolean;
          delivery_outstanding: boolean;
          days_in_office: number;
        }[];
      };
    };
  };
};
