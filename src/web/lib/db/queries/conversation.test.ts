import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock drizzle-orm operators to be pass-through
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: any[]) => ({ _op: "eq", args })),
  and: vi.fn((...args: any[]) => ({ _op: "and", args })),
  desc: vi.fn((col: any) => ({ _op: "desc", col })),
  count: vi.fn((col?: any) => ({ _op: "count", col, mapWith: vi.fn(() => ({ _op: "count_mapped", col })) })),
}));

vi.mock("@/lib/db/schema", () => ({
  conversation: {
    id: "conversation.id",
    workspaceId: "conversation.workspaceId",
    agentId: "conversation.agentId",
    userId: "conversation.userId",
    title: "conversation.title",
    createdAt: "conversation.createdAt",
  },
  message: {
    id: "message.id",
    conversationId: "message.conversationId",
  },
}));

beforeEach(() => vi.clearAllMocks());

function createMockDb(result: any = []) {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.leftJoin = vi.fn(() => chain);
  chain.groupBy = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.values = vi.fn(() => chain);
  chain.returning = vi.fn(() => Promise.resolve(result));
  chain.update = vi.fn(() => chain);
  chain.set = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  // Make the chain itself thenable so await db.select()...orderBy() works
  chain.then = (resolve: any) => resolve(result);
  return chain;
}

describe("listConversationsByAgent", () => {
  it("calls select with correct fields including message count", async () => {
    const mockRows = [
      { id: "c1", workspaceId: "w1", agentId: "a1", userId: "u1", title: "Test", createdAt: new Date(), messageCount: 3 },
      { id: "c2", workspaceId: "w1", agentId: "a1", userId: "u1", title: "", createdAt: new Date(), messageCount: 0 },
    ];
    const db = createMockDb(mockRows);

    const { listConversationsByAgent } = await import("./conversation");
    const result = await listConversationsByAgent(db as any, "w1", "u1", "a1");

    expect(result).toHaveLength(2);
    expect(result[0].messageCount).toBe(3);
    expect(result[1].messageCount).toBe(0);
    expect(db.select).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalled();
    expect(db.leftJoin).toHaveBeenCalled();
    expect(db.groupBy).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
    expect(db.orderBy).toHaveBeenCalled();
  });

  it("returns empty array when no conversations exist", async () => {
    const db = createMockDb([]);

    const { listConversationsByAgent } = await import("./conversation");
    const result = await listConversationsByAgent(db as any, "w1", "u1", "a1");

    expect(result).toEqual([]);
  });
});

describe("updateConversationTitle", () => {
  it("returns the updated row when title was empty", async () => {
    const updated = { id: "c1", title: "New title" };
    const db = createMockDb([updated]);

    const { updateConversationTitle } = await import("./conversation");
    const result = await updateConversationTitle(db as any, "c1", "New title");

    expect(result).toEqual(updated);
    expect(db.update).toHaveBeenCalled();
    expect(db.set).toHaveBeenCalledWith({ title: "New title" });
  });

  it("returns null when title was already set (no rows matched)", async () => {
    const db = createMockDb([]);

    const { updateConversationTitle } = await import("./conversation");
    const result = await updateConversationTitle(db as any, "c1", "New title");

    expect(result).toBeNull();
  });
});

describe("deleteConversation", () => {
  it("returns the deleted row", async () => {
    const deleted = { id: "c1" };
    const db = createMockDb([deleted]);

    const { deleteConversation } = await import("./conversation");
    const result = await deleteConversation(db as any, "c1");

    expect(result).toEqual(deleted);
    expect(db.delete).toHaveBeenCalled();
  });

  it("returns null when conversation not found", async () => {
    const db = createMockDb([]);

    const { deleteConversation } = await import("./conversation");
    const result = await deleteConversation(db as any, "c999");

    expect(result).toBeNull();
  });
});

describe("listConversations", () => {
  it("returns conversations for workspace and user", async () => {
    const rows = [{ id: "c1" }, { id: "c2" }];
    const db = createMockDb(rows);

    const { listConversations } = await import("./conversation");
    const result = await listConversations(db as any, "w1", "u1");

    expect(result).toHaveLength(2);
    expect(db.select).toHaveBeenCalled();
    expect(db.where).toHaveBeenCalled();
  });
});

describe("createConversation", () => {
  it("inserts and returns the new conversation", async () => {
    const created = { id: "c1", workspaceId: "w1", agentId: "a1", userId: "u1", title: "" };
    const db = createMockDb([created]);

    const { createConversation } = await import("./conversation");
    const result = await createConversation(db as any, {
      workspaceId: "w1",
      agentId: "a1",
      userId: "u1",
      title: "",
    });

    expect(result).toEqual(created);
    expect(db.insert).toHaveBeenCalled();
    expect(db.values).toHaveBeenCalledWith({
      workspaceId: "w1",
      agentId: "a1",
      userId: "u1",
      title: "",
    });
  });
});

describe("getConversation", () => {
  it("returns conversation when found", async () => {
    const conv = { id: "c1", workspaceId: "w1" };
    const db = createMockDb([conv]);

    const { getConversation } = await import("./conversation");
    const result = await getConversation(db as any, "c1");

    expect(result).toEqual(conv);
  });

  it("returns null when not found", async () => {
    const db = createMockDb([]);

    const { getConversation } = await import("./conversation");
    const result = await getConversation(db as any, "c999");

    expect(result).toBeNull();
  });
});
