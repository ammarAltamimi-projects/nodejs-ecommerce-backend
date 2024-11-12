const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const GroupOrder = require("../models/groupOrderModel");
const Address = require("../models/addressModel");
const Coupon = require("../models/couponModel");
const Payout = require("../models/payoutModel");
const Store = require("../models/storeModel");
const ShippingRate = require("../models/shippingRateModel");
const Country = require("../models/countryModel");
const PaymentDetails = require("../models/paymentDetailsModel");
const ApiFeature = require("../utils/apiFeatures");
const {
  calculateTotalPriceWithShippingFee,
  getNewTotalPriceAfterCouponDiscount,
  updateCartWithLatestForCheckout,
} = require("./cartService");
const { getShippingDatesRange } = require("../utils/shippingDatesRange");

const { getAll, getOne } = require("../middlewares/handlersFactoryMiddleware");

const ApiError = require("../utils/apiError");

const getShippingDetails = async (storeId, countryId) => {
  const defaultShipping = await Store.findOne({ _id: storeId });
  const shippingRate = await ShippingRate.findOne({
    store: storeId,
    country: countryId,
  });

  return {
    shippingService:
      shippingRate?.shippingService || defaultShipping.defaultShippingService,
    deliveryTimeMin:
      shippingRate?.deliveryTimeMin || defaultShipping.defaultDeliveryTimeMin,
    deliveryTimeMax:
      shippingRate?.deliveryTimeMax || defaultShipping.defaultDeliveryTimeMax,
  };
};
/* -------------------------------------------------------------------------- */
const updateOrderItemWithLatest = async (OrderItem) => {
  // >> update the Order item
  const updatedOrderItem = await Promise.all(
    OrderItem.map(async (OrderItemObj) => {
      // 1. Check if all references exist; if not, mark status as "unavailable".

      // Check store reference
      const store = await Store.findOne({ _id: OrderItemObj.store });
      if (!store) {
        OrderItemObj.status = "unavailable";
        return OrderItemObj;
      }
      // Check product reference
      const product = await Product.findOne({ _id: OrderItemObj.product });
      if (!product) {
        OrderItemObj.status = "unavailable";
        return OrderItemObj;
      }
      // Check variant reference
      const variant = product.variant.find(
        (item) => item._id.toString() === OrderItemObj.variant.toString()
      );
      if (!variant) {
        OrderItemObj.status = "unavailable";
        return OrderItemObj;
      }

      // 2. Check if the variant is out of stock
      if (variant.stockQuantity === 0) {
        OrderItemObj.status = "out_of_stock";
        return OrderItemObj;
      }

      // this steps is important for this senario which is if varaint of of stock so we enter variant.stockQuantity === 0 condition and the state will be  "out_of_stock";
      // so if admin add stock to this variant then we will not enter any condition right but we dont update the statue so you should say i does not enter any condition then is available
      OrderItemObj.status = "available";

      return OrderItemObj; // Return the updated object
    })
  );

  // Update order items
  return updatedOrderItem;
};

/* -------------------------------------------------------------------------- */
 //  add  ReservedStock and decrease StockQuantity
const updateReservedStockAndStockQuantityForPlaceOrder = async (order) => {
  // i want to get all orderItem of my order in one array and i have two ways by distinct or aggregate

  // by distinct
  // let allOrderItems= await GroupOrder.distinct("OrderItem", { order:order._id });
  //   allOrderItems = allOrderItems.flat()

  // by aggregate
  const result = await GroupOrder.aggregate([
    { $match: { order: order._id } },
    { $unwind: "$OrderItem" },
    {
      $group: {
        _id: null,
        orderItems: { $push: "$OrderItem" },
      },
    },
    { $project: { _id: 0, orderItems: 1 } },
  ]);

  const allOrderItems = result[0].orderItems;

  // now add  ReservedStock and decrease StockQuantity
  const bulkOption = await Promise.all(
    allOrderItems.map(async (item) => {
      const product = await Product.findById(item.product);
      console.log(product);
      return {
        updateOne: {
          filter: {
            _id: item.product,
            subcategoryType: product.subcategoryType,
          }, // Match the product
          update: {
            $inc: {
              "variant.$[objFilter].ReservedStock": +item.quantity, // add ReservedStock
              "variant.$[objFilter].stockQuantity": -item.quantity, // Decrease StockQuantity
            },
          },
          arrayFilters: [
            { "objFilter._id": item.variant }, // Match array elements by ID
          ],
        },
      };
    })
  );

  await Product.bulkWrite(bulkOption, {});
};

