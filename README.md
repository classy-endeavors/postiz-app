# AI Zyntra Dashboard

The scheduling dashboard behind [aizyntra.com](https://aizyntra.com), live at
[dashboard.aizyntra.com](https://dashboard.aizyntra.com). Plan, schedule and
publish to **YouTube** and **TikTok** from one calendar, with an AI agent that
writes in your voice.

## Origin and license

This project is a modified fork of [Postiz](https://github.com/gitroomhq/postiz-app)
by Gitroom Limited, licensed under the
[GNU Affero General Public License v3.0](./LICENSE). This fork is distributed
under the same license; the full source is available at
[github.com/classy-endeavors/postiz-app](https://github.com/classy-endeavors/postiz-app)
and linked from the app's sidebar.

Changes from upstream include:

- Only the YouTube and TikTok channels are kept; all other providers, the
  browser extension, plugs, third-party marketplace pages and billing UI were removed.
- AI Zyntra branding (name, logo, colours, copy, legal links).
- The AI features work with any OpenAI-compatible endpoint, including Google Gemini.

## Stack

pnpm monorepo: Next.js frontend (`apps/frontend`), NestJS API (`apps/backend`),
Temporal worker (`apps/orchestrator`), PostgreSQL via Prisma, and Redis.

## Running locally

```bash
cp .env.example .env   # fill in DATABASE_URL, REDIS_URL, JWT_SECRET, URLs, provider keys
pnpm install
pnpm run prisma-db-push
pnpm run dev:backend
pnpm run dev:orchestrator
pnpm run dev:frontend
```

A Temporal server (`temporal server start-dev`), PostgreSQL and Redis must be running.

### Channels

| Channel | Env vars |
| ------- | -------- |
| YouTube | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` |
| TikTok  | `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET` |

OAuth redirect URIs: `<FRONTEND_URL>/integrations/social/youtube` and
`<FRONTEND_URL>/integrations/social/tiktok`.

### AI (OpenAI or Gemini)

```bash
OPENAI_API_KEY="..."        # OpenAI key, or a Gemini API key
# For Gemini:
OPENAI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/"
AI_TEXT_MODEL="gemini-2.5-flash"
AI_AGENT_MODEL="gemini-2.5-flash"
AI_IMAGE_MODEL="imagen-4.0-generate-001"
```

## Deployment

Production runs with Docker Compose (`docker-compose.yaml`) behind Caddy for HTTPS.
