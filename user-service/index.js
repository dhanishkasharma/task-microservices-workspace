const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(bodyParser.json());
// Replace the current app.use(cors()) with this:


// REPLACE your current cors code with this in all 3 server.js files
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Added OPTIONS here
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Ensures the preflight (OPTIONS) returns 200 OK
}));

// Connect to MongoDB (Separate database for users)
const mongoURI = process.env.MONGO_URI || 'mongodb://mongo:27017/users';
mongoose.connect(mongoURI)
  .then(() => console.log("User Service connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define the User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Enforce unique emails in DB
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// GET /users - Used by Dashboard to count total active system accounts
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, email: 1 }); // Return only name and email
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users - Saves newly registered users into MongoDB
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  
  try {
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required fields" });
    }

    const targetEmail = email.trim().toLowerCase();

    // Check if user already exists in the real database
    const existingUser = await User.findOne({ email: targetEmail });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const user = new User({ 
      name: name.trim(), 
      email: targetEmail 
    });
    
    await user.save();
    res.status(201).json(user); // Returns the saved user including their real MongoDB _id
  } catch (err) {
    console.error("Error saving user: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/', (req, res) => {
  res.send('User microservice is operational!');
});

app.listen(port, () => {
  console.log(`User service listening on port ${port}`);
});