const express = require("express");

const router = express.Router();

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  uploadCategoryImage,
} = require("../services/categoryService");

const {
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  getCategoryValidator,
} = require("../utils/validators/categoryValidator");
const {
  validateSingleFileTypeDisk,uploadSingleImageToCloudinaryDisk
} = require("../middlewares/uploadImageMiddleware");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

const subCategoryRouter = require("./subCategoryRoute");

//nested route
router.use("/:categoryId/subcategories", subCategoryRouter);

router
  .route("/")
  .get(getCategories)
  .post(
    protect,
    allowedTo("admin"),
    uploadCategoryImage,
    createCategoryValidator,
    validateSingleFileTypeDisk,
    uploadSingleImageToCloudinaryDisk("category","auto",600,600,"fill"),
    createCategory
  );
router
  .route("/:id")
  .put(
    protect,
    allowedTo("admin"),
    uploadCategoryImage,
    updateCategoryValidator,
    validateSingleFileTypeDisk,
    uploadSingleImageToCloudinaryDisk("category","auto",600,600,"fill"),
    updateCategory
  )
  .delete(protect, allowedTo("admin"), deleteCategoryValidator, deleteCategory)
  .get(getCategoryValidator, getCategory);

module.exports = router;
