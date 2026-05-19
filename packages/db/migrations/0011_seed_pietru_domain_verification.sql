-- Seed Pietru's own verified sending domain for the system/admin project.
--
-- The Pietru SMTP send path enforces that the sender domain is verified in
-- domain_verifications. no-reply@pietru.dev is a legitimate system sender, but
-- production can miss this row if the system domain was verified directly in SES
-- before the domain_verifications table existed. Keep it scoped to the admin
-- project so tenant projects do not inherit permission to send from pietru.dev.

INSERT INTO domain_verifications (
  id,
  project_id,
  domain,
  verification_status,
  dkim_status,
  verified_at,
  created_at,
  updated_at
)
SELECT
  'dver_pietru_system',
  'proj_admin_system',
  'pietru.dev',
  'SUCCESS',
  'SUCCESS',
  datetime('now'),
  datetime('now'),
  datetime('now')
FROM projects
WHERE id = 'proj_admin_system'
ON CONFLICT(domain) DO UPDATE SET
  project_id = excluded.project_id,
  verification_status = excluded.verification_status,
  dkim_status = excluded.dkim_status,
  verified_at = COALESCE(domain_verifications.verified_at, excluded.verified_at),
  updated_at = excluded.updated_at;
