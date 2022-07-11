const jwt = require ('jsonwebtoken');

function tokenVerify (req,res,next){
    const token = req.header('auth_token');
    //console.log("tokenVerify Checking: " + token);
    //console.log(JSON.stringify(req.headers));

    if(!token) return res.status(401).send('Access Denied');
    
    try{
        const decoded = jwt.verify(token, "123");
        req.user = decoded;
        next();
    } catch(err){
        res.status(500).send("Invalid Token");
        console.log("wrong Token");
    }
}

module.exports.tokenVerify = tokenVerify;