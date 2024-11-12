const express = require("express");

const router = express.Router({ mergeParams: true }); // get  Category ID
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

const {
  createReview,
  updateReview,
  deleteReview,
  getReview,
  updateLikesReview,
  setProductIdAndUserIdToBody,
  uploadReviewImage,
} = require("../services/reviewService");
const {
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
  getReviewValidator,
  updateLikesReviewValidator,
  validatorProductId,
} = require("../utils/validators/reviewValidator");
const {
  validateArrayFileTypeAnyFileTypeDisk,uploadArrayImagesToCloudinaryDisk
} = require("../middlewares/uploadImageMiddleware");





// i use virtual to get reviews that belongs to its product so i dont need to make its router 
// also there is in my dashboard need to get reviews belongs to specific user or specific product
  // .route("/")
  // .get(
  //   protect,
  //   allowedTo("admin"),
  //   validatorProductId, // validate product id in params
  //   createFilterObj, // get list of Reviews for specific product
  //   getReviews
  // )
  

  router.route("/").post(
    protect,
    allowedTo("user"),
    uploadReviewImage,
    validatorProductId, // validate product id in params
    setProductIdAndUserIdToBody, // create Reviews for specific product or  create Reviews for My user
    createReviewValidator,
    validateArrayFileTypeAnyFileTypeDisk,
    uploadArrayImagesToCloudinaryDisk("review","auto",600,600,"fill"),
    createReview
  );
router
  .route("/:id")
  .put(
    protect,
    allowedTo("user"),
    uploadReviewImage,
    updateReviewValidator,
    validateArrayFileTypeAnyFileTypeDisk,
    uploadArrayImagesToCloudinaryDisk("review","auto",600,600,"fill"),
    updateReview
  )
  .delete(
    protect,
    allowedTo("admin", "user"),
    deleteReviewValidator,
    deleteReview
  )
  .get(getReviewValidator, getReview);

  router.put("/:id/update-likes",
    protect,
    allowedTo("user"),
    updateLikesReviewValidator,
    updateLikesReview

  )

module.exports = router;
