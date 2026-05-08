-- Make agent_id and conversation_id nullable on issue table
-- SQLite doesn't support ALTER COLUMN, so we recreate the table
CREATE TABLE issue_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  agent_id TEXT,
  creator_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  conversation_id TEXT REFERENCES conversation(id) ON DELETE CASCADE,
  latest_task_id TEXT REFERENCES agent_task_queue(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  UNIQUE(conversation_id),
  FOREIGN KEY (agent_id, workspace_id) REFERENCES agent(id, workspace_id) ON DELETE CASCADE
);

INSERT INTO issue_new SELECT * FROM issue;
DROP TABLE issue;
ALTER TABLE issue_new RENAME TO issue;

CREATE INDEX IF NOT EXISTS idx_issue_workspace_status_agent
  ON issue(workspace_id, status, agent_id);

CREATE INDEX IF NOT EXISTS idx_issue_workspace_updated
  ON issue(workspace_id, updated_at);
