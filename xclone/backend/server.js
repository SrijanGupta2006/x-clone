const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user'); // Import your new model
const JWT_SECRET = "some_super_secret_random_string_here"; // In production, this goes in .env
const Tweet = require('./models/tweet'); // Import your custom model

// 1. Load Environment Variables
dotenv.config();

const app = express();

// 2. Middleware
app.use(cors({
  origin: "*"
})); // Allows frontend to talk to backend
app.use(express.json()); // Allows backend to read JSON data

// 3. Connect to MongoDB
const uri = process.env.MONGO_URI;

mongoose.connect(uri).then(() =>
  console.log("MongoDB connected successfully🔥")).catch(err => console.log("❌ Connection Error: ", err));

app.use((req, res, next) => {
  console.log(`📡 Incoming Request: ${req.method} ${req.url}`);
  next();
});

// 4. Basic Route to test:
app.get('/', (req, res) => {
  res.send("X Clone API is running...");
});

// Configure where to store images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // save to the uploads folder
  },
  filename: (req, file, cb) => {
    // Create a unique filename: "timestamp-originalName.jpg"
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Make the 'uploads' folder public so the frontend can access images
app.use('/uploads', express.static('uploads'));


// REGISTER ROUTE:
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {

    // 1. Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists!" });
    }

    // 2. Hash the password (The most important step)
    // 10 is the "salt rounds" (complexity of the scramble)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error(" REGISTER CRASH DETAILS:", error);
    res.status(500).json({ error: "Error registering user" });
  }

});

// LOGIN ROUTE:
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 2. Compare the password (Raw vs Hash)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    // 3. Generate the token
    // We pack the user's ID inside the token so we know who they are later
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour 
    );

    // 4. Send the token to the frontend
    res.json({ token, username: user.username, userId: user._id });

  } catch (error) {
    console.log("CRASH DETAILS: ", error);

    res.status(500).json({ error: "Error logging in" });
  }

});

// The Middleware that checks for token again, to ensure the posts are being made by a genuine user:
const authenticateToken = (req, res, next) => {
  // 1. Look for the token in the headers
  const authHeader = req.headers['authorization'];

  // Tokens usually come in the format: "Bearer eyJhbGci..."
  const token = authHeader && authHeader.split(' ')[1];

  // 2. If no token, kick them out (401 Unauthorized)
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // 3. Verify the token is real and hasn't expired
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }

    // 4. Token is good! Attach the decoded user info to the request
    req.user = user;

    // 5. Pass them to the actual route
    next();
  });
};


// Using our custom model in a route, to CREATE a post:
app.post('/api/tweets', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log("📥 Request received!");
    const { text, username } = req.body // Text data comes from body
    const imagePath = req.file ? req.file.path : null; // File data comes from req.file

    const newTweet = new Tweet({
      text: text || "", // Handle empty text if image-only
      username: req.user.username,
      image: imagePath,
      likes: []
    });
    const savedTweet = await newTweet.save();
    res.status(201).json(savedTweet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/tweets', async (req, res) => {
  try {
    const tweets = await Tweet.find().sort({ createdAt: -1 });
    res.json(tweets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a tweet by ID
app.delete('/api/tweets/:id',authenticateToken, async (req, res) => {
  try {

    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }

    if (tweet.username !== req.user.username) {
      return res.status(403).json({ error: "Unauthorized: You can only delete your own posts." });
    }

    await Tweet.findByIdAndDelete(req.params.id);

    res.json({ message: "Tweet deleted successfully!" });
  } catch (err) {
    console.log("🚨 DELETE CRASH DETAILS:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tweets/:id/like', async (req, res) => {
  const { userId } = req.body; // We will send this from frontend
  const tweetId = req.params.id;

  try {
    const tweet = await Tweet.findById(tweetId);

    // Check if user has already liked it
    if (tweet.likes.includes(userId)) {
      // UNLIKE: Remove the user from the array
      await Tweet.findByIdAndUpdate(tweetId, { $pull: { likes: userId } });
    }
    else {
      // LIKE: Add the user to the array
      await Tweet.findByIdAndUpdate(tweetId, { $addToSet: { likes: userId } });
    }

    // Return the updated tweet so frontend can show the new count
    const updatedTweet = await Tweet.findById(tweetId);
    res.json(updatedTweet);
  } catch (error) {
    res.status(500).json({ error: "Could not toggle like" });
  }
});

// 5. Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});






