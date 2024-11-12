const express = require("express");

const router = express.Router();

const {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  getStore,
  uploadStoreImage,
  setUserIdToBody,
  createFilterObj,
  getLoggedUserFollowedStores,
  updateFollowingUser,
  updateStoreStatus
} = require("../services/storeService");

const {
  createStoreValidator,
  updateStoreValidator,
  deleteStoreValidator,
  getStoreValidator,
  updateStoreStatusValidator,
  updateFollowingUserValidator
} = require("../utils/validators/storeValidator");
const {
  validateFieldsFileTypeDisk,uploadFieldsImagesToCloudinaryDisk
} = require("../middlewares/uploadImageMiddleware");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

// for fields Cloudinary
const fieldType = {
  "imageCover" : "single",
  "images" : "multi"
}



// route get store belongs to specific user : i will get them by query not by nested router (both ways correct)

router
  .route("/")
  .get(getStores)
  .post(
    protect,
    allowedTo("seller", "user"),
    uploadStoreImage,
    setUserIdToBody,
    createStoreValidator,
    validateFieldsFileTypeDisk,
    uploadFieldsImagesToCloudinaryDisk("store","auto",600,600,"fill",fieldType),
    createStore
  );
  
  router.get(
    "/my-store",
    protect,
    allowedTo("seller"),
    createFilterObj,
    getLoggedUserFollowedStores
  );
router.get(
  "/followed-store",
  protect,
  allowedTo("user"),
  createFilterObj,
  getLoggedUserFollowedStores
);


router
  .route("/:id")
  .put(
    protect,
    allowedTo("seller"),
    uploadStoreImage,
    updateStoreValidator,
    validateFieldsFileTypeDisk,
    uploadFieldsImagesToCloudinaryDisk("store","auto",600,600,"fill",fieldType),
    updateStore
  )
  .delete(
    protect,
    allowedTo("admin", "seller"),
    deleteStoreValidator,
    deleteStore
  )
  router.route("/:slug").get(getStoreValidator, getStore);


  router.put("/:id/following-user",
    protect,
    allowedTo("user"),
    updateFollowingUserValidator,
    updateFollowingUser)
    
  router.put("/:id/update-status",
    protect,
    allowedTo("admin"),
    updateStoreStatusValidator,
    updateStoreStatus)
module.exports = router;
