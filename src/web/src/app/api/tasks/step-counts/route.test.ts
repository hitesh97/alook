import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCountTaskMessagesByTaskIds = vi.fn();

vi.mock("@/lib/middleware/helpers", () => ({
  writeJSON: (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" },
    }),
  writeError: (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "content-type": "application/json" },
    }),
}));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(() => ({ env: { DB: {} } })),
}));
vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => ({})) }));

vi.mock("@alook/shared", () => ({
  createDb: vi.fn(() => ({})),
  queries: {
    taskMessage: {
      countTaskMessagesByTaskIds: (...args: any[]) =>
        mockCountTaskMessagesByTaskIds(...args),
    },
  },
}));
vi.mock("@/lib/middleware/auth", () => ({
  withAuth: vi.fn((handler: any) => async (req: any) => {
    return handler(req, { userId: "u1", email: "u@t.com" });
  }),
}));
vi.mock("@/lib/middleware/workspace", () => ({
  withWorkspaceMember: vi.fn(async () => ({ workspaceId: "w1" })),
}));

import { POST } from "./route";

function makeReq(body: unknown, qs = "workspace_id=w1") {
  return new NextRequest(`http://localhost/api/tasks/step-counts?${qs}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/tasks/step-counts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns counts keyed by task ID", async () => {
    mockCountTaskMessagesByTaskIds.mockResolvedValue([
      { taskId: "t1", count: 5 },
      { taskId: "t2", count: 12 },
    ]);

    const res = await POST(makeReq({ task_ids: ["t1", "t2"] }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ t1: 5, t2: 12 });
    expect(mockCountTaskMessagesByTaskIds).toHaveBeenCalledWith(
      {},
      ["t1", "t2"],
      "w1"
    );
  });

  it("returns empty object when no task_ids provided", async () => {
    const res = await POST(makeReq({ task_ids: [] }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({});
    expect(mockCountTaskMessagesByTaskIds).not.toHaveBeenCalled();
  });

  it("returns 400 when task_ids is missing", async () => {
    const res = await POST(makeReq({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("task_ids is required");
  });

  it("returns 400 when task_ids is not an array", async () => {
    const res = await POST(makeReq({ task_ids: "not-array" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("task_ids must be an array of strings");
  });

  it("returns 400 when task_ids contains non-strings", async () => {
    const res = await POST(makeReq({ task_ids: [1, 2] }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("task_ids must be an array of strings");
  });

  it("rejects arrays exceeding 100 entries", async () => {
    const bigArray = Array.from({ length: 101 }, (_, i) => `t${i}`);
    const res = await POST(makeReq({ task_ids: bigArray }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("task_ids exceeds maximum of 100 entries");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest(
      "http://localhost/api/tasks/step-counts?workspace_id=w1",
      {
        method: "POST",
        body: "not json",
        headers: { "content-type": "application/json" },
      }
    );
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid request body");
  });
});
