CREATE TABLE mailing_lists (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  meta TEXT,
  confirmation_email_from TEXT,
  confirmation_email_subject TEXT,
  confirmation_success_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  deleted_at TEXT
);

CREATE UNIQUE INDEX idx_mailing_lists_project_slug ON mailing_lists(project_id, slug) WHERE deleted_at IS NULL;

CREATE TABLE mailing_list_subscribers (
  id TEXT PRIMARY KEY,
  mailing_list_id TEXT NOT NULL REFERENCES mailing_lists(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  meta TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirmation_token TEXT NOT NULL,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_mls_mailing_list ON mailing_list_subscribers(mailing_list_id);
CREATE UNIQUE INDEX idx_mls_list_email ON mailing_list_subscribers(mailing_list_id, email);
