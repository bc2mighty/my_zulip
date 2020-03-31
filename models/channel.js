const mongoose = require("mongoose")

const channelSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    users:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            unique: true
        }
    ],
    date: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model("Channels", channelSchema)