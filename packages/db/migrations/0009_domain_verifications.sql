-- Domain verifications: track SES domain verification status for
-- the "Pietru SMTP" feature where users verify their domain in
-- Pietru's shared SES account.

CREATE TABLE IF NOT EXISTS domain_verifications (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  dkim_status TEXT NOT NULL DEFAULT 'pending',
  verification_tokens_json TEXT,
  dkim_tokens_json TEXT,
  error_message TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Lookup by project
CREATE INDEX IF NOT EXISTS idx_domain_verifications_project_id ON domain_verifications(project_id);

-- One verification per domain (globally unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_verifications_domain ON domain_verifications(domain);

-- Filter by verification status (e.g. find all pending)
CREATE INDEX IF NOT EXISTS idx_domain_verifications_status ON domain_verifications(verification_status);
