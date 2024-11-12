const express = require("express");

const router = express.Router();

const {
  getWishlists,
  addToWishlist,
  deleteWishlist,
  clearWishlist,
} = require("../services/wishlistService");
const {
  createWishlistValidator,
  deleteWishlistValidator,
} = require("../utils/validators/wishlistValidator");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router.route("/").get(protect, allowedTo("user"), getWishlists).delete(protect, allowedTo("user"), clearWishlist);

router
  .route("/:productId/:variantId").post(protect, allowedTo("user"), createWishlistValidator, addToWishlist)

router
  .route("/:wishlistId").delete(protect, allowedTo("user"), deleteWishlistValidator, deleteWishlist);

module.exports = router;
//commit g
