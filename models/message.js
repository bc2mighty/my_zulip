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
    message: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Message', messageSchema)