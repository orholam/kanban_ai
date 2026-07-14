# AI project builder

Conversational setup at `/new-project/ai`: full-height chat on the left, live workspace on the right. The model streams replies and updates the draft via tools before you create the board.

## Flow

1. User opens `/new-project/ai` and chats about what they want to build.
2. Client calls `runProjectBuilderChat()` in [`src/lib/openai.ts`](src/lib/openai.ts) via a single streaming `POST /api/openai` (text + tools). Workspace tool calls also render as small action chips in the chat UI — no extra model call.
3. Model may call: `update_project_identity`, `set_roadmap`, `set_starter_tasks`, `set_focus_phase`.
4. Chat stays short; structure lands in the workspace panel ([`ProjectBuilderWorkspace`](src/components/ProjectBuilderWorkspace.tsx)).
5. User clicks **Create board** when ready — project + starter tasks are persisted, then navigation to `/project/:id`.
6. Roadmap remains editable on the board ([`ProjectRoadmapPanel`](src/components/ProjectRoadmapPanel.tsx)); stored as JSON in `master_plan`.

## Prompt

[`src/lib/prompts.ts`](src/lib/prompts.ts) exports `PROJECT_BUILDER_CHAT_SYSTEM_PROMPT`. Domain is inferred from conversation. Roadmaps must be **product ship milestones** (vibe-coding / AI-agent loops, thin vertical slices) — not generic R&D / research / prototype / launch stages. Phase count stays flexible (typically 3–6).

Legacy single-shot `PROJECT_SETUP_SYSTEM_PROMPT` / `generateProjectSetup()` remain available but are no longer the primary UI path.

## Helpers

[`src/lib/projectSetup.ts`](src/lib/projectSetup.ts) — draft types, `draftToSetupResult`, `parseMasterPlan` / `serializeMasterPlan` / `titleFromBrief`.

## Board assistant

Ongoing planning uses the project task chat (`runProjectTaskAssistant`), which still receives `master_plan` as context.
