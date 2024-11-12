// This class creates a custom error for handling application-specific errors, setting a status based on the HTTP state code and marking it as operational for controlled error handling.
class ApiError extends Error {
    constructor(message,stateCode){
        super(message);
        this.stateCode = stateCode;
        this.status = `${stateCode}`.startsWith(4) ? "fail": "error"
        this.isOperational = true;

    }
}


module.exports =ApiError;