export const createTask = async (taskDescription: string): Promise<any> => {
  const llm_url = 'http://localhost:5000/api/llm-workflow';
  const task_url = 'http://localhost:5000/api/tasks';

  try {
    const llm_response = await fetch(llm_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: taskDescription }), // Sending task description as part of the body
    });
    if (!llm_response.ok) {
      throw new Error(`Error creating task: ${llm_response.status} ${llm_response.statusText}`);
    }
    const llm_data_raw = await llm_response.json();
    const llm_data = JSON.parse(llm_data_raw);

    const response_body = {
      projectId: "123qrep-8673",
      title: llm_data.title,
      description: llm_data.description,
      type: llm_data.type,
      priority: llm_data.priority,
      status: "todo",
      sprint: 1,
      dueDate: "2024-12-01",
      assigneeId: 1
    };
    const task_response = await fetch(task_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response_body),
    });
    if (!task_response.ok) {
      throw new Error(`Error creating task: ${task_response.status} ${task_response.statusText}`);
    }

    const res = await task_response.json();
    //console.log('Task creation response:', res);

    return res;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
