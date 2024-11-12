/* eslint-disable import/no-extraneous-dependencies */
const express = require("express");

const router = express.Router();

const {
  signUp,
  login,
  forgetPassword,
  verifyPassResetCode,
  resetPassword,
  uploadUserImage,
} = require("../services/authService");
const {
  signUpValidator,
  loginValidator,
  forgetPasswordValidator,
  verifyPassResetCodeValidator,
  resetPasswordValidator,
} = require("../utils/validators/authValidation");
const {
  userDefaultImage,
  validateSingleFileTypeDisk,uploadSingleImageToCloudinaryDisk
} = require("../middlewares/uploadImageMiddleware");

router.post(
  "/signUp",
  uploadUserImage,
  userDefaultImage,
  signUpValidator,
    validateSingleFileTypeDisk,
    uploadSingleImageToCloudinaryDisk("profile","auto",600,600,"fill"),
  signUp
);

router.post("/login", loginValidator, login);
router.post("/forgetPassword", forgetPasswordValidator, forgetPassword);
router.post(
  "/verifyPassResetCode",
  verifyPassResetCodeValidator,
  verifyPassResetCode
);
router.put("/resetPassword", resetPasswordValidator, resetPassword);

module.exports = router;
