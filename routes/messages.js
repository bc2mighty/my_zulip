const express = require("express")
const router = express.Router()
const Message = require("../models/message")
const User = require("../models/user")
const Channel = require("../models/channel")
const { Validator } = require('node-input-validator')
const webtoken = require("./webtoken")

router.post("/emojis", webtoken.verifyToken, async(req, res) => {
    try{
        const v = new Validator(req.body, {
            _id: 'required',
            user_id: 'required',
            unified: 'required',
            emoji: 'required',
            originalUnified: 'required',
            names: 'required|array',
            'names.*': 'required',
            _id: 'required',
        })

        const matched = await v.check();
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const message = await Message.findOneAndUpdate({_id: req.body._id}, {
                $push: { emojis:
                        {
                        user: req.body.user_id,
                        unified: req.body.unified,
                        emoji: req.body.emoji,
                        originalUnified: req.body.originalUnified,
                        names: req.body.names,
                        activeSkinTone: req.body.activeSkinTone
                    }
                },
            }, {new: true})
        
            if(message){
                res.status(200).json({message: "Emoji Added To Message Successfully"})
            }else{
                res.status(422).json({message: "Please provide valid Message ID,User ID and Emoji Details"})
            }
        }
    }catch(err){
        console.log(err)
        res.status(422).json({message: "Some Errors Occured", errors: err})
    }
})

router.put("/emojis", webtoken.verifyToken, async(req, res) => {
    try{
        const v = new Validator(req.body, {
            _id: 'required',
            emoji_id: 'required',
            user_id: 'required',
            unified: 'required',
            emoji: 'required',
            originalUnified: 'required',
            names: 'required|array',
            'names.*': 'required',
            _id: 'required',
        })

        const matched = await v.check();
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const message = await Message.findOneAndUpdate({"emojis": {$elemMatch: {_id: req.body.emoji_id}}}, {
                $set: {
                    "emojis.$.user": req.body.user_id,
                    "emojis.$.unified": req.body.unified,
                    "emojis.$.emoji": req.body.emoji,
                    "emojis.$.originalUnified": req.body.originalUnified,
                    "emojis.$.names": req.body.names,
                    "emojis.$.activeSkinTone": req.body.activeSkinTone
                }
            }, {new: true})
            res.status(200).json({message: "Emoji Updated Successfully", data: {message: message}})
        }
    }catch(err){
        console.log(err)
        res.status(422).json({message: "Some Errors Occured", errors: err})
    }
})

router.delete("/emojis", webtoken.verifyToken, async(req, res) => {
    try{
        const v = new Validator(req.body, {
            _id: 'required',
            emoji_id: 'required'
        })
        const matched = await v.check()
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const message = await Message.findOneAndUpdate({_id: req.body._id}, {
                "$pull" : {
                    "emojis": {_id: req.body.emoji_id}
                }
            },{
                new: true
            })
            console.log(message)
            
            res.status(200).json({message: "Emoji Deleted Successfully", data: {message: message}})
        }
    }catch(err){
        console.log(err)
        res.status(422).json({message: "Some Errors Occured", errors: err})
    }
})

router.post("/", webtoken.verifyToken, async(req, res) => {
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
            console.log(req.body)   
            message = new Message(req.body)
            await message.save()
            const io = req.app.get("socketio")
            
            res.status(200).json({message: "Message Saved successfully", data: [{channel: channel}, {message: message}, {user: user}]})
        }
    }catch(err){
        console.log(err)        
        res.status(422).json({message: "Some Errors Occured", errors: err})
    }
})

router.put("/", webtoken.verifyToken, async(req, res) => {
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

router.delete("/", webtoken.verifyToken, async(req, res) => {
    try{
        const v = new Validator(req.body, {
            _id: 'required'
        })
        const matched = await v.check()
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const message = await Message.findOneAndDelete({_id: req.body._id})
            if(message){
                res.status(200).json({message: "Message Deleted Successfully"})
            }else{
                res.status(422).json({message: "Message ID provided not found in database"})
            }
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