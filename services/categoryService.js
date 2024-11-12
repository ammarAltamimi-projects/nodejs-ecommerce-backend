const Category = require("../models/categoryModel");
const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");
const {
  uploadSingleImage,
} = require("../middlewares/uploadImageMiddleware");


exports.uploadCategoryImage = uploadSingleImage("categories", "image");


// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = getAll(Category);

// @desc    Create category
// @route   POST  /api/v1/categories
// @access  Private/Admin
exports.createCategory = createOne(Category);

// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = updateOne(Category);

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = deleteOne(Category);

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = getOne(Category);
