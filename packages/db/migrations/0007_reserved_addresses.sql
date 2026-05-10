-- Migration 0007: Reserved addresses + admin users
--
-- Reserved addresses (info@, finance@, accounts@, etc.) are system-level
-- email addresses that always route to the admin user's project.
-- Regular users cannot claim these as project slugs.

-- Add is_admin flag to users
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

-- Reserved addresses table
CREATE TABLE reserved_addresses (
  id TEXT PRIMARY KEY,
  local_part TEXT NOT NULL UNIQUE,          -- e.g. 'info', 'finance', 'accounts'
  description TEXT,                          -- e.g. 'General inquiries'
  admin_project_id TEXT NOT NULL,           -- project that receives these emails
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (admin_project_id) REFERENCES projects(id)
);

-- Index for fast lookup on inbound
CREATE INDEX idx_reserved_addresses_local ON reserved_addresses(local_part, is_active);
