import { getPromptsForProjectType } from './prompts';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface OpenAIRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  function_call?: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      role: string;
      content: string | null;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    finish_reason: string;
  }[];
}

const tools = [
    {
        type: "function",
        function: {
            name: "create_project_plan",
            description: "Create a detailed development plan for the project.",
            parameters: {
                type: "object",
                properties: {
                    weeks: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" }
                            },
                            required: ["title", "description"]
                        },
                        minItems: 1
                    }
                },
                required: ["weeks"],
                additionalProperties: false,
            },
        },
    },
    {
      type: "function",
      function: {
          name: "create_project_tasks",
          description: "Create a list of tasks for the first week of the project.",
          parameters: {
              type: "object",
              properties: {
                  tasks: {
                      type: "array",
                      items: {
                          type: "object",
                          properties: {
                              title: { type: "string" },
                              description: { type: "string" },
                              priority: { type: "string", enum: ["low", "medium", "high"] },
                              type: { type: "string", enum: ["feature", "scope", "bug"] }
                          },
                          required: ["title", "description", "priority", "type"]
                      },
                      minItems: 1
                  }
              },
              required: ["tasks"],
              additionalProperties: false,
          },
      },
  }
];
const tools2 = [
  {
    type: "function",
    function: {
        name: "create_project_tasks",
        description: "Create a list of tasks for the first week of the project.",
        parameters: {
            type: "object",
            properties: {
                tasks: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            priority: { type: "string", enum: ["low", "medium", "high"] },
                            type: { type: "string", enum: ["feature", "scope", "bug"] }
                        },
                        required: ["title", "description", "priority", "type"]
                    },
                    minItems: 1
                }
            },
            required: ["tasks"],
            additionalProperties: false,
        },
    },
}
]

export async function generateProjectPlan(
  projectDetails: { name: string; keywords: string[]; description: string; projectType: string }
): Promise<any> {
  const prompts = getPromptsForProjectType(projectDetails.projectType);
  
  const prompt = `
    ${prompts.projectPlan}
    Project name: "${projectDetails.name}".
    Selected dev tools: ${projectDetails.keywords.join(', ')}.
    Web app description: ${projectDetails.description}.
  `;

  const requestBody: OpenAIRequest = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
    tools,
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function generateFirstWeekTasks(projectPlan: string, projectType: string): Promise<any> {
  const prompts = getPromptsForProjectType(projectType);
  
  const prompt = `
    ${prompts.firstWeekTasks}
    ${projectPlan}
  `;

  const requestBody: OpenAIRequest = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
    tools: tools2,
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  console.log(response);

  const data = await response.json();
  return data;
}

// Note: Should have an external memory store which cycles through tech information
// Some should be sticky - the prompt should always include basic knowledge of LLMs, function calling, modern tools, etc.
// Other information should cycle through - tech headlines, so users can take advantage of the cutting edge tools.

export async function generateProjectOverview(
  projectDetails: { name: string; keywords: string[]; description: string; projectType: string }
): Promise<ReadableStream<Uint8Array> | null> {
  const prompts = getPromptsForProjectType(projectDetails.projectType);
  
  const prompt = `
    ${prompts.projectOverview}
    Create a high-level project overview for "${projectDetails.name}".
    This project will use: ${projectDetails.keywords.join(', ')}.
    Project description: ${projectDetails.description}

    Some background information on vibe coding tools:
    - All major LLMs now support function calling
    - Bolt.new, Loveable, and V0 are the top new prompt -> app tools, which work well for frontend as a starting pointbut also integrate well with supabase for backend.
    - Cursor and Windsurf are popular coding assistants (like Copilot) IDEs
    - Supabase is a popular new database tool that supports Postgresql, storage, and auth.

    Some recent developments from past month that may be useful - only include if relevant to the project!!!:
    - Play AI, Hume and Elevenlabs best voice models
    - Crew, MCP, OpenAI Agent SDK, and more - great agent frameworks

    The total length of your response should be 1-2 paragraphs.
  `;

  const requestBody = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
    stream: true, // Enable streaming
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response.body;
}

export async function autocompletion(prompt: string): Promise<any> {
  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
    // Removed stream: true since we're parsing as JSON
  };
  
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
