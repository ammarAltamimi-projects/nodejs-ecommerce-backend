const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const ApiFeature = require("../utils/apiFeatures");
const ApiError = require("../utils/apiError");
const PaymentDetails = require("../models/paymentDetailsModel");
const GroupOrder = require("../models/groupOrderModel");
const Order = require("../models/orderModel");
const Payout = require("../models/payoutModel");
const Cart = require("../models/cartModel");
const { getAll } = require("../middlewares/handlersFactoryMiddleware");

exports.createFilterObj = async (req, res, next) => {
  if (req.user.role === "user") {
    req.filterObj = { user: req.user._id };
  }
  next();
};

exports.createStoreFilterObj = async (req, res, next) => {
  if (req.user.role === "seller") {
    req.filterObj = { store: req.params.storeId };
  }
  next();
};


// after create the payment there are some things you have to do such as update order  and delete cart
const updateOrderAndDeleteCart = async (
  paymentId,
  order,
  paymentStatus,
  paymentMethod
) => {
  // 1. update order (paymentStatus , paymentMethod ,paidAt )
  order.paymentStatus = paymentStatus;
  order.paymentMethod = paymentMethod;
  //2. because in cash not paid yet so in paid will do some step
  if (paymentStatus === "Paid") {
    order.paidAt = Date.now();
    // create payouts
    //1. get scheduledAt
    const payoutDelayDays = 7;
    const scheduledAt = new Date(
      Date.now() + payoutDelayDays * 24 * 60 * 60 * 1000
    );
    //2.get all groupOrder means all store and create payout for each
    const groupOrder = await GroupOrder.find({ order: order._id });
    await Promise.all(
      groupOrder.map(async (groupOrderObj) => {
        await Payout.create({
          payment: paymentId,
          store:groupOrderObj.store,
          groupOrder: groupOrderObj._id,
          payoutShippingFees:groupOrderObj.groupShippingFees,
          payoutSubTotal:groupOrderObj.groupSubTotal,
          total:groupOrderObj.total,
          status: "Scheduled",
          scheduledAt: scheduledAt,
        });
      })
    );
  }
  await order.save();

  //3.delete cart
  await Cart.findOneAndDelete({ user: order.user });
};

// @desc    Get list of Payments
// @route   GET /api/v1/payment
// @access  Private/Admin
exports.getPayments = getAll(PaymentDetails);

// @desc    Get list of my Payments
// @route   GET /api/v1/payment/my-payment
// @access  Private/user
exports.getMyPayment = getAll(PaymentDetails);

// @desc    Get list of my store Payments
// @route   GET /api/v1/payment/:storeId/my-store-payment
// @access  Private/seller
exports.getMyStorePayment = getAll(Payout);
// @desc    create payment cash
// @route   POST /api/v1/payment/:orderId/payment-cash
// @access  Private/user
exports.createCashPayment = asyncHandler(async (req, res, next) => {
  // 1.create payment
  // i need  to orderId and amount and user and paymentInetnetId
  // get  orderId and amount and user
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return next(new ApiError(`No order with id ${req.params.orderId}`, 404));
  }
  // get paymentInetnetId
  const paymentInetnetId = `CASH-${uuidv4()}-${Date.now()}`;

  const newPayment = await PaymentDetails.create({
    order: req.params.orderId,
    user: req.user._id,
    paymentInetnetId,
    paymentMethod: "cash",
    status: "Pending",
    amount: order.total,
    currency: "USD",
  });

  //2. if create done i should  update order (paymentStatus , paymentMethod ,paidAt )  and delete cart
  if (newPayment) {
    await updateOrderAndDeleteCart(newPayment._id, order, "Pending", "cash");
  }

  // 3. the res
  res.status(201).json({ states: "success", data: newPayment });
});

// // @desc    create payment stripe
// // @route   POST /api/v1/payment/:orderId/payment-stripe
// // @access  Private/user
// exports.createStripePayment = asyncHandler(async (req, res,next) => {
//   // 1.create payment
//   // i need  to orderId and amount and user and paymentInetnetId
//     // get  orderId and amount and user
//     const order= await Order.findById(req.params.orderId)
//     if(!order){
//             return next(
//               new ApiError(`No order with id ${req.params.orderId}`, 404)
//             );
//     }
//   // get paymentInetnetId
//   // const paymentInetnetId = `CASH-${uuidv4()}-${Date.now()}`;

//   const newPayment = await PaymentDetails.create({
//   order:req.params.orderId ,
//   user : req.user._id,
//   paymentInetnetId,
//   paymentMethod : "Stripe",
//   status : "Paid",
//   amount:order.total,
//   currency : "USD"
//   })

//   //2. if create done i should  do two things
//   // update order (paymentStatus , paymentMethod ,paidAt )
//   // Update ReservedStock And ProductSold
//    if(newPayment){
//    await updateOrderAndDeleteCart(order,"Paid","cash")

//    }

//    // 3. the res
//       res.status(201).json({ states: "success", data: newPayment });

//       });

// // @desc    create payment paypal
// // @route   POST /api/v1/payment/:orderId/payment-paypal
// // @access  Private/user
// exports.createPaypalPayment = asyncHandler(async (req, res,next) => {
//   // 1.create payment
//   // i need  to orderId and amount and user and paymentInetnetId
//   const order= await Order.findById(req.params.orderId)
//   if(!order){
//           return next(
//             new ApiError(`No order with id ${req.params.orderId}`, 404)
//           );
//   }
//   // get paymentInetnetId
//   // const paymentInetnetId = `CASH-${uuidv4()}-${Date.now()}`;
//   // get  orderId and amount and user

//   const newPayment = await PaymentDetails.create({
//   order:req.params.orderId ,
//   user : req.user._id,
//   paymentInetnetId,
//   paymentMethod : "Stripe",
//   status : "Paid",
//   amount:order.total,
//   currency : "USD"
//   })

//   //2. if create done i should  do two things
//   // update order (paymentStatus , paymentMethod ,paidAt )
//   // Update ReservedStock And ProductSold
//    if(newPayment){
//    await updateOrderAndDeleteCart(order,"Paid","cash")

//    }

//    // 3. the res
//       res.status(201).json({ states: "success", data: newPayment });

//       });
