const User = require("../models/users")

exports = {
    get_all_users : async(req, res, next) => {
        try{
            const users = await User.find()
            res.status(200).json({
                message: "Users Details",
                users: users
            })
        }catch(err){
            res.status(500).json({
                errors: err
            })
        }
    },
    new_user: async(req, res, next) => {
        try{
            const user = new User(req.body)
            await user.save
            res.status(200).json({message: "User Saved Successfully"})
        }catch(err){
            console.log(err)
            res.status(200).json({message: "Error Saving User", errors: err})
        }
    }
}
    // await User.find().then(users => {
    //     res.status(200).json({
    //         message: "Users Details",
    //         users: users
    //     })
    // }).catch(err => {
    //     res.status(500).json({
    //         error: err
    //     })
    // })