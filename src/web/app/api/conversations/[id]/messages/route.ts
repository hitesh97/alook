import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getConversation, updateConversationTitle } from "@/lib/db/queries/conversation";
import { listMessages, createMessage } from "@/lib/db/queries/message";
import { withAuth } from "@/lib/middleware/auth";
import { withWorkspaceMember } from "@/lib/middleware/workspace";
import { writeJSON, writeError } from "@/lib/middleware/helpers";
import { messageToResponse, taskToResponse } from "@/lib/api/responses";
import { TaskService } from "@/lib/services/task";
import { log } from "@/lib/logger";

function truncateTitle(text: string, maxLen = 50): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  const cut = trimmed.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  const title = lastSpace > 20 ? cut.slice(0, lastSpace) : cut;
  return title + "...";
}

export const GET = withAuth(async (req, ctx) => {
  const ws = await withWorkspaceMember(req, ctx);
  if (ws instanceof Response) return ws;

  const id = ctx.params?.id;
  if (!id) {
    return writeError("conversation id is required", 400);
  }

  const conversation = await getConversation(db, id);
  if (!conversation || conversation.workspaceId !== ws.workspaceId) {
    return writeError("conversation not found", 404);
  }

  const messages = await listMessages(db, id);
  return writeJSON(messages.map(messageToResponse));
});

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const ws = await withWorkspaceMember(req, ctx);
  if (ws instanceof Response) return ws;

  const id = ctx.params?.id;
  if (!id) {
    return writeError("conversation id is required", 400);
  }

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return writeError("invalid request body", 400);
  }

  const content = body.content || "";
  if (!content) {
    return writeError("content is required", 400);
  }

  const conversation = await getConversation(db, id);
  if (!conversation || conversation.workspaceId !== ws.workspaceId) {
    return writeError("conversation not found", 404);
  }

  const message = await createMessage(db, {
    conversationId: id,
    role: "user",
    content,
  });

  // Auto-title: conditional WHERE title = '' ensures only the first message sets it
  updateConversationTitle(db, id, truncateTitle(content)).catch(() => {});

  const taskService = new TaskService(db);
  try {
    const task = await taskService.enqueueTask(
      conversation.agentId,
      id,
      ws.workspaceId,
      content
    );
    return writeJSON(
      { message: messageToResponse(message), task: taskToResponse(task) },
      201
    );
  } catch (err: any) {
    log.error("enqueueTask error", { err });
    return writeJSON(
      {
        message: messageToResponse(message),
        task: null,
        error: err.message,
      },
      500
    );
  }
});
