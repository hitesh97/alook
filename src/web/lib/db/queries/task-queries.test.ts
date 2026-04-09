/**
 * Tests for task DB query functions (not Zod schema — that's in task.test.ts).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: any[]) => ({ _op: "eq", args })),
  and: vi.fn((...args: any[]) => ({ _op: "and", args })),
  desc: vi.fn((col: any) => ({ _op: "desc", col })),
  asc: vi.fn((col: any) => ({ _op: "asc", col })),
  inArray: vi.fn((...args: any[]) => ({ _op: "inArray", args })),
  notInArray: vi.fn((...args: any[]) => ({ _op: "notInArray", args })),
  isNotNull: vi.fn((col: any) => ({ _op: "isNotNull", col })),
  count: vi.fn(() => "count(*)"),
  lt: vi.fn((...args: any[]) => ({ _op: "lt", args })),
}));

vi.mock("@/lib/db/schema", () => ({
  agentTaskQueue: {
    id: "agentTaskQueue.id",
    agentId: "agentTaskQueue.agentId",
    runtimeId: "agentTaskQueue.runtimeId",
    workspaceId: "agentTaskQueue.workspaceId",
    conversationId: "agentTaskQueue.conversationId",
    prompt: "agentTaskQueue.prompt",
    status: "agentTaskQueue.status",
    priority: "agentTaskQueue.priority",
    dispatchedAt: "agentTaskQueue.dispatchedAt",
    startedAt: "agentTaskQueue.startedAt",
    completedAt: "agentTaskQueue.completedAt",
    sessionId: "agentTaskQueue.sessionId",
    workDir: "agentTaskQueue.workDir",
    error: "agentTaskQueue.error",
    result: "agentTaskQueue.result",
    createdAt: "agentTaskQueue.createdAt",
  },
}));

vi.mock("@alook/shared", () => ({
  ClaimedTaskRowSchema: { parse: vi.fn((v: any) => v) },
}));

beforeEach(() => vi.clearAllMocks());

function createMockDb(result: any = []) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.for = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.values = vi.fn(() => chain);
  chain.returning = vi.fn(() => Promise.resolve(result));
  chain.update = vi.fn(() => chain);
  chain.set = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.then = (resolve: any) => resolve(result);
  return chain;
}

describe("deleteTasksByConversation", () => {
  it("deletes all tasks for a conversation", async () => {
    const deleted = [{ id: "t1" }, { id: "t2" }];
    const db = createMockDb(deleted);

    const { deleteTasksByConversation } = await import("./task");
    const result = await deleteTasksByConversation(db as any, "c1");

    expect(result).toEqual(deleted);
    expect(db.delete).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
  });

  it("returns empty array when no tasks exist", async () => {
    const db = createMockDb([]);

    const { deleteTasksByConversation } = await import("./task");
    const result = await deleteTasksByConversation(db as any, "c1");

    expect(result).toEqual([]);
  });
});

describe("hasPendingTaskForConversation", () => {
  it("returns true when pending tasks exist", async () => {
    const db = createMockDb([{ id: "t1" }]);

    const { hasPendingTaskForConversation } = await import("./task");
    const result = await hasPendingTaskForConversation(db as any, "c1");

    expect(result).toBe(true);
    expect(db.limit).toHaveBeenCalledWith(1);
  });

  it("returns false when no pending tasks", async () => {
    const db = createMockDb([]);

    const { hasPendingTaskForConversation } = await import("./task");
    const result = await hasPendingTaskForConversation(db as any, "c1");

    expect(result).toBe(false);
  });
});

describe("countRunningTasks", () => {
  it("returns count as a number", async () => {
    const db = createMockDb([{ value: 3 }]);

    const { countRunningTasks } = await import("./task");
    const result = await countRunningTasks(db as any, "a1");

    expect(result).toBe(3);
  });

  it("returns 0 when no running tasks", async () => {
    const db = createMockDb([{ value: 0 }]);

    const { countRunningTasks } = await import("./task");
    const result = await countRunningTasks(db as any, "a1");

    expect(result).toBe(0);
  });

  it("returns 0 when query returns no rows", async () => {
    const db = createMockDb([]);

    const { countRunningTasks } = await import("./task");
    const result = await countRunningTasks(db as any, "a1");

    expect(result).toBe(0);
  });
});

describe("failStaleDispatchedTasks", () => {
  it("fails dispatched tasks older than threshold", async () => {
    const failed = [{ agentId: "a1" }, { agentId: "a2" }];
    const db = createMockDb(failed);

    const { failStaleDispatchedTasks } = await import("./task");
    const result = await failStaleDispatchedTasks(db as any, 20);

    expect(result).toEqual(failed);
    expect(db.update).toHaveBeenCalled();
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        error: expect.stringContaining("timed out"),
      })
    );
  });

  it("returns empty array when no stale tasks", async () => {
    const db = createMockDb([]);

    const { failStaleDispatchedTasks } = await import("./task");
    const result = await failStaleDispatchedTasks(db as any);

    expect(result).toEqual([]);
  });
});

describe("getLastTaskSession", () => {
  it("returns session info for completed task", async () => {
    const session = { sessionId: "s1", workDir: "/tmp" };
    const db = createMockDb([session]);

    const { getLastTaskSession } = await import("./task");
    const result = await getLastTaskSession(db as any, "a1", "c1");

    expect(result).toEqual(session);
    expect(db.limit).toHaveBeenCalledWith(1);
  });

  it("returns null when no completed tasks", async () => {
    const db = createMockDb([]);

    const { getLastTaskSession } = await import("./task");
    const result = await getLastTaskSession(db as any, "a1", "c1");

    expect(result).toBeNull();
  });
});
