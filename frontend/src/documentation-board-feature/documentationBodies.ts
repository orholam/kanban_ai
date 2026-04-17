/** Markdown bodies for documentation articles — kept separate from metadata for readability. */

export const bodyOverview = `Kanban AI is a web app for **planning and shipping** side projects: classic kanban columns, tasks you can move as work progresses, and an **AI sidebar** that understands your project so it can suggest breakdowns, next steps, and answers in context.

## What you are looking at

- **Marketing & entry** — Landing page, blog, and this documentation board (public).
- **Workbench** — After you open a board, you work inside the kanban UI with optional AI chat tied to the active project.
- **Guest mode** — Try the board without creating an account (data stays in your browser until you sign in or clear storage).
- **Signed-in mode** — Projects and tasks sync through Supabase so you can return from any device.

## Mental model

Think in three layers:

1. **Project** — The container for your idea (name, type, tech context).
2. **Board** — Columns and cards representing workflow stages and tasks.
3. **AI session** — Conversation plus tools that can reference tasks and help you edit the board when you ask.

If you only read one other article, read **Guest board vs signed-in account** and **AI sidebar & task chat** next.`;

export const bodyGuestVsAccount = `You can explore Kanban AI in **guest mode** or with a **signed-in account**. Both use the same board UI; the difference is where data lives and whether AI features that need a server can run the full path.

## Guest mode

- Open **Try now** / the guest board flow from the landing experience.
- Tasks and columns are stored **locally** (browser storage). They survive refresh but not a different browser or cleared storage.
- Some cloud-backed features (like synced comments across devices) are **skipped** in guest mode by design.
- When you are ready, you can **sign in** and migrate meaningful local work where the product supports it.

## Signed-in account

- **Supabase auth** backs sign-in. Your projects and tasks are associated with your user and stored in the project database.
- You get **cross-device continuity** and features that read/write project data on the server.
- Treat your account like any SaaS product: use a strong password and sign out on shared machines.

## Choosing a path

| Situation | Suggestion |
|-----------|------------|
| Quick experiment | Guest mode |
| Real project over weeks | Sign in early |
| Demo to a friend | Guest or public share link (see sharing doc) |
| CI / automated testing | Use dedicated test credentials, not production data |

## Data hygiene

- Guest data can be **lost** if you clear site data or use private browsing only temporarily.
- After sign-in, rely on exported backups or copies if you need long-term archives outside the app (features vary by deployment).`;

export const bodyFirstProject = `The **new project** flow turns a short description into a structured backlog. This document walks the happy path and calls out the choices that most affect the AI.

## Before you start

Have a one-paragraph answer ready to: **What are you building, who is it for, and what stack or constraints matter?** The more concrete you are, the more useful the first column of tasks will be.

## Wizard surfaces

1. **Basics** — Name and elevator pitch for the project.
2. **Project type** — Categories such as SaaS, AI tooling, blog/site, events, etc. These map to **prompt packs** so the model speaks your domain language.
3. **Tech stack** — Languages, frameworks, hosting hints. Used when proposing tasks and estimating complexity.
4. **Review** — You confirm before generating the roadmap.

## After generation

- Tasks land in **phased columns** aligned to how the app models your plan (for example week-based or stage-based columns).
- You can **rename, split, merge, or delete** tasks—plans are not contracts.
- If something feels off, refine the description and use the **AI sidebar** to replan a slice of work rather than restarting from scratch.

## Tips

- Prefer **verbs and outcomes** in titles (“Ship OAuth callback URL” vs “Auth”).
- Keep **one owner** per task when collaborating informally; the UI may not enforce strict assignment yet.
- Use **tags or descriptions** (when available) for cross-cutting concerns like “security” or “latency”.`;

export const bodyBoardMechanics = `The kanban board is the operational heart of Kanban AI. This article explains columns, cards, and the interactions most people use daily.

## Columns

- Columns represent **stages**—Backlog, In progress, Done, or custom phases from your plan.
- Drag a **column** header when the UI supports reordering to match your real process (implementation detail may vary by version).

## Cards (tasks)

- Each card is a **task** with a title, description, status (implicit from the column), and optional metadata.
- **Drag and drop** between columns to reflect reality; the app persists moves for signed-in users.
- Open a card to edit details, add notes, or follow discussion threads when enabled.

## Sprints and timeboxing

- If your workspace shows **sprint** or **week** groupings, use them to limit WIP and make AI suggestions comparable week-over-week.
- Carrying unfinished work forward is normal—update dates rather than duplicating cards when possible.

## Selection and focus

- The **currently open project** drives which tasks the AI sees in context.
- Switching projects switches boards; finish edits in one project before relying on AI quotes that reference the other.

## Performance habits

- **Small tasks** serialize work and reduce thrash; if a card is more than a few sessions of effort, split it.
- End each session by **pulling the next card** to the top of “Doing” so you never cold-start planning.`;

