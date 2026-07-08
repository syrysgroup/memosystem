-- HR has now confirmed, in response, that General Admin & Conference
-- Division is the institution's official Registry. This was previously
-- a provisional assumption (see 0030's note on this unit: "nothing on
-- the source chart is labeled 'Registry'; this is the closest
-- functional match"). Capturing the confirmation in the versioned
-- source field, replacing the provisional note rather than deleting it,
-- so the audit trail shows the assumption was made and later verified
-- rather than never having existed.

update org_units set source =
  'Seeded from institution-provided scanned organogram images, pending HR confirmation. Parent link drawn directly within the DAF chart. is_registry confirmed by the institution: General Admin & Conference Division is the official Registry -- no longer a provisional assumption.'
  where id = 'da942ac0-b8f8-4f02-9135-0d8d5bef8465'; -- General Admin & Conference Division
