const express = require('express');
const router = express.Router();
const Conversation = require('../models/conversation');
const Channel = require('../models/channel');
const Message = require('../models/message');
const { Validator } = require('node-input-validator')
const webtoken = require("./webtoken")

//Get all conversations for a particular channel

router.post('/channel', webtoken.verifyToken, async(req, res , next)=> {
    try{
        const channel = await Channel.findOne({_id: req.body.channelId})
        const message = await Message.findOne({_id: req.body.messageId})
        const convos = await Conversation.find({messageId: req.body.messageId})
        res.status(200).json({message: `Conversations for channel: ${channel.name} and message: ${message.message} Found`, conversations: convos, message: message})
    }catch(err){
        res.status(500).json({
            message: "Errors encountered",
            errors: err,
        })
    }
})

//Get a particular conversation and messages in the conversation

router.post('/messages', webtoken.verifyToken, async(req, res, next) =>{
    try{
        const id = req.body.messageId
        const conversation = await Conversation.findOne({messageId: id})
        const messages = await Message.find({conversationId: conversation._id})
        res.status(200).json({message: "Conversation Details", messages: messages, conversation: conversation})
    }catch(err){
        res.status(422).json({message: "Some errors found", error: err});
    }
})

//Save a conversation

router.post('/', webtoken.verifyToken, async(req, res , next) =>{
    try{
        const v = new Validator(req.body, {
            title: 'required',
            channelId: 'required',
            messageId: 'required'
        })  
        const matched = await v.check()
        if(!matched){
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const conversation = await Conversation.find({messageId: req.body.messageId})
            if(!conversation.length){
                const channel = await Channel.findOne({_id: req.body.channelId})
                const message = await Message.findOne({_id: req.body.messageId})
                const convo = new Conversation(req.body)
                await convo.save()
                res.status(201).json({
                    message: "Conversation Saved Successfully!", 
                    createdConvo:convo
                })
            }else{
                res.status(422).json({message: "Conversation with that messageId already exists."})
            }
        }
    }catch(err){
        res.status(422).json({
            message: err.name == "CastError" ? "Channel ID provided not found in database" : "Error Saving Conversation", 
            errors: err
        })
    }
});

//Update a conversation

router.patch('/:convoId', webtoken.verifyToken, async(req, res, next) =>{
    const id = req.params.convoId;
    Conversation.findOneAndUpdate({_id: id},req.body, {new: true})
    .then(result =>{
        console.log(result);
        res.status(200).json({
            message: "Conversation Updated Successfully!", 
            updatedConversation: result
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            message: err.name == "CastError" ? "Conversation ID provided not found in database" : "Error Updating Conversation", 
            error:err
        })
    })
})

//Delete a conversation and it's messages

router.delete('/:convoId', webtoken.verifyToken, async(req, res, next) =>{
    const id = req.params.convoId;
    Conversation.findOneAndDelete({_id: id})
    .then( result => {
        res.status(200).json({
            message: "Conversation Deleted Successfully!", 
            deletedConversation: result
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            message: err.name == "CastError" ? "Conversation ID provided not found in database" : "Error Deleting Conversation", 
            error:err
        });
    });

});

function pile_error_messages(errors){
    let error_messages = [] 
    Object.entries(errors).map(x => {
        let obj = {}
        obj[x[0]] = x[1].message
        error_messages.push(obj)
    })
    return error_messages
}


module.exports = router;