/* -------------------------------------------------------------------------- */
 //  add StockQuantity  and decrease ReservedStock
const updateReservedStockAndStockQuantityForCancellation = async (order) => {
   // i want to get all orderItem of my order in one array and i have two ways by distinct or aggregate

  // by distinct
  // let allOrderItems= await GroupOrder.distinct("OrderItem", { order:order._id });
  //   allOrderItems = allOrderItems.flat()

  // by aggregate
  const result = await GroupOrder.aggregate([
    { $match: { order: order._id } },
    { $unwind: "$OrderItem" },
    {
      $group: {
        _id: null,
        orderItems: { $push: "$OrderItem" },
      },
    },
    { $project: { _id: 0, orderItems: 1 } },
  ]);

  const allOrderItems = result[0].orderItems;
  // now  add StockQuantity  and decrease ReservedStock
  const bulkOption = await Promise.all(
    allOrderItems.map(async (item) => {
      const product = await Product.findById(item.product);

      return {
        updateOne: {
          filter: {
            _id: item.product,
            subcategoryType: product.subcategoryType,
          }, // Match the product
          update: {
            $inc: {
              "variant.$[objFilter].ReservedStock": -item.quantity,
              "variant.$[objFilter].stockQuantity": +item.quantity,
            },
          },
          arrayFilters: [
            { "objFilter._id": item.variant }, // Match array elements by ID
          ],
        },
      };
    })
  );

  await Product.bulkWrite(bulkOption, {});
};
/* -------------------------------------------------------------------------- */

const updateOrderStateBasedOnGroupOrderState = async (orderId) => {
  //1. get the order and   get all groupOrder status belongs to this order
  const order = await Order.findById(orderId);

  const allGroupOrderStatus = await GroupOrder.distinct("groupOrderStatus", {
    order: order._id,
  });

  //2. all option like if there all delivery or all shipped or all cancelled ... + then update orderStatus

  // first way we dont using loop
  // const isAllConfirmed = allGroupOrderStatus.every((status)=> status === "Confirmed")
  // const isAllProcessing = allGroupOrderStatus.every((status)=> status === "Processing")
  // const isAllOutforDelivery = allGroupOrderStatus.every((status)=> status === "OutforDelivery")
  // const isAllDelivery = allGroupOrderStatus.every((status)=> status === "Delivered")
  // const isAllCancelled = allGroupOrderStatus.every((status)=> status === "Cancelled")
  // const isAllFailed = allGroupOrderStatus.every((status)=> status === "Failed")
  // const isAllRefunded = allGroupOrderStatus.every((status)=> status === "Refunded")
  // const isAllReturned = allGroupOrderStatus.every((status)=> status === "Returned")
  // const isAllPartiallyShipped = allGroupOrderStatus.every((status)=> status === "PartiallyShipped")
  // const isAllOnHold = allGroupOrderStatus.every((status)=> status === "OnHold")

  // second way using loop
  const isAllStatus = {};
  allGroupOrderStatus.forEach((status) => {
    isAllStatus[status] = allGroupOrderStatus.every((s) => s === status);
  });

  // now may only one of this value will be true only one because groupOrderStatus will not be like all delivery and all shipped in same time
  // or all false means  they diff like some delivery and another shipped and another Failed and  ...
  const trueStatus = Object.entries(isAllStatus).find(
    (value) => value[1] === true
  );

  //update order status if there all option + else
  if (trueStatus) {
    order.orderStatus = trueStatus[0];
  }
  //3. some option : mean if there no all option then they diff like some pending and some delivery ... + update order status
  // if there is Delivered or Shipped or PartiallyShipped in last of statues that means PartiallyShipped
  // i use else if because if all like shipped i dont need to check here
  else if (
    allGroupOrderStatus.includes("Delivered") ||
    allGroupOrderStatus.includes("Shipped") ||
    allGroupOrderStatus.includes("PartiallyShipped")
  ) {
    order.orderStatus = "PartiallyShipped";
  }

  //4. do some actions that depends on orderStatus

  // update status for cash payment  to paid in order and PaymentDetails + put delivery date
  if (order.orderStatus === "Delivered"  ) {
    order.DeliveredAt = Date.now();
    if(order.paymentStatus === "Pending"){
      order.paymentStatus = "Paid";
      order.paidAt = Date.now();
      const updatePaymentDetails = await PaymentDetails.findOneAndUpdate(
        { order: orderId },
        { status: "Paid" },
        { new: true }
      );

          // create payouts
    // get scheduledAt
    const payoutDelayDays = 7;
    const scheduledAt = new Date(
      Date.now() + payoutDelayDays * 24 * 60 * 60 * 1000
    );
    //get all groupOrder means all store and create payout for each
    const groupOrder = await GroupOrder.find({ order: order._id });
    await Promise.all(
      groupOrder.map(async (groupOrderObj) => {
        await Payout.create({
          payment: updatePaymentDetails._id,
          store:groupOrderObj.store,
          groupOrder: groupOrderObj._id,
          groupOrder: groupOrderObj._id,
          payoutShippingFees:groupOrderObj.groupShippingFees,
          payoutSubTotal:groupOrderObj.groupSubTotal,
          total:groupOrderObj.total,
          status: "Scheduled",
          scheduledAt:scheduledAt
        });
      })
    );
    }


  }

  //5 same change to database
  await order.save();
};

