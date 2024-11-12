const express = require("express");

const router = express.Router();

const {
  getOfferTags,
  createOfferTag,
  updateOfferTag,
  deleteOfferTag,
  getOfferTag,
} = require("../services/offerTagService");

const {
  createOfferTagValidator,
  updateOfferTagValidator,
  deleteOfferTagValidator,
  getOfferTagValidator,
} = require("../utils/validators/offerTagValidator");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router
  .route("/")
  .get(getOfferTags)
  .post(
    protect,
    allowedTo("admin"),
    createOfferTagValidator,
    createOfferTag
  );
router
  .route("/:id")
  .put(
    protect,
    allowedTo("admin"),
    updateOfferTagValidator,
    updateOfferTag
  )
  .delete(protect, allowedTo("admin","seller"), deleteOfferTagValidator, deleteOfferTag)
  .get(getOfferTagValidator, getOfferTag);

module.exports = router;
