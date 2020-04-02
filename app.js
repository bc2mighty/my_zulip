if(process.env.NODE_ENV !== 'production'){
    require("dotenv").config({path: __dirname + '/.env'})
}
const http = require("http")
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const cors = require("cors")
const morgan = require("morgan")
const socketio = require("socket.io")

const User = require("./models/user")
const Message = require("./models/message")
const Channel = require("./models/channel")

app.use(bodyParser.urlencoded({extended: false, limit: "10mb"}))
app.use(bodyParser.json({limit: "10mb"}))
app.use(morgan("dev"))

const mongoose = require("mongoose")
// console.log(process.env.NODE_ENV)

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false})
const db = mongoose.connection

db.on("error", error => console.log(error))
db.on("open", () => console.log("Connected"))

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({error: error.message})
})

const userRoutes = require("./routes/users")
const channelRoutes = require("./routes/channels")
const messageRoutes = require("./routes/messages")
const conversationRoutes = require("./routes/conversations")

app.use("/api/v1/users", userRoutes)
app.use("/api/v1/channels", channelRoutes)
app.use("/api/v1/messages", messageRoutes)
app.use("/api/v1/conversations", conversationRoutes)

const server = http.createServer(app)

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.use(cors())
//Socket IO Connection Part
const io = socketio(server)
io.on("connection", (socket) => {
    console.log("yeah, connected to socket")

    //Emit after Joining a channel
    //Expecting channelId, name
    socket.on("join", (data) => {
        socket.broadcast.to(data.channelId).emit('joinMessage', {user: 'admin', text: `${data.name} has joined the channel`})
        socket.join(data.channelId)
    })

    //Emit after Dsiconnectng from socket
    //Expecting channelId, name
    socket.on("disconnect", (reason) => {
        if (reason === 'io server disconnect') {
          // the disconnection was initiated by the server, you need to reconnect manually
          socket.connect();
        }else{
            socket.broadcast.to(data.channelId).emit('leaveMessage', {user: 'admin', text: `${data.name} has left the channel`})
            socket.disconnect()
        }
    })

    //Emit after Updating a channel
    //Expecting channelId, channel
    socket.on("channelUpdate", (data) => {
        console.log(data)    
        io.to(data.channelId).emit("channelUpdateConfirmed", {message: `${data.channel} Channel Updated!`, channel: data.channel})
    })

    //Emit after deleting a message
    //Expecting channelId, channel
    socket.on("channelDelete", (data) => {
        console.log(data)
        io.to(data.channelId).emit("channelDeleteConfirmed", {message: `${data.channel} Channel Deleted!`, channel: data.channel})
    })

    //Emit after sending a message
    //Expecting channelId, name, message
    socket.on("sendMessage", (data) => {
        console.log(data)
        io.to(data.channelId).emit("sendMessageConfirmed", {user: data.name, message: data.message})
    })

    //Emit after Update a message
    //Expecting channelId, messageId, message, name
    socket.on("updateMessage", (data) => {
        console.log(data)
        io.to(data.channelId).emit("updateMessageConfirmed", {user: data.name, messageId: data.messageId, message: data.message})
    })

    //Emit after Deleting a message
    //Expecting channelId, messageId, name, message
    socket.on("deleteMessage", (data) => {
        console.log(data)
        io.to(data.channelId).emit("deleteMessageConfirmed", {user: data.name, messageId: data.messageId, message: data.message})
    })
})

const port = process.env.PORT || 3000
app.set('socketio', io)
server.listen(port)