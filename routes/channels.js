const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Channel = require("../models/channel")
const { Validator } = require('node-input-validator')


router.get("/", async(req, res) => {
    try{
        const channels = await Channel.find({})
        res.status(200).json({message: "Channels Details found successfully", channels: channels})
    }catch(err){
        res.status(200).json({message: "Error Finding Channel Details", errors: err})
    }
})

router.get("/:id", async(req, res) => {
    try{
        const channel = await Channel.findOne({_id: req.params.id})       
        res.status(200).json({message: "Channel Details found successfully", channel: channel})
    }catch(err){
        res.status(422).json({message: err.name == "CastError" ? "Channel ID provided not found in database" : "Error Finding Channel Details", errors: err})
    }
})

router.post("/", async(req, res) => {
    try{
        const v = new Validator(req.body, {
            name: 'required',
            description: 'required'
        })
        const matched = await v.check();
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Error Saving Channel", errors: error_messages})
        }else{
            const channel = new Channel(req.body)
            await channel.save()
            res.status(200).json({message: "Channel Saved Successfully", channel: channel})
        }
    }catch(err){
        console.log(err)
        res.status(422).json({message: "Some Errors Encountered"})
    }
})

router.put("/", async(req, res) => {
    try{
        const v = new Validator(req.body, {
            name: 'required',
            description: 'required',
            _id: 'required'
        })
        const matched = await v.check();
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Error Saving Channel", errors: error_messages})
        }else{
            const channel = await Channel.findOneAndUpdate({_id: req.body._id}, req.body, {new: true})
            console.log(channel)            
            if(channel){
                res.status(200).json({message: "Channel Updated Successfully"})
            }else{
                res.status(422).json({message: "Channel ID provided not found in database"})
            }
        }
    }catch(err){
        console.log(err)
        res.status(422).json({message: "Some Errors Encountered"})
    }
})

router.delete("/", async(req, res) => {
    try{
        const channel = await Channel.findOneAndDelete({_id: req.body._id})
        if(channel){
            res.status(200).json({message: "Channel Deleted Successfully"})
        }else{
            res.status(422).json({message: "Channel ID provided not found in database"})
        }
    }catch(err){
        res.status(422).json({message: err.name == "CastError" ? "Channel ID provided not found in database" : "Error Deleting Channel", errors: err})
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