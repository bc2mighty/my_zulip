const express = require("express")
const router = express.Router()
const User = require("../models/user")
const { Validator } = require('node-input-validator')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const webtoken = require("./webtoken")

const jwt = require("jsonwebtoken")

router.get("/", webtoken.verifyToken, async(req, res, next) => {
    try{
        const users = await User.find()
        res.status(200).json({
            message: "Users Details",
            users: users
        })
    }catch(err){       
        res.status(500).json({
            errors:  err.errors
        })
    }
})

router.put("/", webtoken.verifyToken, async(req, res) => {
    try{
        const v = new Validator(req.body, {
            firstName: 'required',
            lastName: 'required',
            bio: 'required|minLength:20',
            email: 'required|email',
            username: 'required|minLength:5',
            phone: 'required|minLength:11',
            _id: 'required'
        })

        const matched = await v.check()
    
        if (!matched) {
            let error_messages = [] 
            Object.entries(v.errors).map(x => {
                let obj = {}
                obj[x[0]] = x[1].message
                error_messages.push(obj)
            })
            res.status(422).json({message: "Error Validating User", errors: error_messages})
        }else{
            const user = await User.findOneAndUpdate({_id: req.body._id}, req.body, {new: true})
            res.status(200).json({message: "User Updated Successfully", user: user})
        }
    }catch(err){     
        let error_messages = []    
        console.log(err)           
        if(err.name == "MongoError" && err.code === 11000){     
            Object.entries(err.keyValue).map(x => {
                let obj = {}
                obj[x[0]] = `${x[0]} was duplicated`
                error_messages.push(obj)
            })
            res.status(422).json({message: "Some fields are duplicated", errors: error_messages})
        }else{
            res.status(422).json({message: "Error Saving User", errors: err})
        }
    }
})

router.post("/", async(req, res, next) => {
    try{
        const v = new Validator(req.body, {
            email: 'required',
            password: 'required',
        })
        const matched = await v.check();
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const user = await User.findOne({email: req.body.email})          
            if(user){
                const match = await bcrypt.compare(req.body.password, user.password)
                if(match){
                    await jwt.sign({data: user}, '5b2f47da43492548593a2d0ecdc52f58', {expiresIn: 60 * 60 * 24}, (err, token) => {
                        if(err){
                            console.log(err)                                
                            res.status(500).json({message: "Token Could not be generated. Please try logging in again!"})
                        }
                        res.status(200).json({
                            message: "User Details Found Successfully",
                            user: user,
                            token: token
                        })
                    })
                }else{
                    console.log(err) 
                    res.status(422).json({
                        message: "Users Password is Incorrect",
                        users: req.body
                    })
                }
            }else{      
                res.status(422).json({
                    message: "Email Not Found",
                })
            }
        }
    }catch(err){              
        res.status(422).json({
            message: "Error Processing Data",
            errors:  err
        })
    }
})

router.post("/new", webtoken.verifyToken, async(req, res, next) => {
    try{ 
        // console.log("Hi",io)  
        const v = new Validator(req.body, {
            firstName: 'required',
            lastName: 'required',
            bio: 'required|minLength:20',
            email: 'required|email',
            password: 'required',
            username: 'required|minLength:5',
            phone: 'required|minLength:11'
        })
        const matched = await v.check();
        
        if (!matched) {
            let error_messages = [] 
            Object.entries(v.errors).map(x => {
                let obj = {}
                obj[x[0]] = x[1].message
                error_messages.push(obj)
            })
            res.status(422).json({message: "Error Validating User", errors:error_messages})
        }else{
            const hash = bcrypt.hashSync(req.body.password, saltRounds)
            req.body.password = hash
            const user = new User(req.body)
            await user.save()
            res.status(200).json({message: "User Saved Successfully"})
        }
    }catch(err){
        let error_messages = [] 
        console.log(err)              
        if(err.name == "MongoError" && err.code === 11000){     
            Object.entries(err.keyValue).map(x => {
                let obj = {}
                obj[x[0]] = `${x[0]} was duplicated`
                error_messages.push(obj)
            })
            res.status(422).json({message: "Some fields are duplicated", errors: error_messages})
        }else{
            res.status(422).json({message: "Error Saving User", errors: err})
        }
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
            const user = await User.findOneAndDelete({_id: req.body._id})
            if(user){
                res.status(200).json({message: "User Deleted Successfully"})
            }else{
                res.status(422).json({message: "User ID provided not found in database"})
            }
        }
    }catch(err){
        res.status(422).json({message: err.name == "CastError" ? "User ID provided not found in database" : "Error Deleting User", errors: err})
    }
})

router.post("/setAdmin", webtoken.verifyToken, async(req, res) => {
    try{
        const v = new Validator(req.body, {
            _id: 'required'
        })
        const matched = await v.check()
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const user = await User.findOne({_id: req.body._id})
            if(user){
                user.isAdmin = true
                await user.save()
                res.status(200).json({message: "User Updated Successfully", user: user})
            }else{
                res.status(422).json({message: "User ID not found"})
            }
        }
    }catch(err){
        res.status(422).json({message: err.name == "CastError" ? "User ID provided not found in database" : "Error Deleting User", errors: err})
    }
})

router.post("/unsetAdmin", webtoken.verifyToken, async(req, res) => {
    try{
        const v = new Validator(req.body, {
            _id: 'required'
        })
        
        const matched = await v.check()
        
        if (!matched) {
            let error_messages = pile_error_messages(v.errors)
            res.status(422).json({message: "Validation Error", errors: error_messages})
        }else{
            const user = await User.findOne({_id: req.body._id})
            if(user){
                user.isAdmin = false
                await user.save()
                res.status(200).json({message: "User Updated Successfully", user: user})
            }else{
                res.status(422).json({message: "User ID not found"})
            }
        }
    }catch(err){
        res.status(422).json({message: err.name == "CastError" ? "User ID provided not found in database" : "Error Deleting User", errors: err})
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