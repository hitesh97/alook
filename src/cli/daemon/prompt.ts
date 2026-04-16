import type { Task } from "./types.js";

export function buildPrompt(task: Task): string {
  return JSON.stringify({ type: task.type, instruction: task.prompt });
}
