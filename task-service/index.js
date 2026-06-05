const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const cors = require('cors');
const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(cors());

const mongoURI = process.env.MONGO_URI || 'mongodb://mongo:27017/tasks';
mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDb"))
  .catch(err => console.error("Mongodb connection error", err));

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  status: { type: String, default: 'pending' }, 
  dueDate: { type: String, default: () => new Date().toISOString().split('T')[0] }, 
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', TaskSchema);

let channel, connection;

async function connectRabbitMQWithRetry(retries = 5, delay = 3000) {
  while (retries) {
    try {
      const rabbitURL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
      connection = await amqp.connect(rabbitURL);
      channel = await connection.createChannel();
      await channel.assertQueue('task_created');
      console.log("Connected to RabbitMQ cleanly");
      return;
    } catch (error) {
      console.error("Error connecting to RabbitMQ:", error.message);
      retries--;
      console.log(`Retrying in ${delay / 1000} seconds... (${retries} left)`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// GET all user filtered tasks
app.get('/tasks', async (req, res) => {
  const { userId } = req.query;
  try {
    let tasks = userId ? await Task.find({ userId }) : await Task.find();
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching filtered tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST a new task (Pushes event to RabbitMQ)
app.post('/tasks', async (req, res) => {
  const { title, description, userId, dueDate } = req.body;
  try {
    const task = new Task({ title, description, userId, dueDate, status: 'pending' });
    await task.save();
    
    // Package up metadata string 
    const message = { id: task._id, title, description, userId, dueDate, action: "created" };
    if (channel) {
      channel.sendToQueue('task_created', Buffer.from(JSON.stringify(message)));
    }
    res.status(201).json(task);
  } catch (err) {
    console.error("Error saving task: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔥 ENHANCED DELETE: Now captures the deleted document data and broadcasts it
app.delete('/tasks/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ error: "Task not found" });

    // Broadcast a custom finished layout string across RabbitMQ to notification consumer
    if (channel) {
      const brokerPayload = {
        userId: deletedTask.userId,
        title: deletedTask.title,
        action: "finished"
      };
      // We reuse the active event pipe channel queue
      channel.sendToQueue('task_created', Buffer.from(JSON.stringify(brokerPayload)));
    }

    res.json({ message: "Task successfully completed and removed", id: req.params.id });
  } catch (err) {
    console.error("Error deleting task: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put('/tasks/:id', async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, userId },
      { new: true }
    );
    if (!updatedTask) return res.status(404).json({ error: "Task not found" });
    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Task service listening on port ${port}`);
  connectRabbitMQWithRetry();
});