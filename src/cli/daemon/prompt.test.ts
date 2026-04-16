import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt.js";
import type { Task } from "./types.js";

function makeTask(prompt: string, type = "user_dm_message"): Task {
  return {
    id: "t1",
    agentId: "a1",
    runtimeId: "r1",
    conversationId: "c1",
    workspaceId: "w1",
    prompt,
    type,
    status: "pending",
    priority: 1,
    createdAt: new Date().toISOString(),
  };
}

describe("buildPrompt", () => {
  it("returns structured JSON with type and instruction", () => {
    const task = makeTask("Fix the login bug");
    expect(buildPrompt(task)).toBe(
      JSON.stringify({ type: "user_dm_message", instruction: "Fix the login bug" }),
    );
  });

  it("handles empty prompt", () => {
    const task = makeTask("");
    expect(buildPrompt(task)).toBe(
      JSON.stringify({ type: "user_dm_message", instruction: "" }),
    );
  });

  it("includes the task type in output", () => {
    const task = makeTask("Check inbox", "email_inbound");
    expect(buildPrompt(task)).toBe(
      JSON.stringify({ type: "email_inbound", instruction: "Check inbox" }),
    );
  });
});
