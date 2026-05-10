-- Make messages.project_id nullable for unmatched inbound emails

CREATE TABLE messages_new (
  id TEXT PRIMARY KEY,
  project_id TEXT,
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

INSERT INTO messages_new SELECT * FROM messages;
DROP TABLE messages;
ALTER TABLE messages_new RENAME TO messages;
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_status ON messages(status);