export const bodyAiChat = `The AI sidebar (task chat) is a **project-aware assistant**. It can answer questions, propose task breakdowns, and in many flows help mutate the board through tools wired to your tasks API.

## What context the model sees

- **Active project** metadata—name, type, stack, and high-level description when available.
- **Tasks** in the current board—titles, columns, and fields exposed to the tool layer.
- **Your messages** in the thread (and any system instructions the product adds for safety and product behavior).

It does **not** magically read private repos or tickets outside what you paste or what the app stores.

## Good prompts

- “Break card X into 3–5 smaller tasks and suggest column placement.”
- “I’m blocked on Y—what are two concrete next steps a solo dev could finish today?”
- “Summarize risks for launch based on tasks still in **Backlog**.”

## Limitations

- Models can **hallucinate** file paths or APIs—verify against your repo.
- Large boards may require you to **narrow scope** (“only tasks in **This week**”).
- **Guest mode** may disable or simplify server-backed tool calls; behavior matches deployment.

## Privacy snapshot

- Treat prompts like **support tickets**: do not paste secrets, keys, or personal data you would not email to a vendor.
- Product analytics may record **events** (clicks, task writes) separate from raw chat—see privacy policy for the deployment you use.`;

export const bodyProjectTypes = `Project **types** pick a **prompt profile** so the LLM adopts vocabulary and priorities that fit SaaS, AI tools, content sites, events, and more.

## Why types exist

A marketing site roadmap and an ML training pipeline share kanban mechanics but not **risk profiles**. Types steer the assistant toward:

- Sensible **definition of done**
- **Non-functional** concerns (SEO vs GPU cost)
- **Launch constraints** (content calendar vs app store review)

## Changing type after creation

If you started under the wrong type, update project settings when the UI exposes that field, or describe the correction in AI chat (“Treat this as an AI developer tool, not a blog”). Long-lived projects benefit from **keeping metadata accurate**.

## When types are wrong

Symptoms:

- Tasks are **too marketing-heavy** for a backend-heavy build, or vice versa.
- Suggestions ignore **compliance or accessibility** when your domain needs them.

Fix by editing description, nudging via chat, or recreating the project if metadata is locked.

## Custom stacks

Stack fields are **hints**, not validators. If you use niche frameworks, name them explicitly in both stack tags and the freeform description.`;

export const bodyAccountData = `Signed-in Kanban AI relies on **Supabase** for authentication and data storage. This article summarizes what that means for ownership, retention, and what you should back up.

## Authentication

- Sign-in flows are standard **email/OAuth** patterns provided by Supabase (exact providers depend on configuration).
- Sessions use secure cookies or tokens as implemented in the frontend—follow your org policy for password managers and 2FA on the identity provider if applicable.

## Data stored

- **Projects**, **tasks**, and related records needed for the board.
- **Profile** fields required for billing, analytics segmentation, or account management (deployment-specific).

## Deletion and export

- Account **deletion** and **data export** depend on hosted policies—check the live privacy policy and support channels for the production deployment.
- For self-hosted instances, your operations team controls retention in Postgres.

## AI and logging

- Chat may go to **server-side model APIs**; content handling should be covered in your DPA / privacy docs.
- **Analytics events** may be aggregated for product improvement (see Analytics page for owner-visible summaries on supported deployments).`;

export const bodySharing = `Some deployments expose **read-only public links** for a project so you can share progress without granting edit access.

## Typical pattern

- A **public URL** renders a subset of project data—often board structure and task titles (exact fields depend on implementation).
- Visitors **do not** need an account; treat the link like an unlisted document.

## Safety checklist

- Remove or anonymize **customer names, salaries, vulnerabilities** before publishing.
- Remember that anyone with the link can **reshare** it.
- Rotate or disable the link if the feature is supported when a sprint ends.

## Compared to guest mode

| Mechanism | Writable | Survives new device |
|-----------|----------|---------------------|
| Guest board | Yes (local) | No |
| Signed-in project | Yes (cloud) | Yes |
| Public share | Usually read-only | Yes (until revoked) |

## Search engines

Public routes may be marked **noindex** at the platform level; do not rely on public links for SEO unless you confirm robots policy for that URL pattern.`;

