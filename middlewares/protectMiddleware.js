const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const ApiError = require("../utils/apiError");
const User = require("../models/userModel");

// Protect routes by checking the authorization token and validating the user.
exports.protect = asyncHandler(async (req, res, next) => {
  
  let token;
  if (req.headers.authorization &&  req.headers.authorization.startsWith('Bearer') ) {
     token = req.headers.authorization.split(" ")[1];

  }

  if(!token){
    return next(
      new ApiError("You are not login please login to access this route ", 401)
    );
  }

  const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentUser = await User.findOne({ _id: decoded.userId });

  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong to this token does no longer exist",
        401
      )
    );
  }

  if (currentUser.active === false) {
    return next(new ApiError("This user is not active", 401));
  }

  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );

    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError("This user has changed password, please login again", 401)
      );
    }
  }

  req.user = currentUser;
  next();
});
