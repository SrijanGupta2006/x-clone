const mongoose = require('mongoose');

const TweetSchema = new mongoose.Schema({
  text: {
    type: String
  },
  username: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now // This automatically sets the time when a tweet is created
  },
  likes: {
    type: [String], // type is array of strings, cuz for us to implement the like counter tracking method, we need to track the users' ids who have already liked the tweet, and not its no. of likes
    default: [] // default is an empty array
  },
  image: {
    type: String, // We only store the URL/path
    required: false // Not every tweet needs an image
  }
});

// We export it so our server.js can "require" it later
module.exports = mongoose.model('Tweet', TweetSchema);