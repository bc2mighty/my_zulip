const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Channel = require("../models/channel")
const { Validator } = require('node-input-validator')
const webtoken = require("./webtoken")

router.get("/", webtoken.verifyToken, async(req, res) => {
    try{
        const channels = await Channel.find({})
        res.status(200).json({message: "Channels Details found successfully", channels: channels})
    }catch(err){
        res.status(200).json({message: "Error Finding Channel Details", errors: err})
    }
})

router.get("/:id", webtoken.verifyToken, async(req, res) => {
    try{
        const channel = await Channel.findOne({_id: req.params.id})       
        res.status(200).json({message: "Channel Details found successfully", channel: channel})
    }catch(err){
        res.status(422).json({message: err.name == "CastError" ? "Channel ID provided not found in database" : "Error Finding Channel Details", errors: err})
    }
})

router.post("/", webtoken.verifyToken, async(req, res) => {
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

router.put("/", webtoken.verifyToken, async(req, res) => {
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

router.delete("/", webtoken.verifyToken, async(req, res) => {
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

async function verifyToken (req, res, next){
    const bearerHeader = req.headers['authorization']
    if(typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(" ")
        const bearerToken = bearer[1]
        req.token = bearerToken
        await jwt.verify(req.token, "5b2f47da43492548593a2d0ecdc52f58", (err, authData) => {
            if(err){
                res.sendStatus(403)
            }
        })
        next() 
    }else{
        res.sendStatus(403)
    }
}

module.exports = router