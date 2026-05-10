CREATE TABLE inbound_addresses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_slug TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(project_id, user_slug)
);

CREATE INDEX idx_inbound_addresses_active ON inbound_addresses(project_id, is_active);
