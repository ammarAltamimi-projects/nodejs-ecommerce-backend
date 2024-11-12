const Brand = require("../models/brandModel");
const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");

const {uploadSingleImage} = require("../middlewares/uploadImageMiddleware")



exports.uploadBrandImage = uploadSingleImage('brands','image');




// @desc    Get list of brands
// @route   GET /api/v1/brands
// @access  Public
exports.getBrands = getAll(Brand);


// @desc    Create brand
// @route   POST  /api/v1/brands
// @access  Private/Admin
exports.createBrand = createOne(Brand);

// @desc    Update specific brand
// @route   PUT /api/v1/brands/:id
// @access  Private/Admin
exports.updateBrand = updateOne(Brand);

// @desc    Delete specific brand
// @route   DELETE /api/v1/brands/:id
// @access  Private/Admin
exports.deleteBrand = deleteOne(Brand);

// @desc    Get specific brand by id
// @route   GET /api/v1/brands/:id
// @access  Public
exports.getBrand = getOne(Brand);
