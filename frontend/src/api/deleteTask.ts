// This function is not needed, since the call is handled in KanbanBoard.tsx, but I'm keeping it here for now.
import { API_ENDPOINTS } from '../config/apiConfig';


export const deleteTask = async (id: string): Promise<void> => {
  const url = `${API_ENDPOINTS.tasks}/${id}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting task: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw error;
  }
};
