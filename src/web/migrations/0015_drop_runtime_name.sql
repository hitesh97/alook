-- Drop the unused `name` column from agent_runtime.
-- Deploy code that stops writing `name` BEFORE running this migration.
ALTER TABLE agent_runtime DROP COLUMN name;
