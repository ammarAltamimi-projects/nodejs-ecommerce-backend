const cron = require("node-cron");
const Order = require("../../models/orderModel");
const GroupOrder = require("../../models/groupOrderModel");
const {
  updateReservedStockAndStockQuantityForCancellation,
  updateGroupOrderAndOrderItemStateBasedOnOrderState
} = require("../../services/orderService");

cron.schedule("*/5 * * * *", async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const orders = await Order.find({
    paymentStatus: "Pending",
    paymentMethod: { $exists: false },
    createdAt: { $lt: fifteenMinutesAgo },
  });
  if (orders.length > 0) {
    // 1. update the status of order to cancelled
    await Promise.all(
      orders.map(async (order) => {
        //cancel order
        order.orderStatus = "Cancelled";
        // also i need set status to cancel in all groupOrder and Item order because i cancel whole order
        await updateGroupOrderAndOrderItemStateBasedOnOrderState(order._id)
  
        await order.save();
        //2. update ReservedStock And StockQuantity
        await updateReservedStockAndStockQuantityForCancellation(order);
      })
    );
  }
});
