// const express = require("express");

// const router = express.Router();

// const {
//   getSubCategoryFilters,
//   createSubCategoryFilter,
//   updateSubCategoryFilter,
//   deleteSubCategoryFilter,
//   getSubCategoryFilter,
// } = require("../services/subCategoryFilterService");

// const {
//   createSubCategoryFilterValidator,
//   deleteSubCategoryFilterValidator,
//   getSubCategoryFilterValidator,
//   updateSubCategoryFilterValidator,
// } = require("../utils/validators/subCategoryFilterValidator");

// const { protect } = require("../middlewares/protectMiddleware");
// const { allowedTo } = require("../middlewares/allowedToMiddleware");

// router
//   .route("/")
//   .get(protect, allowedTo("admin"), getSubCategoryFilters)
//   .post(
//     protect,
//     allowedTo("admin"),
//     createSubCategoryFilterValidator,
//     createSubCategoryFilter
//   );
// router
//   .route("/:id")
//   .put(
//     protect,
//     allowedTo("admin"),
//     updateSubCategoryFilterValidator,
//     updateSubCategoryFilter
//   )
//   .delete(
//     protect,
//     allowedTo("admin"),
//     deleteSubCategoryFilterValidator,
//     deleteSubCategoryFilter
//   )
//   .get(
//     protect,
//     allowedTo("admin"),
//     getSubCategoryFilterValidator,
//     getSubCategoryFilter
//   );

// module.exports = router;
