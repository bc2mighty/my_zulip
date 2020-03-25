if(process.env.NODE_ENV !== 'production'){
    require("dotenv").config({path: __dirname + '/.env'})
}
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const cors = require("cors")
const morgan = require("morgan")

app.use(bodyParser.urlencoded({extended: false, limit: "10mb"}))
app.use(bodyParser.json({limit: "10mb"}))
app.use(cors())
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

app.get("/", (req, res) => {
    res.end("Welcome")
})

app.use("/api/v1/users", userRoutes)
app.use("/api/v1/channels", channelRoutes)
app.use("/api/v1/messages", messageRoutes)

const port = process.env.PORT || 3000
app.listen(port)