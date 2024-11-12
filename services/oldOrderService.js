// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const asyncHandler = require("express-async-handler");
// const Order = require("../models/orderModel");
// const Cart = require("../models/cartModel");
// const Product = require("../models/productModel");
// const User = require("../models/userModel");

// const { getAll, getOne } = require("../middlewares/handlersFactoryMiddleware");

// const ApiError = require("../utils/apiError");

// // after create the order there are some things you have to do such as (increase product sold and decrease qtyStock )  and  clear cart
// const afterOrderCreated = async(createOrder,cart,cartId)=>{
//   if (createOrder) {

//  //   increase product sold and decrease qtyStock
//     const bulkOption = await Promise.all(
//       cart.cartItem.map(async (item) => {
//         const product = await Product.findById(item.product);

//         return {
//           updateOne: {
//             filter: { _id: item.product, subcategoryType: product.subcategoryType }, // Match the product
//             update: {
//               $inc: {
//                 sold: +item.quantity, // Increment sold
//                 "variant.$[objFilter].stockQuantity": -item.quantity, // Decrease stock
//               },
//             },
//             arrayFilters: [
//               { "objFilter._id": item.variant }, // Match array elements by ID
//             ],
//           },
//         };
//       })
//     );

// await Product.bulkWrite(bulkOption, {});

//     // clear cart
//     await Cart.findByIdAndDelete(cartId);
//   }

// }

// // Nested route (get)
// exports.createFilterObj = async (req, res, next) => {
//   if (req.params.userId) {
//     req.filterObj = { user: req.params.userId };
//   }
//   if (req.user.role === "user") {
//     req.filterObj = { user: req.user._id };
//   }
//   next();
// };

// // @desc    Get all orders
// // @route   POST /api/v1/orders
// // @access  Protected/User-Admin-Manager
// exports.getOrders = getAll(Order);

// // @desc    Get specific order
// // @route   POST /api/v1/orders/:orderId
// // @access  Protected/Admin-Manager
// exports.getOrder = getOne(Order);

// // @desc    create cash order
// // @route   POST /api/v1/orders/cartId
// // @access  Protected/User
// exports.createCashOrder = asyncHandler(async (req, res, next) => {
//   const { shippingAddress } = req.body;
//   const { cartId } = req.params;

//   const cart = await Cart.findById(cartId);
//   if (!cart) {
//     return next(new ApiError(`Cart not found with id ${cartId}`, 404));
//   }

//   // get total price
//   const taxPrice = 0;
//   const shippingPrice = 0;
//   const totalPrice = cart.totalPriceAfterDiscount
//     ? cart.totalPriceAfterDiscount
//     : cart.totalPrice;
//   const totalOrderPrice = totalPrice + shippingPrice + taxPrice;

//   const createOrder = await Order.create({
//     user: req.user._id,
//     cartItems: cart.cartItem,
//     shippingAddress: shippingAddress,
//     totalOrderPrice: totalOrderPrice,
//   });

//   await afterOrderCreated(createOrder,cart,cartId)

//   res
//     .status(201)
//     .json({
//       status: "success",
//       message: "order created successfully",
//       data: createOrder,
//     });
// });

// // @desc    Update order paid status to paid
// // @route   PUT /api/v1/orders/:id/pay
// // @access  Protected/Admin-Manager
// exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
//   const updateOrder = await Order.findByIdAndUpdate(
//     req.params.id,
//     {
//       isPaid: true,
//       paidAt: Date.now(),
//     },
//     { new: true }
//   );

//   if (!updateOrder) {
//     return next(new ApiError(`order not found with id ${req.params.id}`, 404));
//   }

//   res
//     .status(200)
//     .json({
//       status: "success",
//       message: "order is marked as paid successfully",
//       data: updateOrder,
//     });
// });

// // @desc    Update order delivered status
// // @route   PUT /api/v1/orders/:id/deliver
// // @access  Protected/Admin-Manager
// exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
//   const updateOrder = await Order.findByIdAndUpdate(
//     req.params.id,
//     {
//       isDelivered: true,
//       deliveredAt: Date.now(),
//     },
//     { new: true }
//   );

//   if (!updateOrder) {
//     return next(new ApiError(`order not found with id ${req.params.id}`, 404));
//   }

//   res
//     .status(200)
//     .json({
//       status: "success",
//       message: "order is marked as Delivered successfully",
//       data: updateOrder,
//     });
// });

// // @desc    Get checkout session from stripe and send it as response
// // @route   GET /api/v1/orders/checkout-session/cartId
// // @access  Protected/User
// exports.checkoutSession = asyncHandler(async (req, res, next) => {
//   const { cartId } = req.params;
//   const { shippingAddress } = req.body;
//   const cart = await Cart.findById(cartId);
//   if (!cart) {
//     return next(new ApiError(`Cart not found with id ${cartId}`, 404));
//   }

//   // get total price
//   const taxPrice = 0;
//   const shippingPrice = 0;
//   const totalPrice = cart.totalPriceAfterDiscount
//     ? cart.totalPriceAfterDiscount
//     : cart.totalPrice;
//   const totalOrderPrice = totalPrice + shippingPrice + taxPrice;

//   const session = await stripe.checkout.sessions.create({
//     line_items: [
//       {
//         price_data: {
//           currency: "egp",
//           product_data: {
//             name: req.user.name,
//           },
//           unit_amount: totalOrderPrice * 100, // Amount in cents (e.g., 150.00 EGP = 15000)
//         },
//         quantity: 1,
//       },
//     ],
//     mode: "payment",
//     success_url: `${req.protocol}://${req.get("host")}/orders`,
//     cancel_url: `${req.protocol}://${req.get("host")}/carts`,
//     customer_email: req.user.email,
//     client_reference_id: cartId,
//     metadata: shippingAddress,
//   });

//   res.status(200).json({ status: "success", session: session });
// });

// const createCardOrder = async (session, req, res, next) => {
//   const {
//     client_reference_id: cartId,
//     metadata: shippingAddress,
//     amount_total: totalOrderPrice,
//   } = session;

//   const cart = await Cart.findById(cartId);
//   if (!cart) {
//     throw new ApiError(`Cart not found with id ${cartId}`, 404);
//   }

//   const user = await User.findOne({ email: session.customer_email });

//   const createOrder = await Order.create({
//     user: user._id,
//     cartItems: cart.cartItem,
//     paymentMethodType: "card",
//     isPaid: true,
//     paidAt: Date.now(),
//     shippingAddress: shippingAddress,
//     totalOrderPrice: totalOrderPrice / 100,
//   });

//   await afterOrderCreated(createOrder,cart,cartId)

// };

// // @desc    This webhook will run when stripe payment success paid
// // @route   POST /webhook-checkout
// // @access  Protected/User
// exports.webhookCheckout = asyncHandler(async (req, res, next) => {
//   const sig = req.headers["stripe-signature"];

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }
//   if (event.type === "checkout.session.completed") {
//     //  Create order
//     createCardOrder(event.data.object, req, res, next);
//   }

//   return res.status(200).json({ received: true });

// });
