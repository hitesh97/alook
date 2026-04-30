import { getCloudflareContext } from "@opennextjs/cloudflare";
import { queries } from "@alook/shared";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/middleware/auth";
import { withWorkspaceMember } from "@/lib/middleware/workspace";
import { writeJSON, writeError } from "@/lib/middleware/helpers";

export const POST = withAuth(async (req, ctx) => {
  const ws = await withWorkspaceMember(req, ctx);
  if (ws instanceof Response) return ws;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return writeError("invalid request body", 400);
  }

  if (!body || typeof body !== "object" || !("task_ids" in body)) {
    return writeError("task_ids is required", 400);
  }

  const { task_ids } = body as { task_ids: unknown };
  if (!Array.isArray(task_ids) || !task_ids.every((id) => typeof id === "string")) {
    return writeError("task_ids must be an array of strings", 400);
  }

  if (task_ids.length > 100) {
    return writeError("task_ids exceeds maximum of 100 entries", 400);
  }

  if (task_ids.length === 0) {
    return writeJSON({});
  }

  const { env } = getCloudflareContext();
  const db = getDb((env as Env).DB);

  const rows = await queries.taskMessage.countTaskMessagesByTaskIds(
    db,
    task_ids,
    ws.workspaceId
  );

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.taskId] = row.count;
  }

  return writeJSON(result);
});
