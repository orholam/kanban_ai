// This function is not needed, since the call is handled in KanbanBoard.tsx, but I'm keeping it here for now.

export const deleteTask = async (id: string): Promise<void> => {
  const url = `http://localhost:5000/api/tasks/${id}`;

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