/* -------------------------------------------------------------------------- */
const updateGroupOrderStateBasedOnOrderItemState  = async (groupOrder) => {
  //1. get  all Order item status belongs to this groupOrder

  const allOrderItemStatus = groupOrder.OrderItem.map(
    (orderItemObj) => orderItemObj.productStatus
  );

  //2. all option like if there all delivery or all shipped or all cancelled ... + then update groupOrderStatus

  const isAllStatus = {};
  allOrderItemStatus.forEach((status) => {
    isAllStatus[status] = allOrderItemStatus.every((s) => s === status);
  });

  // now may only one of this value will be true only one because Order item Status will not be like all delivery and all shipped in same time
  // or all false means  they diff like some delivery and another shipped and another Failed and  ...
  const trueStatus = Object.entries(isAllStatus).find(
    (value) => value[1] === true
  );

  //update order status if there all option
  if (trueStatus) {
    groupOrder.groupOrderStatus = trueStatus[0];
  }

  //3. some option : mean if there no all option then they diff like some pending and some delivery ... + update order status

  // if there is Delivered or Shipped or PartiallyShipped in last of statues that means PartiallyShipped
  // i use else if because if all like shipped i dont need to check here
  else if (
    allOrderItemStatus.includes("Delivered") ||
    allOrderItemStatus.includes("Shipped") ||
    allOrderItemStatus.includes("PartiallyShipped")
  ) {
    groupOrder.groupOrderStatus = "PartiallyShipped";
  }

  //4 same change to database
  await groupOrder.save();
};
/* -------------------------------------------------------------------------- */
const updateGroupOrderAndOrderItemStateBasedOnOrderState  = async (orderId) => {
  //1. get the order state 
  const order = await Order.findById(orderId);
  const { orderStatus } = order;
  //2. get all groupOrder belongs to this order 
  const groupOrder = await GroupOrder.find({ order: orderId });
  //3. apply orderStatus to all group Order Status  and its orderItem
  groupOrder.forEach((groupOrderObj) => {
    groupOrderObj.groupOrderStatus = orderStatus;
    groupOrderObj.OrderItem.forEach((orderItemObj)=>{
      orderItemObj.productStatus = orderStatus;
    })
  });

  //4 same change to database
  await Promise.all(
    groupOrders.map(async (groupObj) => {
      await groupObj.save();
    })
  );
};
/* -------------------------------------------------------------------------- */
const updateOrderItemStateBasedOnGroupOrderState = async (groupOrderId) => {
  //1. get  groupOrder and its status
  const groupOrder = await GroupOrder.findById({ _id: groupOrderId });
  const { groupOrderStatus } = groupOrder;

  //2. apply groupOrderStatus to all order Item status except PartiallyShipped so that i make condition to avoid update groupOrder to PartiallyShipped
  groupOrder.OrderItem.forEach((orderItemObj) => {
    orderItemObj.productStatus = groupOrderStatus;
  });

  //3. do some actions to OrderItem after updated its status
  await Promise.all(
    groupOrder.OrderItem.map(async (orderItemObj) => {
      if (
        orderItemObj.productStatus === "Shipped" &&
        orderItemObj.hasBeenShipped === false
      ) {
        const product = await Product.findById(orderItemObj.product);
        // increase sold
        product.sold += orderItemObj.quantity;
        // get variant
        const variant = product.variant.find(
          (variantObj) =>
            variantObj._id.toString() === orderItemObj.variant.toString()
        );
        variant.VariantSold += orderItemObj.quantity;
        variant.ReservedStock -= orderItemObj.quantity;
        orderItemObj.hasBeenShipped = true;
        await product.save();
      } else if (
        orderItemObj.productStatus === "Returned" &&
        orderItemObj.hasBeenReturned === false
      ) {
        const product = await Product.findById(orderItemObj.product);
        // add to returns
        product.returns += orderItemObj.quantity;
        // get variant
        const variant = product.variant.find(
          (variantObj) =>
            variantObj._id.toString() === orderItemObj.variant.toString()
        );
        variant.stockQuantity += orderItemObj.quantity;
        variant.VariantReturns += orderItemObj.quantity;
        orderItemObj.hasBeenReturned = true;

        orderItemObj.ReturnedAt  = Date.now();

          // i need to recalculate  payout fee and subtotal and total because one of the item is Returned 
    // get OrderItemNotReturned from groupOrder 
    const OrderItemNotReturned = groupOrder.OrderItem.filter((OrderItemObj)=>OrderItemObj.productStatus !== "Returned")
    let payoutShippingFees =0;
    let  payoutSubTotal =0; 
    OrderItemNotReturned.forEach((OrderItemObj)=>{
      payoutShippingFees += OrderItemObj.shippingFee + OrderItemObj.additionalFee;
      payoutSubTotal += OrderItemObj.snapshot.price *  OrderItemObj.quantity;
    })

     await Payout.findOneAndUpdate({groupOrder:groupOrder._id},{
      payoutShippingFees:payoutShippingFees,
      payoutSubTotal:payoutSubTotal,
      total:payoutShippingFees +payoutSubTotal
  })

        await product.save();
      } else if (orderItemObj.productStatus === "Delivered") {
        orderItemObj.DeliveredAt = Date.now();
      }
    })
  );

  //4 same change to database
  await groupOrder.save();
};

