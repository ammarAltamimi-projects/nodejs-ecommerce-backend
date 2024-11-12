const express = require("express");

const router = express.Router({ mergeParams: true }); // get user id

const {
  createFilterObj,
  groupFilterObj,
  getMyOrders,
  cancelledOrder,
  createOrder,
  cancelledOrderItem,
  updateGroupOrderStatus,
  updateItemOrderStatus,
  getGroupOrder,
  getOrderDetails,
} = require("../services/orderService");
const {
  createOrderValidator,
  orderValidator,
  cancelledOrderValidator,
  storeGroupValidator,
  updateGroupOrderValidator,
  updateItemOrderValidator,
} = require("../utils/validators/orderValidator");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router
  .route("/")
  .get(protect, allowedTo("user"), createFilterObj, getMyOrders)
  .post(protect, allowedTo("user"), createOrderValidator, createOrder);

router
  .route("/groupedOrder")
  .get(
    protect,
    allowedTo("seller"),
    groupFilterObj,
    storeGroupValidator,
    getGroupOrder
  );

router
  .route("/:id")
  .get(protect, allowedTo("user"), orderValidator, getOrderDetails)
  .put(protect, allowedTo("user"), orderValidator, cancelledOrder);



router.put(
  "/:groupId/updateGroupOrderStatus",
  protect,
  allowedTo("seller"),
  updateGroupOrderValidator,
  updateGroupOrderStatus
);

router.put(
  "/:groupId/:itemId/updateItemOrderStatus",
  protect,
  allowedTo("seller"),
  updateItemOrderValidator,
  updateItemOrderStatus
);

router.put(
  "/:groupId/:itemId/cancelledOrderItem",
  protect,
  allowedTo("user"),
  cancelledOrderValidator,
  cancelledOrderItem
);
module.exports = router;
