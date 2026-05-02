import { eq, and, asc } from "drizzle-orm";
import { agentSidebarOrder } from "../schema";
import type { Database } from "../index";

export async function listOrder(db: Database, workspaceId: string, userId: string) {
  return db
    .select()
    .from(agentSidebarOrder)
    .where(and(eq(agentSidebarOrder.workspaceId, workspaceId), eq(agentSidebarOrder.userId, userId)))
    .orderBy(asc(agentSidebarOrder.position));
}

export async function reorder(
  db: Database,
  workspaceId: string,
  userId: string,
  orderedAgentIds: string[],
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(agentSidebarOrder)
      .where(
        and(
          eq(agentSidebarOrder.workspaceId, workspaceId),
          eq(agentSidebarOrder.userId, userId),
        )
      );
    if (orderedAgentIds.length > 0) {
      await tx.insert(agentSidebarOrder).values(
        orderedAgentIds.map((agentId, i) => ({
          agentId,
          workspaceId,
          userId,
          position: i,
        }))
      );
    }
  });
}
