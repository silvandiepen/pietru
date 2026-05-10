-- Allow unmatched inbound emails (no project) by making project_id nullable on message_events
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Step 1: Create new table
CREATE TABLE message_events_new (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  project_id TEXT,
  type TEXT NOT NULL,
  provider TEXT,
  payload_json TEXT,
  payload_storage_key TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Step 2: Copy data
INSERT INTO message_events_new SELECT * FROM message_events;

-- Step 3: Drop old table
DROP TABLE message_events;

-- Step 4: Rename
ALTER TABLE message_events_new RENAME TO message_events;

-- Step 5: Rebuild index
CREATE INDEX idx_message_events_message_id ON message_events(message_id);
CREATE INDEX idx_message_events_project_id ON message_events(project_id);
