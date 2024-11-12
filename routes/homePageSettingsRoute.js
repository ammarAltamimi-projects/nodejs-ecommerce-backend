const express = require("express");

const router = express.Router();

const {
  getHomePageSettings,
  updateHomePageSettings,
  setHomePageIdToParams,
} = require("../services/homePageSettingsService");


const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router
  .route("/")
  .get(getHomePageSettings)
  .put(
    protect,
    allowedTo("admin"),
    setHomePageIdToParams,
    updateHomePageSettings
  )

module.exports = router;
