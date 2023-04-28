const mongoose = require('mongoose');

const { Schema } = mongoose;

const msgSchema = new Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    author: { type: Schema.Types.ObjectId, ref: 'users', required: true },
});

module.exports = mongoose.model('messages', msgSchema);
