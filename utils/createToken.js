const jwt = require("jsonwebtoken");

// Generates a JWT token with a user payload and expiration time.
exports.createToken = (payload)=> {

    const token = jwt.sign({userId:payload},process.env.JWT_SECRET_KEY,{expiresIn:process.env.JWT_EXPIRE_TIME});
        return token;
    
}