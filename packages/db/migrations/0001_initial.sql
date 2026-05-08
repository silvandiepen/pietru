CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE project_api_keys (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  environment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE provider_configs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  config_encrypted TEXT NOT NULL,
  mode TEXT NOT NULL,
  environment TEXT NOT NULL,
  default_from TEXT,
  allowed_domains_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider_config_id TEXT,
  environment TEXT NOT NULL,
  to_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  reply_to TEXT,
  cc_json TEXT,
  bcc_json TEXT,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  status TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  error TEXT,
  tags_json TEXT,
  raw_storage_key TEXT,
  html_storage_key TEXT,
  text_storage_key TEXT,
  idempotency_key_hash TEXT,
  created_at TEXT NOT NULL,
  queued_at TEXT,
  sent_at TEXT,
  failed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (provider_config_id) REFERENCES provider_configs(id)
);

CREATE TABLE message_events (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT,
  payload_json TEXT,
  payload_storage_key TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
