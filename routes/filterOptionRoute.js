// const express = require("express");

// const router = express.Router();

// const {
//   getFilterOptions,
//   createFilterOption,
//   updateFilterOption,
//   deleteFilterOption,
//   getFilterOption,
// } = require("../services/filterOptionService ");

// const {
//   createFilterOptionValidator,
//   deleteFilterOptionValidator,
//   getFilterOptionValidator,
//   updateFilterOptionValidator,
// } = require("../utils/validators/filterOptionValidator");

// const { protect } = require("../middlewares/protectMiddleware");
// const { allowedTo } = require("../middlewares/allowedToMiddleware");

// router
//   .route("/")
//   .get(protect, allowedTo("admin"), getFilterOptions)
//   .post(
//     protect,
//     allowedTo("admin"),
//     createFilterOptionValidator,
//     createFilterOption
//   );
// router
//   .route("/:id")
//   .put(
//     protect,
//     allowedTo("admin"),
//     updateFilterOptionValidator,
//     updateFilterOption
//   )
//   .delete(
//     protect,
//     allowedTo("admin"),
//     deleteFilterOptionValidator,
//     deleteFilterOption
//   )
//   .get(
//     protect,
//     allowedTo("admin"),
//     getFilterOptionValidator,
//     getFilterOption
//   );

// module.exports = router;
