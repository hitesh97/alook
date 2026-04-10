# Alook

A stripped-down AI agent task execution platform. Chat with AI agents (Claude Code, Codex, OpenCode) through a web UI, powered by a local daemon that manages agent runtimes.

## Architecture

```
Browser → Next.js on Cloudflare Workers (D1 + R2) ← CLI Daemon
                      ↕                                ↕
              Email Worker (inbound)         WebSocket DO (realtime)
```

| Package | Description |
|---------|-------------|
| `src/shared` | Shared types, D1 schema, query modules, validators (`@alook/shared`) |
| `src/web` | Next.js App Router on Cloudflare Workers — frontend + API routes |
| `src/cli` | Commander.js CLI + daemon that spawns agent subprocesses |
| `src/email-worker` | Cloudflare Worker for inbound email handling |
| `src/ws-do` | Cloudflare Durable Object for WebSocket connections |

## Quick Start

```bash
pnpm install          # Install deps
pnpm dev              # Start dev servers (web + email-worker)
pnpm dev:cli          # In another terminal — start CLI daemon
```

## Commands

```bash
pnpm dev              # Start all dev servers
pnpm dev:web          # Web dev server only
pnpm dev:cli          # CLI dev mode
pnpm dev:email        # Email worker dev server
pnpm build            # Build web + CLI
pnpm test             # Run all tests (turbo)
pnpm typecheck        # TypeScript check (turbo)
pnpm db:migrate       # Apply D1 migrations locally
pnpm db:reset         # Reset local D1 and re-apply migrations
```

## How It Works

1. Daemon detects installed agent CLIs (`claude`, `codex`, `opencode`) and registers runtimes with the server
2. Create an agent in the UI and link it to a runtime
3. Send a message in a conversation — server enqueues a task
4. Daemon claims the task, runs the agent CLI, streams results back
5. Frontend receives updates via WebSocket and displays output in real-time
