// apiConfig.ts

// Ensure TypeScript knows about the environment variable
const API_BASE: string = "http://localhost:5000";

// Define the API endpoints with explicit type annotations
export const API_ENDPOINTS: Record<string, string> = {
    tasks: `${API_BASE}/api/tasks`,
    llm: `${API_BASE}/api/llm-workflow`,
};
