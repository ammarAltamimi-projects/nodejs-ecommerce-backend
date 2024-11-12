const OfferTag = require("../models/offerTagModel");
const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");

// @desc    Get list of offerTags
// @route   GET /api/v1/offer-tags
// @access  Public
exports.getOfferTags = getAll(OfferTag);

// @desc    Create offerTag
// @route   POST  /api/v1/offer-tags
// @access  Private/Admin
exports.createOfferTag = createOne(OfferTag);

// @desc    Update specific offerTag
// @route   PUT /api/v1/offer-tags/:id
// @access  Private/Admin
exports.updateOfferTag = updateOne(OfferTag);

// @desc    Delete specific offerTag
// @route   DELETE /api/v1/offer-tags/:id
// @access  Private/Admin
exports.deleteOfferTag = deleteOne(OfferTag);

// @desc    Get specific offerTag by id
// @route   GET /api/v1/offer-tags/:id
// @access  Public
exports.getOfferTag = getOne(OfferTag);
