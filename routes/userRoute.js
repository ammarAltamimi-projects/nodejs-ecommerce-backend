/* eslint-disable import/no-extraneous-dependencies */
const express = require("express");

const router = express.Router();

const {
  getUsers,
  getUser,
  getLoggedUserData,
  createUser,
  updateUser,
  updateLoggedUserData,
  updateUserPassword,
  updateLoggedUserPassword,
  deleteUser,
  activateUser,
  deactivateLoggedUser,
  uploadUserImage,
} = require("../services/userService");

const {
  createUserValidator,
  updateUserValidator,
  updateUserPasswordValidator,
  deleteUserValidator,
  getUserValidator,
  updateLoggedUserDataValidator,
  updateLoggedUserPasswordValidator,
} = require("../utils/validators/userValidator");
const {
  userDefaultImage,
  validateSingleFileTypeDisk,uploadSingleImageToCloudinaryDisk
} = require("../middlewares/uploadImageMiddleware");

const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");
const orderRouter = require("./orderRoute");

router.use("/:userId/orders", orderRouter);

//user
router.get("/getMe", protect, allowedTo("user"), getLoggedUserData, getUser);
router.put(
  "/updateMe",
  protect,
  allowedTo("user"),
  uploadUserImage,
  updateLoggedUserDataValidator,
 validateSingleFileTypeDisk,
  uploadSingleImageToCloudinaryDisk("profile","auto",600,600,"fill"),
  updateLoggedUserData
);
router.put(
  "/changeMyPassword",
  protect,
  allowedTo("user"),
  updateLoggedUserPasswordValidator,
  updateLoggedUserPassword
);
router.put("/deactivateMe", protect, allowedTo("user"), deactivateLoggedUser);
router.delete(
  "/deleteMe",
  protect,
  allowedTo("user"),
  getLoggedUserData,
  deleteUser
);

//admin
router
  .route("/")
  .get(protect, allowedTo("admin"), getUsers)
  .post(
    protect,
    allowedTo("admin"),
    uploadUserImage,
    userDefaultImage,
    createUserValidator,
  validateSingleFileTypeDisk,
     uploadSingleImageToCloudinaryDisk("profile","auto",600,600,"fill"),
    createUser
  );
router
  .route("/:id")
  .get(protect, allowedTo("admin"), getUserValidator, getUser)
  .put(
    protect,
    allowedTo("admin"),
    uploadUserImage,
    updateUserValidator,
    validateSingleFileTypeDisk,
       uploadSingleImageToCloudinaryDisk("profile","auto",600,600,"fill"),
    updateUser
  )
  .delete(
    protect,
    allowedTo("admin"),
    deleteUserValidator,
    deleteUser
  );
router
  .route("/activate/:id")
  .put(protect, allowedTo("admin"), activateUser);

router
  .route("/changePassword/:id")
  .put(
    protect,
    allowedTo("admin"),
    updateUserPasswordValidator,
    updateUserPassword
  );

module.exports = router;