/* -------------------------------------------------------------------------- */

// Nested route (get)
const createFilterObj = async (req, res, next) => {
  if (req.user.role === "user") {
    req.filterObj = { user: req.user._id };
  }
  next();
};
/* -------------------------------------------------------------------------- */
const groupFilterObj = async (req, res, next) => {
  if (req.body.storeId) {
    req.filterObj = { store: req.body.storeId };
  }
  next();
};

// @desc    Get my orders
// @route   POST /api/v1/orders
// @access  Protected/User
const getMyOrders = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.filterObj) {
    filter = req.filterObj;
  }

  const documentsCounts = await Order.countDocuments();
  const Query = Order.find(filter);

  const apiFeatures = new ApiFeature(Query, req.query)
    .filter()
    .sort()
    .limitFields()
    .search(Order.modelName)
    .paginate(documentsCounts);

  const { mongooseQuery, pagination } = apiFeatures;

  const documents = await mongooseQuery.populate("groupOrders");

  // update orderItem with Latest  because i did the idea of snapchat not the idea of delete 
  await Promise.all(
    documents.map(async (order) => {
      await Promise.all(
        order.groupOrders.map(async (groupOrder) => {
          const updatedOrderItem = await updateOrderItemWithLatest(
            groupOrder.OrderItem
          );
          groupOrder.OrderItem = updatedOrderItem;
        })
      );
    })
  );

  res.status(200).json({
    states: "success",
    result: documents.length,
    data: documents,
    pagination: pagination,
  });
});

