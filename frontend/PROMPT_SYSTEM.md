# AI project builder

Conversational setup at `/new-project/ai`: full-height chat on the left, live workspace on the right. The model streams replies and updates the draft via tools before you create the board.

## Flow

1. User opens `/new-project/ai` and chats about what they want to build.
2. Client calls `runProjectBuilderChat()` in two OpenAI steps ([`src/lib/openai.ts`](src/lib/openai.ts)): **(1)** stream a real chat reply with no tools (intent / follow-up / steer), **(2)** optional tools with `auto` — zero tools if only a question was needed. Unchanged tool results do not show action chips.
3. Model may call: `update_project_identity`, `set_roadmap`, `set_starter_tasks`, `set_focus_phase`, `request_create_board` — only when values would change.
4. **First pitch** usually states intent then fills missing workspace fields. **Later turns** may only ask a clarifying question with no tools.
5. Chat stays short; structure lands in the workspace panel ([`ProjectBuilderWorkspace`](src/components/ProjectBuilderWorkspace.tsx)).
6. Board creation: header **Create board**, model `request_create_board`, or short intents like “let’s go” / “ship it” / “create it” when the draft is ready. Then project + starter tasks persist and navigate to `/project/:id`.
7. Roadmap remains editable on the board ([`ProjectRoadmapPanel`](src/components/ProjectRoadmapPanel.tsx)); stored as JSON in `master_plan`.

## Prompt

[`src/lib/prompts.ts`](src/lib/prompts.ts) exports `PROJECT_BUILDER_CHAT_SYSTEM_PROMPT`. Domain is inferred from conversation. Roadmaps must be **product ship milestones** (vibe-coding / AI-agent loops, thin vertical slices) — not generic R&D / research / prototype / launch stages. Phase count stays flexible (typically 3–6).

Legacy single-shot `PROJECT_SETUP_SYSTEM_PROMPT` / `generateProjectSetup()` remain available but are no longer the primary UI path.

## Helpers

[`src/lib/projectSetup.ts`](src/lib/projectSetup.ts) — draft types, `draftToSetupResult`, `looksLikeCreateBoardIntent`, `parseMasterPlan` / `serializeMasterPlan` / `titleFromBrief`.

## Board assistant

Ongoing planning uses the project task chat (`runProjectTaskAssistant`). It receives project metadata including `master_plan` as context, and can call `update_project` (title, description, roadmap phases), task CRUD, comments, and `undo_last_action`.