export const bodyLocalDev = `There are two ways to run the repo. **Start with local mode** unless you specifically need Supabase Auth and cloud data.

## Local mode (default for contributors)

No Supabase account. Boards live in a **SQLite file** under the repo’s \`.local/\` folder (gitignored). There is no sign-in—the app uses a fixed local user.

1. **Clone and install**
   \`\`\`bash
   git clone https://github.com/orholam/kanban_ai.git
   cd kanban_ai/frontend
   npm install
   \`\`\`

2. **Configure env** — copy the example file and add your OpenAI key:
   \`\`\`bash
   cp env.local.example .env.local
   \`\`\`
   In \`.env.local\`, set \`OPENAI_API_KEY=sk-...\`. Keep \`VITE_LOCAL_MODE=true\` as in the example.

   Never prefix API keys with \`VITE_\`. That would bundle secrets into client JavaScript. Only \`VITE_SUPABASE_*\` belong in the browser when using Supabase below.

3. **Run one command**
   \`\`\`bash
   npm run dev:local
   \`\`\`
   Open **http://localhost:5173**. Vite proxies \`/api\` to a local process on port **3000** (SQLite + OpenAI proxy). The schema is applied on first run from \`frontend/scripts/local-schema.sql\`.

Account settings, hosted **Analytics**, and **Feedback** are stubbed in local mode because they rely on Supabase.

## Production-like dev (Supabase + Vercel API routes)

Use this when you need real login, RLS, and the same stack as production.

| Where | What |
|-------|------|
| \`frontend/.env.local\` | \`VITE_SUPABASE_URL\`, \`VITE_SUPABASE_ANON_KEY\`, and **do not** set \`VITE_LOCAL_MODE\` to \`true\` |
| Same file or shell | \`OPENAI_API_KEY\` for \`/api/openai\` |

Then run **two** terminals from \`frontend/\`:

1. \`npx vercel dev --listen 3000\`
2. \`npm start\`

Open **http://localhost:5173**. Without something on port **3000**, AI features that call \`/api/openai\` will fail.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| 401 from Supabase | Wrong anon key or URL |
| 500 on \`/api/openai\` | Missing \`OPENAI_API_KEY\` for the process on port 3000 |
| CORS / wrong host | Use the Vite URL; don’t call the API origin directly during dev |
| Empty board after login | RLS or project data in Supabase |`;

export const bodyAnalytics = `The **Analytics** page (when visible for your role) shows aggregate usage: events from signed-in users, guest buckets, task mutations, and AI sidebar usage, depending on configuration.

## Who sees it

- Often restricted to **owner** or admin roles so operational data does not leak to every collaborator.

## How to read guest rows

- Many products bucket **all guest browsers together** for privacy and simplicity—treat spikes as directional, not per-person tracking.

## Operational use

- Validate **feature adoption** after launches.
- Correlate task write volume with **AI engagement** to judge assist quality.
- Watch for **error-type events** if your instrumentation emits them.

## Ethics

Communicate internally that analytics are **not** a substitute for user research and should follow your company’s **retention schedule**.`;

export const bodyFaq = `Short answers to frequent questions. For depth, open the topic’s full article on this board.

## Guest vs account

**Can I lose guest data?** Yes—clearing browser storage or switching devices drops local boards.

**When should I sign in?** As soon as the project matters for more than a day or spans devices.

## AI

**Does the AI see my GitHub?** Only if your deployment integrates it; default behavior is **app-stored context** plus what you paste.

**Why was a suggestion wrong?** Models guess—verify against your codebase and issue tracker.

## Sharing & privacy

**Are public links indexed?** Assume **no** unless you confirm; many workbench-style URLs are \`noindex\`.

**Where is data stored?** Hosted: Supabase and vendor AI APIs as described in the live privacy policy.

## Development

**Why one vs two processes?** \`npm run dev:local\` starts Vite and the local API together. The **Supabase** setup uses two terminals: Vite (\`npm start\`) plus \`vercel dev\` for the same API routes as production.

## Support path

Use in-app **Feedback** or your deployment’s support channel for bugs not covered here. Keep reproduction steps and (sanitized) screenshots minimal and specific.`;
