# FocusForge AI

FocusForge AI is a Next.js 15 productivity app built around Supabase auth, persistent focus sessions, blocking preferences, AI coaching, weekly reporting, and reward tracking.

## Stack

- Next.js 15
- TypeScript
- Supabase
- Zustand
- OpenRouter
- Recharts

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file from [`.env.example`](C:/Users/SHUBHAM/OneDrive/Documents/FORCEFORGE/FIGMA/.env.example:1).

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional AI variables:

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
```

3. Apply the Supabase schema from [src/lib/supabase/schema.sql](C:/Users/SHUBHAM/OneDrive/Documents/FORCEFORGE/FIGMA/src/lib/supabase/schema.sql:1).

4. Start the local server:

```bash
npm run dev
```

The app runs on:

```text
http://localhost:4029
```

## Supabase Auth Configuration

Set the Supabase Site URL to:

```text
http://localhost:4029
```

Allowed redirect URLs should include:

```text
http://localhost:4029/auth/callback?next=/app
http://localhost:4029/login
```

For production, add the same paths on your deployed domain.

## Production Build

Build:

```bash
npm run build
```

Start:

```bash
npm run start
```

To run the production build locally on the same port as development:

```bash
npm run start:local
```

## Deployment Notes

- The app expects Supabase RLS policies from the provided schema.
- The AI coach uses OpenRouter when `OPENROUTER_API_KEY` is present.
- If no AI key is configured, the coach falls back to a deterministic in-app response.
- Profile, rewards, dashboard, focus sessions, blocked apps, activity logs, and weekly reports are all backed by Supabase APIs.

## Deploy To Vercel

1. Push the repo to GitHub.
2. In Vercel, create a new project and import the repo.
3. Keep the default framework as `Next.js`.
4. Add these environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
```

5. Deploy.
6. In Supabase, set:

```text
Site URL: https://your-vercel-domain.vercel.app
Redirect URLs:
https://your-vercel-domain.vercel.app/auth/callback?next=/app
https://your-vercel-domain.vercel.app/login
```

If you use preview deployments, also add a wildcard redirect when supported:

```text
https://*.vercel.app/auth/callback*
https://*.vercel.app/login
```

## Deploy To Render

1. Push the repo to GitHub.
2. In Render, create a new `Web Service`.
3. Select the repo and configure:

```text
Environment: Node
Build Command: npm install && npm run build
Start Command: npm run start
```

4. Add these environment variables in Render:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
```

5. Deploy.
6. After Render gives you a live URL, set the Supabase auth URLs to:

```text
Site URL: https://your-render-service.onrender.com
Redirect URLs:
https://your-render-service.onrender.com/auth/callback?next=/app
https://your-render-service.onrender.com/login
```

Render injects its own `PORT` value automatically, so the production start script must remain `next start` without a hardcoded port.

## Core Routes

- `/login`
- `/onboarding`
- `/app`
- `/app/focus`
- `/app/blocking`
- `/app/ai-coach`
- `/app/stats`
- `/app/rewards`
- `/app/profile`
- `/app/weekly-report`

## API Routes

- `/api/focus-sessions`
- `/api/blocked-apps`
- `/api/dashboard`
- `/api/profile`
- `/api/rewards`
- `/api/ai-coach`
- `/api/ai-coach/logs-pdf`
- `/api/weekly-report`
- `/api/activity`
