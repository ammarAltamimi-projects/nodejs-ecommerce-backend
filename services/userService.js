const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const { createToken } = require("../utils/createToken");

const {
  getAll,
  getOne,
  createOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");
const { userRes } = require("../utils/userResponse");

const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");

exports.uploadUserImage = uploadSingleImage("users", "profileImg");



//admin

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = getAll(User);

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private/Admin
exports.createUser = createOne(User);

// @desc    Update specific user (without password)
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: req.body.slug,
      phone: req.body.phone,
      email: req.body.email,
      role: req.body.role,
      profileImg: req.body.profileImg,
    },
    { new: true }
  );

  if (!updateUser) {
    return next(new ApiError(`there is no user with id ${req.params.id}`, 404));
  }

  res.status(200).json({ status: "success", data: updateUser });
});

// @desc    Update specific user password
// @route   PUT /api/v1/users/changePassword/:id
// @access   Private/Admin
exports.updateUserPassword = asyncHandler(async (req, res, next) => {
  const updatePassword = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    { new: true }
  );

  if (!updatePassword) {
    return next(new ApiError(`there is no user with id ${req.params.id}`, 404));
  }

  res.status(200).json({ status: "success", data: updatePassword });
});

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = deleteOne(User);

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = getOne(User);

// @desc    activate User account
// @route   PUT /api/v1/users/activate/:id
// @access   Private/Admin
exports.activateUser = asyncHandler(async (req, res, next) => {
  const activate = await User.findByIdAndUpdate(
    req.params.id,
    {
      active: true,
    },
    { new: true }
  );

  if (!activate) {
    return next(new ApiError(`there is no user with id ${req.user._id}`, 404));
  }

  res.status(200).json({ status: "success", data: activate });
});

//user

// @desc    Get Logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/user
exports.getLoggedUserData = async (req, res, next) => {
  if (req.user._id) {
    req.params.id = req.user._id;
  }
  next();
};

// @desc    Update logged user data (without password, role)
// @route   PUT /api/v1/users/updateMe
// @access  Private/user
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updateLoggedUserData = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      slug: req.body.slug,
      email: req.body.email,
      phone: req.body.phone,
      profileImg: req.body.profileImg,
    },
    { new: true }
  );

  if (!updateLoggedUserData) {
    return next(new ApiError(`there is no user with id ${req.user._id}`, 404));
  }

  res
    .status(200)
    .json({ status: "success", data: userRes(updateLoggedUserData) });
});

// @desc    Update logged user password
// @route   PUT /api/v1/users/changeMyPassword
// @access  Private/user
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  const updatePassword = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    { new: true }
  );

  if (!updatePassword) {
    return next(new ApiError(`there is no user with id ${req.user._id}`, 404));
  }

  // generate Token

  const token = createToken(req.user._id);

  res
    .status(200)
    .json({ status: "success", data: updatePassword, token: token });
});

// @desc    Deactivate logged user
// @route   DELETE /api/v1/users/deactivateMe
// @access  Private/Protect
exports.deactivateLoggedUser = asyncHandler(async (req, res, next) => {
  const deactivate = await User.findByIdAndUpdate(
    req.user._id,
    {
      active: false,
    },
    { new: true }
  );

  if (!deactivate) {
    return next(new ApiError(`there is no user with id ${req.user._id}`, 404));
  }

  res.status(200).json({ status: "success", data: deactivate });
});
