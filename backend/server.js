const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const llmService = require('./services/llmService');
require('dotenv').config();

const app = express();
const port = 5000;
const db_pw = process.env.DB_PW;

app.use(cors());
app.use(express.json());

// setup postgresql connection Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'kanban_ai_db',
  password: process.env.DB_PW,
  port: 5432,
});



// Endpoint to get users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Endpoint to create a new user
app.post('/api/users', async (req, res) => {
  const { name, email, avatar, role, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, avatar, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, avatar, role, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// TASKS //

// Endpoint to get tasks
app.get('/api/tasks', async (req, res) => {
  console.log("retrieving tasks")
  try {
    const result = await pool.query('SELECT * FROM tasks');
    console.log("attempting to return...")
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Endpoint to create a new task
app.post('/api/tasks', async (req, res) => {
  const {
    projectId,
    title,
    description,
    type,
    priority,
    status,
    sprint,
    dueDate,
    assigneeId,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO tasks
      (project_id, title, description, type, priority, status, sprint, due_date, assignee_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [projectId, title, description, type, priority, status, sprint, dueDate, assigneeId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Endpoint to delete a task by ID
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  console.log("Request to delete...");
  console.log(id);
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Task with ID ${id} not found` });
    }

    res.status(200).json({ message: `Task with ID ${id} deleted successfully`, task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Endpoint to update task status
app.put('/api/tasks/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Endpoint to update sprint status
app.put('/api/tasks/:id/sprint', async (req, res) => {
  const { id } = req.params;
  const { sprint } = req.body;
  console.log("Updating sprint value:");
  console.log(sprint);
  try {
    const result = await pool.query(
      'UPDATE tasks SET sprint = $1 WHERE id = $2 RETURNING *',
      [sprint, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start LLM workflow
app.post("/api/llm-workflow", async (req, res) => {
  try {
      const result = await llmService(req.body.input);
      res.json(result);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

