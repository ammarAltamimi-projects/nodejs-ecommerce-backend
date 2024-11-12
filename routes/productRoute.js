const express = require("express");

const router = express.Router();

const {
  getProducts,
  getProductsWithItsDefaultVariant,
  createProduct,
  updatedProduct,
  uploadProductImage,
    deleteProduct,
  getProduct,
  getRelatedProducts,
  getFilterOptionsForProductPage,
  getFilterOptionsForStorePage,
  getFilterOptionsForBrandPage,
  getFilterOptionsForOfferTagPage,
  addOfferTagForSelectedProduct
} = require("../services/productService");
const {
  applyCreateValidations,
  applyUpdateValidations,
  deleteProductValidator,
  getProductValidator,
  getRelatedProductValidator,
  getProductFilterOptionsValidator,
  getStoreFilterOptionsValidator,
  getBrandFilterOptionsValidator,
  getOfferTagFilterOptionsValidator,
  addOfferTagForSelectedProductValidations,
} = require("../utils/validators/productValidator");
const {
  validateArrayFileTypeAnyFileTypeDisk,uploadAnyImagesToCloudinaryDisk
} = require("../middlewares/uploadImageMiddleware");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

const reviewRouter = require("./reviewRoute");

router.use("/:productId/reviews", reviewRouter);

// for fields Cloudinary
const fieldType = {
  "imageCover" : "single",
  "images" : "multi"
}


router
  .route("/")
  .get(getProducts)
  .post(
    protect,
    allowedTo("seller"),
    uploadProductImage,
    applyCreateValidations,
    validateArrayFileTypeAnyFileTypeDisk,
      uploadAnyImagesToCloudinaryDisk("product","auto",600,600,"fill",fieldType),
    createProduct
  );
  
  router.route("/default").get(getProductsWithItsDefaultVariant)

  router.route("/add-offerTag").put(protect, allowedTo("seller"),addOfferTagForSelectedProductValidations,addOfferTagForSelectedProduct)

router
  .route("/:id")
  .put(
    protect,
    allowedTo("seller"),
    uploadProductImage,
    applyUpdateValidations,
    validateArrayFileTypeAnyFileTypeDisk,
    uploadAnyImagesToCloudinaryDisk("product","auto",600,600,"fill",fieldType),
    updatedProduct
  )
  .delete(protect, allowedTo("seller"), deleteProductValidator, deleteProduct)

  router.route("/:slug").get(getRelatedProductValidator, getRelatedProducts)
  router.route("/:subcategoryType/product-filter-options").get(getProductFilterOptionsValidator, getFilterOptionsForProductPage )
  router.route("/:storeId/store-filter-options").get(getStoreFilterOptionsValidator, getFilterOptionsForStorePage )
  router.route("/:offerTagId/offerTag-filter-options").get(getOfferTagFilterOptionsValidator, getFilterOptionsForOfferTagPage )
  router.route("/:brandId/brand-filter-options").get(getBrandFilterOptionsValidator, getFilterOptionsForBrandPage )
  router.route("/:slug/:variantSlug").get(getProductValidator, getProduct)

// router
//   .route("/:id/variant")
//   .put(
//     protect,
//     allowedTo("admin", "manager"),
//     applyUpdateValidations,
//     updateProductVariant
//   );

module.exports = router;
