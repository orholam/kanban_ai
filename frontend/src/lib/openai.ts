const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface OpenAIRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
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
    }
];

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
    Based on the following project plan, generate a list of tasks for the first week:
    ${projectPlan}
  `;

  const requestBody: OpenAIRequest = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
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

export async function generateProjectOverview(
  projectDetails: { name: string; keywords: string[]; description: string }
): Promise<ReadableStream<Uint8Array> | null> {
  const prompt = `
    Create a high-level project overview for "${projectDetails.name}".
    This project will use: ${projectDetails.keywords.join(', ')}.
    Project description: ${projectDetails.description}

    Ensure the user that the idea is great and give them a single short reason why.
    Explain how the tools they selected will be used to build the project, including any features or integrations they mentioned in the description.
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
