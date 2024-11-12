const express = require("express");

const router = express.Router({ mergeParams: true }); // get  Category ID

const {
  createFilterObj,
  setCategoryIdToBody,
  getSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  uploadSubCategoryImage,
} = require("../services/subCategoryService");
const {
  createSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
  getSubCategoryValidator,
  validatorCategoryId,
  validatorCategoryIdForSpecificSubcategory,
} = require("../utils/validators/subCategoryValidator");
const {
  validateSingleFileTypeDisk,uploadSingleImageToCloudinaryDisk
} = require("../middlewares/uploadImageMiddleware");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router
  .route("/")
  .get(
    validatorCategoryId, // validate Category id in params
    createFilterObj, // get list of subCategory for specific Category
    getSubCategories
  )
  .post(
    protect,
    allowedTo("admin"),
    validatorCategoryId, // validate Category id in params
    setCategoryIdToBody, // create subCategory for specific category
    uploadSubCategoryImage,
    createSubCategoryValidator,
    validateSingleFileTypeDisk,
    uploadSingleImageToCloudinaryDisk("subcategory","auto",600,600,"fill"),
    createSubCategory
  );
router
  .route("/:id")
  .put(
    protect,
    allowedTo("admin"),
    validatorCategoryIdForSpecificSubcategory, // validate Category id in params and Category id is equal to category id in subcategory
    uploadSubCategoryImage,
    updateSubCategoryValidator,
    validateSingleFileTypeDisk,
    uploadSingleImageToCloudinaryDisk("subcategory","auto",600,600,"fill"),
    updateSubCategory
  )
  .delete(
    protect,
    allowedTo("admin"),
    validatorCategoryIdForSpecificSubcategory, // validate Category id in params and Category id is equal to category id in subcategory
    deleteSubCategoryValidator,
    deleteSubCategory
  )
  .get(
    validatorCategoryIdForSpecificSubcategory, // validate Category id in params and Category id is equal to category id in subcategory
    getSubCategoryValidator,
    getSubCategory
  );

module.exports = router;