// @desc    Get all Group Order belongs to specific store
// @route   POST /api/v1/orders/groupedOrder
// @access  Protected/seller
const getGroupOrder = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.filterObj) {
    filter = req.filterObj;
  }

  const documentsCounts = await GroupOrder.countDocuments();
  const Query = GroupOrder.find(filter);

  const apiFeatures = new ApiFeature(Query, req.query)
    .filter()
    .sort()
    .limitFields()
    .search(GroupOrder.modelName)
    .paginate(documentsCounts);

  const { mongooseQuery, pagination } = apiFeatures;

  const documents = await mongooseQuery;

  // update orderItem With Latest  because i did the idea of snapchat not the idea of delete 
  await Promise.all(
    documents.map(async (groupOrder) => {
      const updatedOrderItem = await updateOrderItemWithLatest(
        groupOrder.OrderItem
      );
      groupOrder.OrderItem = updatedOrderItem;
    })
  );

  res.status(200).json({
    states: "success",
    result: documents.length,
    data: documents,
    pagination: pagination,
  });
});

// @desc    create cash order
// @route   POST /api/v1/orders/cartId
// @access  Protected/User
const createOrder = asyncHandler(async (req, res, next) => {
  const { cart, address } = req.body;

  // create  order

  // 1.get cart
  const getCart = await Cart.findById(cart);

  if (!cart) {
    return next(new ApiError(`Cart not found with id ${cart}`, 404));
  }

  //2.  updated cart + update  get total subTotalValue and total shippingFeesValue and total + apply coupon if exits and update new total price +
  // delete products that unavailable or out of stock
  const updatedCart = await updateCartWithLatestForCheckout(getCart);
  const filterCartItem = updatedCart.cartItem.filter(
    (cartItemObj) => cartItemObj.status === "available"
  );
  updatedCart.cartItem = filterCartItem;

  //3. get the address details
  const getAddress = await Address.findById(address);
  if (!getAddress) {
    return next(new ApiError(`Address not found with id ${address}`, 404));
  }
  const country = await Country.findById(getAddress.country);
  if (!country) {
    return next(
      new ApiError(`Country not found with id ${getAddress.country}`, 404)
    );
  }

  //4. create order
  const createOrder = await Order.create({
    user: req.user._id,
    shippingFees: updatedCart.shippingFees,
    subTotal: updatedCart.subTotal,
    total: updatedCart.total,
    shippingAddress: address,
    snapshot: {
      firstName: getAddress.firstName,
      lastName: getAddress.lastName,
      phone: getAddress.phone,
      alias: getAddress.alias,
      address1: getAddress.address1,
      address2: getAddress.address2,
      state: getAddress.state,
      city: getAddress.city,
      country: country.name,
      postalCode: getAddress.postalCode,
      defaultAddress: getAddress.defaultAddress,
    },
  });

  // create group order

  //1. cart item is array of cartItemObj -> i will divide them to groups based in storeId
  // so i will make obj have storeId as key then its groups which array of cartItemObj
  const groupedItems = updatedCart.cartItem.reduce((acc, item) => {
    if (!acc[item.store]) acc[item.store] = [];
    acc[item.store].push(item);
    return acc;
  }, {});

  //2. i will defined groups which array of obj each obj is orderGrouped
  // i convert obj to array of arrays each array have first the store  and second the array of cartItemObj the belongs to this store
  // after that i will loop and in each iteration i have group so i will create groupOrder in each iteration
  await Promise.all(
    Object.entries(groupedItems).map(async ([storeId, items]) => {
      // 1. check if there any applied coupon that valid + belongs to this store

      let groupedCoupon;
      let coupon;
      let couponName;
      if (updatedCart.appliedCoupon) {
        coupon = await Coupon.findOne({
          name: updatedCart.appliedCoupon,
          start: { $lt: Date.now() },
          expire: { $gt: Date.now() },
        });

        if (coupon && coupon.store.toString() === storeId.toString()) {
          groupedCoupon = coupon._id;
          couponName = coupon.name;
        }
      }

      //2. get the  groupShippingFees and groupSubTotal and total
      const { subTotalValue, shippingFeesValue } =
        calculateTotalPriceWithShippingFee(items);
      let groupTotal = subTotalValue + shippingFeesValue;
      // check if there is discount
      if (groupedCoupon) {
        const discountValue = (groupTotal * coupon?.discount) / 100;
        groupTotal = groupTotal - discountValue;
      }

      // 3. get shipping details for this storeId and this country
      // get country
      countryId = "67cda67e0edb0b1b1efe1bf5";
      // get shipping details
      const { shippingService, deliveryTimeMin, deliveryTimeMax } =
        await getShippingDetails(storeId, countryId);
      // Returns the shipping date range by adding the specified min and max days to the current date.
      const { minDate, maxDate } = getShippingDatesRange(
        deliveryTimeMin,
        deliveryTimeMax,
        new Date(createOrder.createdAt)
      );

      // 4. create the GroupOrder
      const createGroupOrder = await GroupOrder.create({
        order: createOrder._id,
        store: storeId,
        coupon: groupedCoupon || null,
        snapshot: {
          name: couponName || null,
        },
        OrderItem: items,
        groupShippingFees: shippingFeesValue,
        groupSubTotal: subTotalValue,
        total: groupTotal,
        shippingService: shippingService,
        shippingDeliveryMin: minDate,
        shippingDeliveryMax: maxDate,
      });
    })
  );

  //3. find Group order that belongs to this order
  const groupOrder = await GroupOrder.find({ order: createOrder._id });

  //4 if order and groupOrder is created i want to decrease StockQuantity and add ReservedStock
  // decrease StockQuantity : because user order some product we should decrease its stock
  // ReservedStock : i need to save this qth that i decrease from stock because if order cancelled or some thing like that i need to add again in stock
  if (createOrder && groupOrder) {
    await updateReservedStockAndStockQuantityForPlaceOrder(createOrder);
  }

  //5. the res
  res.status(201).json({
    status: "success",
    message: "order created successfully",
    order: createOrder,
    groupOrder,
  });
});

