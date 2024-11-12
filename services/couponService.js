const asyncHandler = require("express-async-handler");

const Coupon = require("../models/couponModel");
const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");

exports.createFilterObj = asyncHandler((req, res, next) => {
  // i do not make condition because this route only use for get store coupons which i make validation for store id
  // i use condition in createFilterObj if router may get all documents or may get documents belongs to specific parent
    req.filterObj = { store: req.params.storeId };

  next();
});

// @desc    Get list of coupons
// @route   GET /api/v1/coupons
// @access  Private/admin
exports.getCoupons = getAll(Coupon);

// @desc    Create coupon
// @route   POST  /api/v1/coupons
// @access  Private/seller
exports.createCoupon = createOne(Coupon);

// @desc    Update specific coupon
// @route   PUT /api/v1/coupons/:id
// @access  Private/seller
exports.updateCoupon = updateOne(Coupon);

// @desc    Delete specific coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private/seller
exports.deleteCoupon = deleteOne(Coupon);

// @desc    Get specific coupon by id
// @route   GET /api/v1/coupons/:id
// @access  Private/seller
exports.getCoupon = getOne(Coupon);


// @desc    Get list of  coupon  for specific store
// @route   GET /api/v1/coupons/:soreId
// @access  Private/seller
exports.getStoreCoupons = getAll(Coupon);

