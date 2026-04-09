import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/middleware/auth", () => ({
  withAuth: vi.fn((handler: any) => async (req: any, ctx?: any) => {
    const params = ctx?.params instanceof Promise ? await ctx.params : ctx?.params;
    return handler(req, { userId: "u1", email: "u@t.com", params });
  }),
}));
vi.mock("@/lib/middleware/workspace", () => ({
  withWorkspaceMember: vi.fn(async () => ({ workspaceId: "w1" })),
}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/queries/conversation");
vi.mock("@/lib/db/queries/task");
vi.mock("@/lib/api/responses", () => ({
  conversationToResponse: vi.fn((c: any) => ({ id: c.id })),
}));

import { getConversation, deleteConversation } from "@/lib/db/queries/conversation";
import { deleteTasksByConversation } from "@/lib/db/queries/task";

const mockGet = vi.mocked(getConversation);
const mockDelete = vi.mocked(deleteConversation);
const mockDeleteTasks = vi.mocked(deleteTasksByConversation);

beforeEach(() => vi.clearAllMocks());

describe("GET /api/conversations/[id]", () => {
  it("returns conversation", async () => {
    mockGet.mockResolvedValue({ id: "c1", workspaceId: "w1" } as any);
    const { GET } = await import("./route");
    const res = await GET(
      new NextRequest("http://localhost/api/conversations/c1?workspace_id=w1"),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 when not found", async () => {
    mockGet.mockResolvedValue(null as any);
    const { GET } = await import("./route");
    const res = await GET(
      new NextRequest("http://localhost/api/conversations/c1?workspace_id=w1"),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when workspace mismatch", async () => {
    mockGet.mockResolvedValue({ id: "c1", workspaceId: "other" } as any);
    const { GET } = await import("./route");
    const res = await GET(
      new NextRequest("http://localhost/api/conversations/c1?workspace_id=w1"),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/conversations/[id]", () => {
  it("returns 204 and removes conversation + tasks", async () => {
    mockGet.mockResolvedValue({ id: "c1", workspaceId: "w1" } as any);
    mockDeleteTasks.mockResolvedValue([{ id: "t1" }]);
    mockDelete.mockResolvedValue({ id: "c1" } as any);
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new NextRequest("http://localhost/api/conversations/c1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(204);
    expect(mockDeleteTasks).toHaveBeenCalledWith({}, "c1");
    expect(mockDelete).toHaveBeenCalledWith({}, "c1");
  });

  it("deletes tasks in all statuses before conversation", async () => {
    mockGet.mockResolvedValue({ id: "c1", workspaceId: "w1" } as any);
    mockDeleteTasks.mockResolvedValue([{ id: "t1" }, { id: "t2" }, { id: "t3" }]);
    mockDelete.mockResolvedValue({ id: "c1" } as any);
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new NextRequest("http://localhost/api/conversations/c1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(204);
    expect(mockDeleteTasks).toHaveBeenCalled();
  });

  it("returns 404 when conversation not found", async () => {
    mockGet.mockResolvedValue(null as any);
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new NextRequest("http://localhost/api/conversations/c1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when workspace mismatch", async () => {
    mockGet.mockResolvedValue({ id: "c1", workspaceId: "other" } as any);
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new NextRequest("http://localhost/api/conversations/c1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(404);
  });
});
