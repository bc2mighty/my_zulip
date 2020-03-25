const express = require("express")
const router = express.Router()
const Message = require("../models/message")
const User = require("../models/user")
const Channel = require("../models/channel")
const { Validator } = require('node-input-validator')

router.post("/", async(req, res) => {
    let message
    try{
        const v = new Validator(req.body, {
            channelId: 'required|minLength:10',
            userId: 'required|minLength:10',
            message: 'required'
        })
        const matched = await v.check()
        if(!matched){
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const channel = await Channel.findOne({_id: req.body.channelId})
            const user = await User.findOne({_id: req.body.userId})
            message = new Message(req.body)
            await message.save()
            res.status(200).json({message: "Message Saved successfully", data: [{channel: channel}, {message: message}, {user: user}]})
        }
    }catch(err){
        console.log(err)        
        res.status(422).json({message: "Some Errors Occured", errors: err})
    }
})

router.put("/", async(req, res) => {
    try{
        const v = new Validator(req.body, {
            _id: 'required'
        })
        const matched = await v.check()
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const message = await Message.findOne({_id: req.body._id})
            message.message = req.body.message
            await message.save()
            res.status(200).json({message: "Message Updated Successfully!",data: [{message: message}]})
        }
    }catch(err){
        console.log(err)
        res.status(422).json({message: "Some Errors Encountered", errors: err})
    }
})

router.delete("/", async(req, res) => {
    try{
        const message = await Message.findOneAndDelete({_id: req.body._id})
        if(message){
            res.status(200).json({message: "Message Deleted Successfully"})
        }else{
            res.status(422).json({message: "Message ID provided not found in database"})
        }
    }catch(err){
        res.status(422).json({message: err.name == "CastError" ? "Message ID provided not found in database" : "Error Deleting Message", errors: err})
    }
})

function pile_error_messages(errors){
    let error_messages = [] 
    Object.entries(errors).map(x => {
        let obj = {}
        obj[x[0]] = x[1].message
        error_messages.push(obj)
    })
    return error_messages
}

module.exports = router