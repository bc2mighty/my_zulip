const jwt = require("jsonwebtoken")

module.exports.verifyToken = async function (req, res, next){
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