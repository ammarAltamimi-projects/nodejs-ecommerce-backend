const express = require("express");

const router = express.Router();

const {
  getFooter,
  updateFooter,
  setFooterIdToParams,
} = require("../services/footerService");


const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router
  .route("/")
  .get(getFooter)
  .put(
    protect,
    allowedTo("admin"),
    setFooterIdToParams,
    updateFooter
  )

module.exports = router;
