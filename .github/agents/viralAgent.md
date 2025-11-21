---
name: viral_agent
description: Transforms ClipYube into a production-ready viral content engine with trend ingestion, AI generation, and multi-platform publishing.
---

> Take the `ClipYube` repo from prototype to a **production-ready viral content engine** that:
>
> * watches **trending signals** (YouTube/TikTok/Google Trends/RSS/X handles like `@elonmusk`, `@0xkitchens`),
>
> * generates derivative content (titles, scripts, blog posts, social captions),
>
> * and publishes to the **ClipYube platform + social channels** on a schedule or trigger.
>
> 1. **Clarify architecture & stabilize build**
>
>    * Inspect `package.json`, `server/**`, `src/**`, `tsconfig*.json`, and any frontend.
>    * Fix all build issues and wire scripts:
>
>      * `dev` – local dev server (API + web UI if present).
>      * `build` – type checks + builds without errors.
>      * `start` – runs the production build.
> 2. **Trending signal ingestion layer**
>
>    * Implement a pluggable “source” interface for:
>
>      * YouTube trending / search by keyword or channel.
>      * Google Trends / RSS feeds.
>      * X/Twitter handles (e.g., `@elonmusk`, `@0xkitchens`) via official APIs only.
>    * Add a scheduler (BullMQ + Redis or cron) to:
>
>      * poll sources on an interval,
>      * normalize results into a `trending_topics` table/collection (`id`, `source`, `keyword`, `metadata`, `score`, `firstSeenAt`, `lastSeenAt`).
>    * Expose admin API endpoints + minimal UI to:
>
>      * view active topics,
>      * whitelist/blacklist topics,
>      * configure keywords/handles to monitor.
> 3. **Content generation pipeline**
>
>    * Implement a queue-based pipeline:
>
>      * Input: `trending_topic` + configuration (content type mix, language, max length).
>      * Steps:
>
>        * generate YouTube title + description + tags,
>        * generate blog outline + blog post,
>        * generate social captions (X, TikTok description, IG/FB text).
>      * Use existing AI providers (OpenAI, Gemini, etc.) via well-abstracted service modules.
>    * Persist all generated artifacts in a `contents` table with clear status fields: `draft`, `readyToPublish`, `published`, `failed`.
> 4. **Publishing & workflow control**
>
>    * Implement a **Publishing Service** with providers:
>
>      * ClipYube platform (internal DB / API).
>      * YouTube (official Data API for video metadata; assume upload token exists).
>      * Social platforms where APIs allow posting; for others, generate assets + export links for manual posting.
>    * Wire configuration for:
>
>      * auto-publish vs. manual approval,
>      * per-platform cadence (e.g., X every 2 hours, blog 1/day),
>      * topic filters per channel (e.g., only Elon-related topics to specific feeds).
>    * Expose dashboard/API to:
>
>      * see queued/published items,
>      * pause/resume auto-publish,
>      * re-trigger a workflow for a topic.
> 5. **Environment, security, and resilience**
>
>    * Move all secrets (API keys, Redis URLs, DB credentials, OAuth tokens) into `process.env`.
>    * Create `.env.example` with clear documentation.
>    * Add:
>
>      * CORS with configurable allowed origins,
>      * rate-limiting on public APIs,
>      * security headers middleware,
>      * structured logging and basic error tracking.
> 6. **Testing, linting, and CI**
>
>    * Add either **Vitest** or **Jest** (choose one and add it to `package.json`):
>
>      * unit tests for source adapters, content generation orchestrator, and publishing service,
>      * integration test for “topic in → content out → publish stub”.
>    * Add **ESLint + Prettier** and scripts: `lint`, `format`, `test`, `typecheck`.
>    * Create **GitHub Actions** workflow that on push to `main`:
>
>      * runs `npm ci`,
>      * `lint`, `test`, `typecheck`, `build`,
>      * fails on any error.
> 7. **Deployment readiness**
>
>    * Add a production **Dockerfile** (multi-stage: build + runtime).
>    * Add a basic deployment template for **Render** (or Vercel/Fly.io as alternatives) with:
>
>      * required env vars,
>      * health checks (e.g., `/api/health` reporting DB/Redis/queue status).
> 8. **Documentation**
>
>    * Update `README.md` to cover:
>
>      * system overview (trend ingestion → AI generation → publishing),
>      * setup (env vars, Redis/DB requirements),
>      * how to run dev, test, and prod,
>      * how to configure sources, topics, and auto-publish rules,
>      * how to deploy using the Docker image + CI workflow.
>
> Deliverables:
>
> * Commits/PRs that implement the above.
> * PR description with:
>
>   * architecture summary,
>   * how to spin up the full pipeline locally,
>   * how to run the CI checks,
>   * any remaining edge cases to address before public beta.
