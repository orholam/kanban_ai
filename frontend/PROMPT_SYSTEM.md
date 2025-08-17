# Dynamic Prompt System

This document explains how the dynamic prompt system works in the Kanban AI application.

## Overview

The application now supports different project types (SaaS App, AI Tool, Blog/Website, Event Planning) with customized LLM prompts for each type. This allows the AI to provide more relevant and targeted guidance based on the specific type of project being built.

## Architecture

### 1. Project Type Selection
- Users select a project type in the `ProjectDetails` component
- The type is stored in the project data and flows through the entire creation process

### 2. Prompt Configuration (`src/lib/prompts.ts`)
- **`PROJECT_TYPE_PROMPTS`**: Contains customized prompts for each project type
- **`DEFAULT_PROMPTS`**: Fallback prompts for unknown project types
- **`getPromptsForProjectType()`**: Function to retrieve the appropriate prompts

### 3. LLM Integration (`src/lib/openai.ts`)
- All LLM functions now accept a `projectType` parameter
- Prompts are dynamically selected based on the project type
- Functions include:
  - `generateProjectPlan()`: Creates 10-week development pipeline
  - `generateFirstWeekTasks()`: Generates first week tasks
  - `generateProjectOverview()`: Creates project overview

## Project Types and Their Focus

### SaaS App
- **Focus**: Scalable web applications with user authentication
- **Emphasis**: Database design, deployment, user management
- **First Week**: Development environment setup, project structure

### AI Tool
- **Focus**: AI-powered applications with model integration
- **Emphasis**: API design, AI model selection, user interface for AI interactions
- **First Week**: AI development environment, model research

### Blog/Website
- **Focus**: Content-focused websites with SEO optimization
- **Emphasis**: Content management, user engagement, search optimization
- **First Week**: Content planning, design mockups

### Event Planning
- **Focus**: Event management platforms with coordination features
- **Emphasis**: Registration systems, scheduling, user experience
- **First Week**: Requirements gathering, system architecture

## Data Flow

1. **Project Creation**: User selects type in `ProjectDetails`
2. **Data Storage**: Type is stored in `projectData.type`
3. **LLM Calls**: Type is passed to all LLM functions
4. **Prompt Selection**: Appropriate prompts are selected based on type
5. **Database**: Project type is stored in the database

## Adding New Project Types

To add a new project type:

1. Add the type to the `TYPES` array in `ProjectDetails.tsx`
2. Add corresponding prompts to `PROJECT_TYPE_PROMPTS` in `prompts.ts`
3. Update the `RECOMMENDED_STACKS` object if needed
4. Test the new type through the project creation flow

## Benefits

- **Relevant Guidance**: AI provides type-specific advice and planning
- **Better User Experience**: Users get guidance tailored to their project type
- **Scalable**: Easy to add new project types and prompts
- **Consistent**: All LLM interactions use the same prompt structure
- **Maintainable**: Prompts are centralized and easy to modify

## Example Usage

```typescript
// Get prompts for a specific project type
const prompts = getPromptsForProjectType("AI Tool");

// Use in LLM function
const projectPlan = await generateProjectPlan({
  name: "My AI Chatbot",
  description: "A conversational AI assistant",
  keywords: ["Python", "OpenAI", "FastAPI"],
  projectType: "AI Tool"
});
``` 