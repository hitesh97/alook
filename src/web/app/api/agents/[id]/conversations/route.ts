import { db } from "@/lib/db";
import { getAgentInWorkspace } from "@/lib/db/queries/agent";
import { listConversationsByAgent } from "@/lib/db/queries/conversation";
import { withAuth } from "@/lib/middleware/auth";
import { withWorkspaceMember } from "@/lib/middleware/workspace";
import { writeJSON, writeError } from "@/lib/middleware/helpers";
import { conversationToResponse } from "@/lib/api/responses";

export const GET = withAuth(async (req, ctx) => {
  const ws = await withWorkspaceMember(req, ctx);
  if (ws instanceof Response) return ws;

  const id = ctx.params?.id;
  if (!id) {
    return writeError("agent id is required", 400);
  }

  const agent = await getAgentInWorkspace(db, id, ws.workspaceId);
  if (!agent) {
    return writeError("agent not found", 404);
  }

  const conversations = await listConversationsByAgent(
    db,
    ws.workspaceId,
    ctx.userId,
    id
  );

  return writeJSON(conversations.map(conversationToResponse));
});
