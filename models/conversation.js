const mongoose = require('mongoose');
const conversationSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

module.exports = mongoose.model('Conversation', conversationSchema);