-- Remove legacy orphaned messages that have no owning project.
--
-- User inboxes are project-scoped. Messages with project_id IS NULL are not owned
-- by any user and previously leaked into every authenticated inbox through the
-- global inbox LEFT JOIN. Delete the legacy rows so production D1 state matches
-- the ownership model and QA checks do not keep finding stale orphan data.

DELETE FROM messages
WHERE project_id IS NULL;
