const OpenAI = require('openai');
require('dotenv').config();

const api_key = process.env.OPENAI_API_KEY;
const openai = new OpenAI();

const tools = [
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Given a web app project idea, create a 10 week plan for how to accomplish it, with the 10th week being dedicated to automated testing.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "number",
            description: "Must always be 1"
          },
          realistic: {
            type: "boolean",
            description: "Return true if it's realistic that one entry-level developer could accomplish this in 10 weeks."
          },
          plan: {
            type: "string",
            description: "A 10-week plan for the provided project in 10 bullet points."
          }
        },
        required: ["id", "realistic", "plan"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task description, detailed, with multiple short paragraphs if necessary. Keep code clean by using line breaks with <br>.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the task"
          },
          description: {
            type: "string",
            description: "The description of the task"
          },
          type: {
            type: "string",
            enum: ["feature", "bug", "scope"],
            description: "The type of task"
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "The priority level of the task"
          }
        },
        required: ["title", "description", "type", "priority"]
      }
    }
  }
];

const llmService = async (task_description) => {
  console.log("task_description");
  console.log(task_description);
  let llm_response = "";

  const messages = [{
    role: "system",
    content:
    `You are a scrum master, but before you create tickets you have to create a dev plan.
    Your goal is to help a developer create their app idea from start to finish in 10 weeks.
    The developer already knows exactly what they want to create.
    They are intelligent, and can move past the design phase quickly.
    Week 1 should always include diving straight into the code.
    `
  },{
    role: "user",
    content: task_description
  }];
  console.log(messages);

  // Call llm
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    tools: tools,
    tool_choice: {"type": "function", "function": {"name": "create_task"}}
  })
  console.log(completion.choices[0].message.tool_calls);

  return completion.choices[0].message.tool_calls[0].function.arguments;
};

module.exports = llmService;
