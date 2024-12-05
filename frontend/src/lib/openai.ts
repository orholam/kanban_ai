const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface OpenAIRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIResponse {
  choices: { message: { role: string; content: string } }[];
}

export async function generateProjectPlan(
  projectDetails: { name: string; keywords: string[]; description: string }
): Promise<string> {
  const prompt = `
    Create a detailed project plan for a project named "${projectDetails.name}".
    Keywords: ${projectDetails.keywords.join(', ')}.
    Description: ${projectDetails.description}.
  `;

  const requestBody: OpenAIRequest = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
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

  const data: OpenAIResponse = await response.json();
  return data.choices[0].message.content;
}

export async function generateFirstWeekTasks(projectPlan: string): Promise<string[]> {
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

  const data: OpenAIResponse = await response.json();
  return data.choices[0].message.content.split('\n').map(task => task.trim());
}