// @desc    Get specific Order by id
// @route   GET /api/v1/Order/:id
// @access  user
const getOrderDetails = asyncHandler(async (req, res, next) => {
  const paramsFilter = req.params.id;

  let query = Order.findById(paramsFilter).populate("groupOrders");

  const document = await query;

  if (!document) {
    return next(
      new ApiError(`No ${Order.modelName} with  ${req.params.id}`, 404)
    );
  }

  // update orderItem With Latest because i did the idea of snapchat not the idea of delete 
  await Promise.all(
    document.groupOrders.map(async (groupOrder) => {
      const updatedOrderItem = await updateOrderItemWithLatest(
        groupOrder.OrderItem
      );
      groupOrder.OrderItem = updatedOrderItem;
    })
  );

  res.status(200).json({ states: "success", data: document });
});

// @desc    Update order status to cancelled
// @route   PUT /api/v1/orders/:id
// @access  Protected/user
const cancelledOrder = asyncHandler(async (req, res, next) => {
  //1. get the order
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ApiError(`order not found with id ${req.params.id}`, 404));
  }
  //2. check if order already shipped
  if (order.orderStatus !== "Pending" && order.orderStatus !== "Processing") {
    return next(new ApiError(` order already shipped you can not cancel`, 404));
  }
  //3. order cancelled
  order.orderStatus = "Cancelled";
  
 //4. (update group order status + all orderItem belongs to them ) depends on its orderStatus
await updateGroupOrderAndOrderItemStateBasedOnOrderState(order._id)


  //5. i need to make payout Reversed for all groupOrder for this order if payment paid (for online)
  // as well as update payment states when paid online
  const groupOrder = await GroupOrder.find({ order: order._id });
  // get payments 
  const payment = await PaymentDetails.findOne({ order: order._id });
  if(payment.status === "Paid"){
    await Promise.all(
      groupOrder.map(async (groupOrderObj) => {
        const updatePayout = await Payout.findOneAndUpdate({groupOrder:groupOrderObj._id},
          {
            status:"Reversed"
          }
        )
        await groupOrder.save();
      })
    );
    payment.status = "Refunded";
    await payment.save()
  }
  
  //6.  update payment states when paid cash
  if(payment.status === "Pending"){
    payment.status = "Cancelled";
    await payment.save()
  }

  //7. update ReservedStock And StockQuantity
  await updateReservedStockAndStockQuantityForCancellation(order);

  await order.save();
  res.status(200).json({
    status: "success",
    message: "Order Cancelled",
    data: order,
  });
});

