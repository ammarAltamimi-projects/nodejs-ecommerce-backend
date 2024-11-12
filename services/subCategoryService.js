
const SubCategory = require("../models/subCategoryModel");

const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");
const {uploadSingleImage} = require("../middlewares/uploadImageMiddleware")





exports.uploadSubCategoryImage = uploadSingleImage('subCategories','image');





// Nested route (get)
exports.createFilterObj = async (req, res, next) => {
  if (req.params.categoryId) {
    req.filterObj = { category: req.params.categoryId };
  }
  next();
};

// Nested route (Create)
exports.setCategoryIdToBody = (req, res, next) => {
  if (!req.body.category) {
    req.body.category = req.params.categoryId;
  }
  next();
};

// @desc    Get list of subcategories
// @route   GET /api/v1/subcategories
// @access  Public
exports.getSubCategories = getAll(SubCategory);

// @desc    Create subCategory
// @route   POST  /api/v1/subcategories
// @access  Private/Admin
exports.createSubCategory = createOne(SubCategory);

// @desc    Update specific subcategory
// @route   PUT /api/v1/subcategories/:id
// @access  Private/Admin
exports.updateSubCategory = updateOne(SubCategory);

// @desc    Delete specific subCategory
// @route   DELETE /api/v1/subcategories/:id
// @access  Private/Admin
exports.deleteSubCategory = deleteOne(SubCategory);

// @desc    Get specific subcategory by id
// @route   GET /api/v1/subcategories/:id
// @access  Public
exports.getSubCategory = getOne(SubCategory);
