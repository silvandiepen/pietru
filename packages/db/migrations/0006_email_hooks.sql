CREATE TABLE email_hooks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  filter_type TEXT NOT NULL DEFAULT 'tag',
  filter_value TEXT,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,
  webhook_headers_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
CREATE INDEX idx_email_hooks_project_active ON email_hooks(project_id, is_active);
