const mongoose = require("mongoose")

const messageSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true,
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
    },
    message: {
        type: String,
        required: true
    },
    emojis: [
        {
            unified: String,
            emoji: String,
            originalUnified: String,
            names: [

            ],
            activeSkinTone: String,
            user: mongoose.Schema.Types.ObjectId
        }
    ],
    date:{
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('Message', messageSchema)