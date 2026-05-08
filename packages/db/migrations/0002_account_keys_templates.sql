-- Account-level API keys (master keys for external integrations)
CREATE TABLE account_api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User settings (default Resend API key, default from address, etc.)
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  default_resend_api_key_encrypted TEXT,
  default_from_address TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email templates per project
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_email_templates_project ON email_templates(project_id);
CREATE INDEX idx_email_templates_name ON email_templates(project_id, name);
CREATE INDEX idx_account_api_keys_hash ON account_api_keys(key_hash);
