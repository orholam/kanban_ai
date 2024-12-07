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
  projectDetails: { name: string; keywords: string[]; description: string }
): Promise<any> {
  const prompt = `
    Your task is to create a detailed no-nonsense development pipeline over the course of 10 weeks for a solopreneur.
    Your project outline should not include planning - you are the planner.
    It should dive right into the development process, starting with design, frontend, backend, and deployment.
    Each week should be described in 1-2 sentences.
    Create a detailed development plan for a project named "${projectDetails.name}".
    Incorporate the following dev tools: ${projectDetails.keywords.join(', ')}.
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

export async function generateFirstWeekTasks(projectPlan: string): Promise<any> {
  const prompt = `
    Based on the following project plan, generate a list of 4-5 tasks for the first week:
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
  projectDetails: { name: string; keywords: string[]; description: string }
): Promise<ReadableStream<Uint8Array> | null> {
  const prompt = `
    Create a high-level project overview for "${projectDetails.name}".
    This project will use: ${projectDetails.keywords.join(', ')}.
    Project description: ${projectDetails.description}

    Some background information on recent advancements in tech - only include if relevant to the project:
    - Elevenlabs introduced conversational voice model
    - All major LLMs now support function calling
    - Bolt.new, Loveable, and V0 are the top new prompt -> app tools, which work well for frontend as a starting pointbut also integrate well with supabase for backend.
    - Cursor and Windsurf are popular coding assistants (like Copilot) IDEs
    - Supabase is a popular new database tool that supports Postgresql, storage, and auth.

    Write a single informal sentence saying the idea is cool because of X and you're going to help them build it, but then dive right into the project plan in the next paragraph.
    Explain how the tools they selected will be used to build the project, including any features or integrations they mentioned in the description.
    Don't be afraid to be technical, and avoid using any buzzwords. If there's a good cop and bad cop, be the bad cop.
    Then say below you're generating a project plan.

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
