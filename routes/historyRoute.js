const express = require("express");

const router = express.Router();

const {
  getHistory,
  addToHistory,
  deleteHistory,
  clearHistory,
} = require("../services/historyService");
const {
  createHistoryValidator,
  deleteHistoryValidator,
} = require("../utils/validators/historyValidator");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router.route("/").get(protect, allowedTo("user"), getHistory).delete(protect, allowedTo("user"), clearHistory);

router
  .route("/:productId/:variantId").post(protect, allowedTo("user"), createHistoryValidator, addToHistory)

router
  .route("/:historyId").delete(protect, allowedTo("user"), deleteHistoryValidator, deleteHistory);

module.exports = router;
//commit g
