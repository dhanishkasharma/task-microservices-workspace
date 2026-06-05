const amqp = require('amqplib');
const express = require('express');
const mongoose = require('mongoose'); 
const bodyParser = require('body-parser');
const cors = require('cors'); 

const app = express();
const port = 3003;

app.use(bodyParser.json());
// Replace the current app.use(cors()) with this:
app.use(cors({
  origin: '*', // Allows requests from any origin (e.g., your Vercel app)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://mongo:27017/notifications';
mongoose.connect(mongoURI)
  .then(() => console.log("Notification Service connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// 🔥 FIXED: Added userId right into the core Mongoose Schema properties
const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);

// GET filtered logs
app.get('/notifications', async (req, res) => {
  const { userId } = req.query;

  try {
    let logs;
    if (userId) {
      // Fetch user specific broker actions, sorted newest first
      logs = await Notification.find({ userId: userId }).sort({ createdAt: -1 });
    } else {
      logs = await Notification.find().sort({ createdAt: -1 });
    }
    res.json(logs);
  } catch (err) {
    console.error("Error fetching filtered logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// RabbitMQ Consumer 
async function startRabbitMQ() {
    try {

        const rabbitURL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
        const connection = await amqp.connect(rabbitURL);
        const channel = await connection.createChannel();
        console.log("Notification service connected to RabbitMQ");

        channel.consume('task_created', async (msg) => {
            if (msg !== null) {
                try {
                    const taskData = JSON.parse(msg.content.toString());
                    console.log("Received task created event payload:", taskData.title);

                    // 🔥 FIXED: Appended taskData.userId to document creation
                    const notification = new Notification({
                        userId: taskData.userId, 
                        message: `Task Created: "${taskData.title}" added to pipeline via RabbitMQ.`
                    });
                    await notification.save();
                    console.log("RabbitMQ notification successfully saved to DB!");

                    channel.ack(msg);
                } catch (parseOrSaveError) {
                    console.error("Error processing message content:", parseOrSaveError);
                    channel.ack(msg); 
                }
            }
        });
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error.message);
        setTimeout(startRabbitMQ, 5000);
    }
}

// HTTP fallback POST link
app.post('/notifications', async (req, res) => {
  const { userId, message } = req.body;

  try {
    const newNotification = new Notification({
      userId: userId, 
      message: message,
      createdAt: new Date()
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (err) {
    console.error("Error creating notification schema document:", err);
    res.status(500).json({ error: "Could not record background ledger document." });
  }
});

app.delete('/notifications', async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: "All notification logs cleared successfully" });
  } catch (err) {
    console.error("Error clearing notifications: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

startRabbitMQ();

app.listen(port, () => {
  console.log(`Notification service listening on port ${port}`);
});