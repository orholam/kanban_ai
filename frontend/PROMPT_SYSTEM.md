# AI project setup

Single-shot setup from a freeform brief — no type picker, no multi-step wizard.

## Flow

1. User opens `/new-project/ai` and pastes a brief (optional title).
2. Client calls `generateProjectSetup()` in [`src/lib/openai.ts`](src/lib/openai.ts) via `POST /api/openai`.
3. Model (`gpt-4o-mini`) returns one tool call: `create_project_setup` with title, description, phases, and starter tasks.
4. App creates the project + tasks and navigates to the board.
5. Roadmap is editable under the project header ([`ProjectRoadmapPanel`](src/components/ProjectRoadmapPanel.tsx)); stored as JSON in `master_plan`.

## Prompt

[`src/lib/prompts.ts`](src/lib/prompts.ts) exports `PROJECT_SETUP_SYSTEM_PROMPT`. Domain (SaaS, AI tool, content, etc.) is **inferred from the brief**, not selected by the user. Phase count is flexible (typically 4–8).

## Helpers

[`src/lib/projectSetup.ts`](src/lib/projectSetup.ts) — `parseMasterPlan` / `serializeMasterPlan` / `titleFromBrief`.

## Board assistant

Ongoing planning uses the project task chat (`runProjectTaskAssistant`), which still receives `master_plan` as context.