// @desc    Update orderItem status to cancelled
// @route   PUT /api/v1/orders/:groupId/:itemId/cancelledOrderItem
// @access  Protected/user
const cancelledOrderItem = asyncHandler(async (req, res, next) => {
  //1. get order item 
  const groupOrder = await GroupOrder.findById(req.params.groupId);
  if (!groupOrder) {
    return next(
      new ApiError(`group order not found with id ${req.params.groupId}`, 404)
    );
  }

  const orderItemObj = groupOrder.OrderItem.find(
    (item) => item.id.toString() === req.params.itemId
  );
  if (!orderItemObj) {
    return next(
      new ApiError(`item order not found with id ${req.params.itemId}`, 404)
    );
  }
    //2. check if order item already shipped
  if (orderItemObj.productStatus !== "Pending" && orderItemObj.productStatus !== "Processing") {
    return next(
      new ApiError(`item order already shipped you can not cancel`, 404)
    );
  }
  //3. order item cancelled
  orderItemObj.productStatus = "Cancelled";
//4. update group order status depends on  order item Status
await updateGroupOrderStateBasedOnOrderItemState(groupOrder)
//5. update order status that this group belongs to  because if one orderGroupStatus change then orderStatus change automatically
 await updateOrderStateBasedOnGroupOrderState(groupOrder.order);


 //6. updateReservedStockAndStockQuantityForCancellation
  const product = await Product.findById(orderItemObj.product);
  const variantObj = product.variant.find(
    (v) => v._id.toString() === orderItemObj.variant.toString()
  );
  variantObj.ReservedStock -= orderItemObj.quantity;
  variantObj.stockQuantity += orderItemObj.quantity;
  await product.save();


  //7. i need to recalculate  payout fee and subtotal and total because one of the item is cancel if payment done
  // get payments 
  const payment = await PaymentDetails.findOne({ order: groupOrder.order });
  if(payment.status === "Paid"){
    // get OrderItemNotReturned from groupOrder 
    const OrderItemNotReturned = groupOrder.OrderItem.filter((OrderItemObj)=>OrderItemObj.productStatus !== "Cancelled")
    let payoutShippingFees =0;
    let  payoutSubTotal =0; 
    OrderItemNotReturned.forEach((OrderItemObj)=>{
      payoutShippingFees += OrderItemObj.shippingFee + OrderItemObj.additionalFee;
      payoutSubTotal += OrderItemObj.snapshot.price * OrderItemObj.quantity;
    })

     await Payout.findOneAndUpdate({groupOrder:groupOrder._id},{
      payoutShippingFees:payoutShippingFees,
      payoutSubTotal:payoutSubTotal,
      total:payoutShippingFees +payoutSubTotal
  })

  }

  await groupOrder.save();
  res.status(200).json({
    status: "success",
    message: "OrderItem Cancelled",
    data: orderItemObj,
  });
});

// @desc    Update group order status
// @route   PUT /api/v1/orders/:groupId/updateGroupOrderStatus
// @access  Protected/seller
const updateGroupOrderStatus = asyncHandler(async (req, res, next) => {
  // 1. update groupOrder status
  const updateGroupOrderStatus = await GroupOrder.findByIdAndUpdate(
    req.params.groupId,
    {
      groupOrderStatus: req.body.groupOrderStatus,
    },
    { new: true }
  );

  if (!updateGroupOrderStatus) {
    return next(
      new ApiError(`group order not found with id ${req.params.groupId}`, 404)
    );
  }
  //2. put DeliveredAt Date
  if (req.body.groupOrderStatus === "Delivered") {
    updateGroupOrderStatus.DeliveredAt = Date.now();
  }

  //3. if update groupOrderStatus to PartiallyShipped say message to make update status for each orderItem alone
  if (req.body.groupOrderStatus === "PartiallyShipped") {
    return next(new ApiError(`update orderItem status individually`, 404));
  }

  //4. if returned should edit payout to Reversed of that group 
  if (req.body.groupOrderStatus === "Returned") {
     await Payout.findOneAndUpdate({groupOrder: req.params.groupId},
      {
        status:"Reversed"
      }
    )
  }


  //4. update order status that this group belongs to  because if one orderGroupStatus change then orderStatus change automatically
  await updateOrderStateBasedOnGroupOrderState(updateGroupOrderStatus.order);
  //5. update order item status for this group because if one orderGroupStatus change then order item Status change automatically
  await updateOrderItemStateBasedOnGroupOrderState(updateGroupOrderStatus._id);

  await updateGroupOrderStatus.save();
  res.status(200).json({
    status: "success",
    message: "Group Order Status is updated successfully",
    data: updateGroupOrderStatus,
  });
});

