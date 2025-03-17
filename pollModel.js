const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    userId: String,
    choice: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PollResponse', pollSchema);