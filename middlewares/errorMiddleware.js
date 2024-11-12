
const ApiError = require(`../utils/apiError`);

const sendErrorForDev = (err,res)=> res.status(err.stateCode).json({status:err.status,error:err,message:err.message,stack:err.stack});

const sendErrorForProd = (err,res)=>  res.status(err.stateCode).json({status:err.status,message:err.message});


// Global error handler middleware to process errors
exports.globalError = (err,req,res,next)=>{
    err.stateCode = err.stateCode || 500;
    err.status = err.status || "error";
    if (err.name === 'JsonWebTokenError') err = new ApiError('Invalid token, please login again..', 401);
    if (err.name === 'TokenExpiredError') err = new ApiError('Expired token, please login again..', 401);   
    if(process.env.NODE_ENV === "development" ){
     
        sendErrorForDev(err,res)
    }else{

        sendErrorForProd(err,res)

    }
}

