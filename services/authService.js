const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const ApiError = require("../utils/apiError");
const { createToken } = require("../utils/createToken");
const { createRandom } = require("../utils/createRandom_6Digits");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/userModel");
const { userRes } = require("../utils/userResponse");
const {
  uploadSingleImage,
} = require("../middlewares/uploadImageMiddleware");

exports.uploadUserImage = uploadSingleImage("users", "profileImg");


// @desc    Signup
// @route   GET /api/v1/auth/signup
// @access  Public
exports.signUp = asyncHandler(async (req, res, next) => {
  const createUser = await User.create({
    name: req.body.name,
    slug: req.body.slug,
    phone: req.body.phone,
    email: req.body.email,
    password: req.body.password,
    profileImg: req.body.profileImg,
  });

  //create Token
  const token = createToken(createUser._id);

  res
    .status(201)
    .json({ status: "success", data: userRes(createUser), token: token });
});

// @desc    Login
// @route   GET /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Invalid email or password", 401));
  }

  //create Token
  const token = createToken(user._id);

  res
    .status(201)
    .json({ status: "success", data: userRes(user), token: token });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`User not found with id ${req.body.email}`, 404));
  }

  const resetCode = createRandom();
  const hashResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");
  user.passwordResetCode = hashResetCode;
  user.passwordResetExpires = Date.now() + 1 * 60 * 1000;
  user.passwordResetVerified = false;
  await user.save();

  try {
    const html = `<div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #f76c6c;">Hi ${user.name},</h2>
          <p>We received a request to reset the password on your E-shop account.</p>
        <p style="font-size: 18px; font-weight: bold;">${resetCode}</p>
        <p>Enter this code to complete the reset.</p>
        <p>Thanks for helping us keep your account secure.</p>
        <br />
        <p style="color: #555;">The E-shop Team</p>
      </div>
    `;
    sendEmail({
      email: user.email,
      subject: "reset password",
      message: html,
    });
  } catch (e) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(new ApiError("There is an error in sending email", 500));
  }

  await user.save();
  res
    .status(200)
    .json({ status: "success", message: "reset code sent successfully" });
});

// @desc    Verify password reset code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  const hashReceivedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");
  const user = await User.findOne({
    email: req.body.email,
    passwordResetCode: hashReceivedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Invalid or expired reset code", 401));
  }

  user.passwordResetVerified = true;
  await user.save();

  res
    .status(200)
    .json({ status: "success", message: "reset code verified successfully" });
});

// @desc    Reset password
// @route   POST /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`User not found with email ${req.body.email}`, 404)
    );
  }

  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code is not verified", 400));
  }

  user.password = req.body.password;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = false;

  await user.save();
  res
    .status(200)
    .json({ status: "success", message: "password changed successfully" });
});
