const express = require("express");

const router = express.Router();

const {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrand,
  uploadBrandImage,} = require("../services/brandService ");

const {
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
  getBrandValidator,
} = require("../utils/validators/brandValidator ");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");
const {  validateSingleFileTypeDisk,uploadSingleImageToCloudinaryDisk } = require("../middlewares/uploadImageMiddleware");


router
  .route("/")
  .get(getBrands)
  .post(
    protect,
    allowedTo("admin"),
    uploadBrandImage,
    createBrandValidator,
    validateSingleFileTypeDisk,
    uploadSingleImageToCloudinaryDisk("brand","auto",600,600,"fill"),
    createBrand
  );
router
  .route("/:id")
  .put(
    protect,
    allowedTo("admin"),
    uploadBrandImage,
    updateBrandValidator,
    validateSingleFileTypeDisk,
    uploadSingleImageToCloudinaryDisk("brand","auto",600,600,"fill"),
    updateBrand
  )
  .delete(protect, allowedTo("admin"), deleteBrandValidator, deleteBrand)
  .get(getBrandValidator, getBrand);

module.exports = router;