// @desc    Update item order status
// @route   PUT /api/v1/orders/:groupId/:itemId/updateItemOrderStatus
// @access  Protected/seller
const updateItemOrderStatus = asyncHandler(async (req, res, next) => {
  //1. update order item status
  const groupOrder = await GroupOrder.findById(req.params.groupId);
  if (!groupOrder) {
    return next(
      new ApiError(`group order not found with id ${req.params.groupId}`, 404)
    );
  }

  const orderItemObj = groupOrder.OrderItem.find(
    (item) => item.id.toString() === req.params.itemId
  );
  if (!orderItemObj) {
    return next(
      new ApiError(`item order not found with id ${req.params.itemId}`, 404)
    );
  }
  orderItemObj.productStatus = req.body.productStatus;

  //2.if order item status is shipped or return or delivery
  if (
    orderItemObj.productStatus === "Shipped" &&
    orderItemObj.hasBeenShipped === false
  ) {
    const product = await Product.findById(orderItemObj.product);
    // increase sold
    product.sold += orderItemObj.quantity;

    // get variant
    const variant = product.variant.find(
      (variantObj) =>
        variantObj._id.toString() === orderItemObj.variant.toString()
    );
    variant.ReservedStock -= orderItemObj.quantity;
    orderItemObj.hasBeenShipped = true;
    await product.save();
  } else if (
    orderItemObj.productStatus === "Returned" &&
    orderItemObj.hasBeenReturned === false
  ) {
    const product = await Product.findById(orderItemObj.product);
    // add to returns
    product.returns += orderItemObj.quantity;
    // get variant
    const variant = product.variant.find(
      (variantObj) =>
        variantObj._id.toString() === orderItemObj.variant.toString()
    );
    variant.stockQuantity += orderItemObj.quantity;
    variant.VariantReturns += orderItemObj.quantity;
    orderItemObj.hasBeenReturned = true;


  // i need to recalculate  payout fee and subtotal and total because one of the item is Returned 
    // get OrderItemNotReturned from groupOrder 
    const OrderItemNotReturned = groupOrder.OrderItem.filter((OrderItemObj)=>OrderItemObj.productStatus !== "Returned")
    let payoutShippingFees =0;
    let  payoutSubTotal =0; 
    OrderItemNotReturned.forEach((OrderItemObj)=>{
      payoutShippingFees += OrderItemObj.shippingFee + OrderItemObj.additionalFee;
      payoutSubTotal += OrderItemObj.snapshot.price *  OrderItemObj.quantity;
    })

     await Payout.findOneAndUpdate({groupOrder:groupOrder._id},{
      payoutShippingFees:payoutShippingFees,
      payoutSubTotal:payoutSubTotal,
      total:payoutShippingFees +payoutSubTotal
  })

  

  orderItemObj.ReturnedAt  = Date.now();
    await product.save();
  } else if (orderItemObj.productStatus === "Delivered") {
    orderItemObj.DeliveredAt = Date.now();
  }

  //4. update group order status depends on its order item Status
  await updateGroupOrderStateBasedOnOrderItemState(groupOrder);
  //5. update order status that this group belongs to  because if one orderGroupStatus change then orderStatus change automatically
  await updateOrderStateBasedOnGroupOrderState(groupOrder.order);

  await groupOrder.save();

  res.status(200).json({
    status: "success",
    message: "item Order Status is updated successfully",
    data: groupOrder,
  });
});

module.exports = {
  updateReservedStockAndStockQuantityForCancellation,
  createFilterObj,
  groupFilterObj,
  getMyOrders,
  getGroupOrder,
  createOrder,
  getOrderDetails,
  cancelledOrder,
  updateGroupOrderStatus,
  updateItemOrderStatus,
  cancelledOrderItem,
  updateGroupOrderAndOrderItemStateBasedOnOrderState,
};
