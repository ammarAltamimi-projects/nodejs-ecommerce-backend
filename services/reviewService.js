const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");

const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");
const { uploadArrayImages } = require("../middlewares/uploadImageMiddleware");
const Review = require("../models/reviewModel");

exports.uploadReviewImage = uploadArrayImages("reviews","images",10);



// Nested route (get)
exports.createFilterObj = asyncHandler((req, res, next) => {
  if (req.params.productId) {
    req.filterObj = { product: req.params.productId };
  }

  next();
});

// Nested route (Create) for specific  product or
// Nested route (Create) for my  user or

exports.setProductIdAndUserIdToBody = asyncHandler((req, res, next) => {
  if (!req.body.product) {
    req.body.product = req.params.productId;
  }
  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  next();
});


// @desc    Get list of reviews
// @route   GET /api/v1/reviews
// @access  Public
exports.getReviews = getAll(Review);

// @desc    Create review
// @route   POST  /api/v1/reviews
// @access  Private/Protect/User
exports.createReview = createOne(Review);

// @desc    Update specific review
// @route   PUT /api/v1/reviews/:id
// @access  Private/Protect/User
exports.updateReview = updateOne(Review);

// @desc    Delete specific review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Protect/User-Admin
exports.deleteReview = deleteOne(Review);


// @desc    Get specific review by id
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = getOne(Review);


// @desc     Update Likes Review
// @route   GET /api/v1/reviews/:id/update-likes
// @access  Private/Protect/User
exports.updateLikesReview = asyncHandler(async (req, res,next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError(`review not found with id ${req.params.id}`, 404));
  }

  const isLiked = review.userLiked.includes(req.user._id)
  if(isLiked){
    review.userLiked.pull(req.user._id)
  }else {
    review.userLiked.addToSet(req.user._id)
  }

await review.save()

  res.status(200).json({
    status: "success",
    message: "updateLikesReview successfully ",
    data:review
  });

 });