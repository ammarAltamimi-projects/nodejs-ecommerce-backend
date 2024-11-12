const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");
const CouponUsage = require("../models/couponUsageModel");
const Store = require("../models/storeModel");
const ShippingRate = require("../models/shippingRateModel");
const { getShippingDatesRange } = require("../utils/shippingDatesRange");

// calculate the shippingFee & additionalFee and other shipping details for specific product
//(to get shipping details for specific product i need to know two things store that have the product  and the country because each store delivered to country with diff fee based in distance )
const calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails = async (
  cartItemObj
) => {
  // get product that in cartItemObj and then get   freeShippingForAllCountries and freeShippingForSpecificCountries
  const {
    freeShippingForAllCountries,
    freeShippingForSpecificCountries,
    variant,
  } = await Product.findOne({ _id: cartItemObj.product });
  // get the weight from product
  const { weight } = variant.find(
    (item) => item._id.toString() === cartItemObj.variant.toString()
  );
  // get the default shipping for cart store
  const defaultShipping = await Store.findOne({ _id: cartItemObj.store });
  // first get my country then get get shipping rate for store in cart for my country
  // assume we have  67cda67e0edb0b1b1efe1bf5
  const shippingRate = await ShippingRate.findOne({
    store: cartItemObj.store,
    country: "67cda67e0edb0b1b1efe1bf5",
  });
  let shippingFeeValue;
  let additionalFeeValue;

  if (
    freeShippingForAllCountries ||
    freeShippingForSpecificCountries.includes("67cda67e0edb0b1b1efe1bf5")
  ) {
    shippingFeeValue = 0;
    additionalFeeValue = 0;
  } else if (cartItemObj.snapshot.shippingFeeMethod === "fixed") {
    shippingFeeValue =
      shippingRate?.shippingFeeFixed || defaultShipping.defaultShippingFeeFixed;
    additionalFeeValue = 0;
  } else if (cartItemObj.snapshot.shippingFeeMethod === "weight") {
    shippingFeeValue =
      shippingRate?.shippingFeePerKg || defaultShipping.defaultShippingFeePerKg; // per 1 wight
    shippingFeeValue *= weight; // per variantWeight wight
    additionalFeeValue = 0;
  } else if (cartItemObj.snapshot.shippingFeeMethod === "item") {
    shippingFeeValue =
      shippingRate?.shippingFeePerItem ||
      defaultShipping.defaultShippingFeePerItem;
    additionalFeeValue =
      shippingRate?.shippingFeeForAdditionalItem ||
      defaultShipping.defaultShippingFeeForAdditionalItem;
  }

  // get deliveryTimeMin and deliveryTimeMax
  const deliveryTimeMin =
    shippingRate?.deliveryTimeMin || defaultShipping.defaultDeliveryTimeMin;
  const deliveryTimeMax =
    shippingRate?.deliveryTimeMax || defaultShipping.defaultDeliveryTimeMax;
  // Returns the shipping date range by adding the specified min and max days to the current date.
  const { minDate, maxDate } = getShippingDatesRange(
    deliveryTimeMin,
    deliveryTimeMax,
    new Date()
  );
  return {
    shippingFeeValue,
    additionalFeeValue,
    returnPolicy:
      shippingRate?.returnPolicy || defaultShipping.defaultReturnPolicy,
    shippingService:
      shippingRate?.shippingService || defaultShipping.defaultShippingService,
    deliveryTimeMin: minDate,
    deliveryTimeMax: maxDate,
  };
};

// calculate TotalPrice and ShippingFees for total cartItem
const calculateTotalPriceWithShippingFee = (cartItems) => {
  let subTotalValue = 0,
    shippingFeesValue = 0;

  cartItems.forEach((cartItem) => {
    if (cartItem.status === "available") {
      subTotalValue += cartItem.snapshot.price * cartItem.quantity;

      if (cartItem.snapshot.shippingFeeMethod === "item") {
        shippingFeesValue +=
          cartItem.shippingFee +
          cartItem.additionalFee * (cartItem.quantity - 1);
      } else if (cartItem.snapshot.shippingFeeMethod === "fixed") {
        shippingFeesValue += cartItem.shippingFee; // no quantity apply in fixed
      } else {
        shippingFeesValue += cartItem.shippingFee * cartItem.quantity;
      }
    }
  });

  return { subTotalValue, shippingFeesValue };
};

const getNewTotalPriceAfterCouponDiscount = (coupon, cart) => {
  // get store for this coupon to apply coupon in cartItemObj that have same store
  const { store } = coupon;
  // get cartItemObj that have only store id coupon

  const storeItems = cart.cartItem.filter(
    (item) => item.store._id.toString() === store._id.toString()
  );

  if (storeItems.length === 0) {
    throw new ApiError(
      "No items in the cart belong to the store associated with this coupon.",
      404
    );
  }
  // calculate TotalPrice and ShippingFees for storeItems
  const storeTotalPriceAndShippingFee =
    calculateTotalPriceWithShippingFee(storeItems);
  const storeTotal =
    storeTotalPriceAndShippingFee.subTotalValue +
    storeTotalPriceAndShippingFee.shippingFeesValue;

  // we do this for following senario : if the user apply coupon will get totalPrice after discount if its apply again will abstract from discount one so
  // i need to ensure to apply the discount on the cart total price
  const { subTotalValue, shippingFeesValue } =
    calculateTotalPriceWithShippingFee(cart.cartItem);
  cart.total = subTotalValue + shippingFeesValue;

  // get discountedAmount value
  const discountedAmount = (storeTotal * coupon.discount) / 100;

  // get Total price by abstract the discountedAmount from total price
  const newTotal = cart.total - discountedAmount;

  return { newTotal, discountedAmount };
};

async function updateCartWithLatest(cart) {
  // >> update the cart item
  const updatedCartItem = await Promise.all(
    cart.cartItem.map(async (cartItemObj) => {
      // 1. Check if all references exist; if not, mark status as "unavailable".

      // Check store reference
      const store = await Store.findOne({ _id: cartItemObj.store });
      if (!store) {
        cartItemObj.status = "unavailable";
        return cartItemObj;
      }
      // Check product reference
      const product = await Product.findOne({ _id: cartItemObj.product });
      if (!product) {
        cartItemObj.status = "unavailable";
        return cartItemObj;
      }
      // Check variant reference
      const variant = product.variant.find(
        (item) => item._id.toString() === cartItemObj.variant.toString()
      );
      if (!variant) {
        cartItemObj.status = "unavailable";
        return cartItemObj;
      }

      // 2. Check if the variant is out of stock
      if (variant.stockQuantity === 0) {
        cartItemObj.status = "out_of_stock";
        return cartItemObj;
      }

      //3. this steps is important for this senario which is if varaint of of stock so we enter variant.stockQuantity === 0 condition and the state will be  "out_of_stock";
      // so if admin add stock to this variant then we will not enter any condition right but we dont update the statue so you should say i does not enter any condition then is available
      cartItemObj.status = "available";

      // 4. check the reset of keys that are related to the ref

      // A. Product-related keys
      cartItemObj.snapshot.productName = product.title;
      cartItemObj.snapshot.shippingFeeMethod = product.shippingFeeMethod;
      // B. Variant-related keys
      cartItemObj.snapshot.variantName = variant.variantTitle;
      cartItemObj.snapshot.price = variant.isSale
        ? variant.salePrice
        : variant.price;
      cartItemObj.snapshot.imageCover = variant.imageCover;
      // variant stockQuantity and quantity
      // Ensure quantity does not exceed stockQuantity
      //  we need to see if quantity > stockQuantity then we will make quantity same stockQuantity
      //because i dont need   quantity > stockQuantity or i can use math min to take the less one
      // so if quantity less i will take if its hight then i will make it same stockQuantity

      cartItemObj.quantity = Math.min(
        cartItemObj.quantity,
        variant.stockQuantity
      );

      // 5. check the keys that will changed will you change the above keys
      //  change of shippingFeeMethod will change shippingFee , additionalFee , shippingFees
      //  change of price and quantity  will change shippingFees , subTotal , total

      // A Recalculate shipping fees
      const { shippingFeeValue, additionalFeeValue } =
        await calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails(
          cartItemObj
        );
      cartItemObj.shippingFee = shippingFeeValue;
      cartItemObj.additionalFee = additionalFeeValue;

      return cartItemObj; // Return the updated object
    })
  );

  // Update cart items
  cart.cartItem = updatedCartItem;

  // B Recalculate subTotal, shippingFees, and total
  const { subTotalValue, shippingFeesValue } =
    calculateTotalPriceWithShippingFee(cart.cartItem);
  cart.subTotal = subTotalValue;
  cart.shippingFees = shippingFeesValue;
  cart.total = subTotalValue + shippingFeesValue;

  return cart;
}

// same updateCartWithLatest but only step 5 i new which check apply coupon because in updateCartWithLatest we dont need to check
async function updateCartWithLatestForCheckout(cart) {
  // >> update the cart item
  const updatedCartItem = await Promise.all(
    cart.cartItem.map(async (cartItemObj) => {
      // 1. Check if all references exist; if not, mark status as "unavailable".

      // Check store reference
      const store = await Store.findOne({ _id: cartItemObj.store });
      if (!store) {
        cartItemObj.status = "unavailable";
        return cartItemObj;
      }
      // Check product reference
      const product = await Product.findOne({ _id: cartItemObj.product });
      if (!product) {
        cartItemObj.status = "unavailable";
        return cartItemObj;
      }
      // Check variant reference
      const variant = product.variant.find(
        (item) => item._id.toString() === cartItemObj.variant.toString()
      );
      if (!variant) {
        cartItemObj.status = "unavailable";
        return cartItemObj;
      }

      // 2. Check if the variant is out of stock
      if (variant.stockQuantity === 0) {
        cartItemObj.status = "out_of_stock";
        return cartItemObj;
      }

      //3. this steps is important for this senario which is if varaint of of stock so we enter variant.stockQuantity === 0 condition and the state will be  "out_of_stock";
      // so if admin add stock to this variant then we will not enter any condition right but we dont update the statue so you should say i does not enter any condition then is available
      cartItemObj.status = "available";

      // 4. check the reset of keys that are related to the ref

      // A. Product-related keys
      cartItemObj.snapshot.productName = product.title;
      cartItemObj.snapshot.shippingFeeMethod = product.shippingFeeMethod;
      // B. Variant-related keys
      cartItemObj.snapshot.variantName = variant.variantTitle;
      cartItemObj.snapshot.price = variant.isSale
        ? variant.salePrice
        : variant.price;
      cartItemObj.snapshot.imageCover = variant.imageCover;
      // variant stockQuantity and quantity
      // Ensure quantity does not exceed stockQuantity
      //  we need to see if quantity > stockQuantity then we will make quantity same stockQuantity
      //because i dont need   quantity > stockQuantity or i can use math min to take the less one
      // so if quantity less i will take if its hight then i will make it same stockQuantity

      cartItemObj.quantity = Math.min(
        cartItemObj.quantity,
        variant.stockQuantity
      );

      // 5. check the keys that will changed will you change the above keys
      //  change of shippingFeeMethod will change shippingFee , additionalFee , shippingFees
      //  change of price and quantity  will change shippingFees , subTotal , total

      // A Recalculate shipping fees
      const { shippingFeeValue, additionalFeeValue } =
        await calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails(
          cartItemObj
        );
      cartItemObj.shippingFee = shippingFeeValue;
      cartItemObj.additionalFee = additionalFeeValue;

      return cartItemObj; // Return the updated object
    })
  );

  // Update cart items
  cart.cartItem = updatedCartItem;

  // B Recalculate subTotal, shippingFees, and total
  const { subTotalValue, shippingFeesValue } =
    calculateTotalPriceWithShippingFee(cart.cartItem);
  cart.subTotal = subTotalValue;
  cart.shippingFees = shippingFeesValue;
  cart.total = subTotalValue + shippingFeesValue;

  //6. check if there coupon apply then will Recalculate total after discountCoupon
  if (cart.appliedCoupon) {
    const coupon = await Coupon.findOne({
      name: cart.appliedCoupon,
      start: { $lt: Date.now() },
      expire: { $gt: Date.now() },
    });
    if (!coupon) {
      cart.appliedCoupon = "";
      return;
    }

    const { newTotal, discountedAmount } = getNewTotalPriceAfterCouponDiscount(
      coupon,
      cart
    );
    cart.total = newTotal;
  }

  return cart;
}

// @desc    Get logged user cart
// @route   GET /api/v1/cart
// @access  Private/User
const getLoggedUserCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "cartItem.product",
    select: "title description",
  });

  if (cart) {
    cart = await updateCartWithLatest(cart);
    await cart.save();
  }
   


  res.status(200).json({
    status: "success",
    numOfCartItems: cart?.cartItem.length || 0,
    data: cart || [],
  });
});

// @desc    Get logged user cart
// @route   GET /api/v1/cart
// @access  Private/User
const getLoggedUserCartForCheckout = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "cartItem.product",
    select: "title description",
  });

  if (cart) {
    cart = await updateCartWithLatest(cart);
    await cart.save();
  }
   

  res.status(200).json({
    status: "success",
    numOfCartItems: cart?.cartItem.length || 0,
    data: cart || [],
  });
});

// @desc    Add product to  cart
// @route   POST /api/v1/cart
// @access  Private/User
const addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, variantId, qty } = req.body;

  const product = await Product.findOne({ _id: productId });
  if (!product) {
    return next(new ApiError(`Product not found with id ${productId}`, 404));
  }

  // get the variantObj to get details info
  const variantObj = product.variant.find(
    (variant) => variant._id.toString() === variantId
  );
  if (!variantObj) {
    return next(
      new ApiError(`Product variant not found with id ${variantId}`, 404)
    );
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    // make sure the qty is less than stock of this product
    // هذا احتياطي لانه انا اصلا في صفحة تفاصيل المنتج مابخلي الزر يشتغل اذا بيضيف اكثر من الذي بالمخزن

    if (variantObj.stockQuantity === 0) {
      return next(new ApiError(`out of stock`, 404));
    } else if (variantObj.stockQuantity < qty) {
      return next(
        new ApiError(
          ` you can not add more than ${variantObj.stockQuantity} of this product in your cart `,
          404
        )
      );
    }

    cart = await Cart.create({
      user: req.user._id,
      cartItem: [
        {
          product: productId,
          variant: variantId,
          store: product.store,
          quantity: qty,
          snapshot: {
            productName: product.title,
            variantName: variantObj.variantTitle,
            price: variantObj.isSale ? variantObj.salePrice : variantObj.price,
            imageCover: {
              url: variantObj.imageCover.url,
              public_id: variantObj.imageCover.public_id,
            },
            shippingFeeMethod: product.shippingFeeMethod,
          },
        },
      ],
    });

    // calculate the shippingFee & additionalFee for cartItem obj
    const { shippingFeeValue, additionalFeeValue } =
      await calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails(
        cart.cartItem[0]
      );
    cart.cartItem[0].shippingFee = shippingFeeValue;
    cart.cartItem[0].additionalFee = additionalFeeValue;
  } else {
    const cartItemObj = cart.cartItem.find(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId
    );
    if (cartItemObj) {
      // make sure qty + quantity is less than stockQuantity
      if (variantObj.stockQuantity < qty + cartItemObj.quantity) {
        return next(
          new ApiError(
            `you can not add more than ${variantObj.stockQuantity - cartItemObj.quantity} of this product in your cart `,
            404
          )
        );
      }

      cartItemObj.quantity += qty;
      // calculate the shippingFee & additionalFee for cartItem obj
      const { shippingFeeValue, additionalFeeValue } =
        await calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails(
          cartItemObj
        );
      cartItemObj.shippingFee = shippingFeeValue;
      cartItemObj.additionalFee = additionalFeeValue;
    } else {
      // make sure the qty is less than stock of this product
      // هذا احتياطي لانه انا اصلا في صفحة تفاصيل المنتج مابخلي الزر يشتغل اذا بيضيف اكثر من الذي بالمخزن
      if (variantObj.stockQuantity === 0) {
        return next(new ApiError(`out of stock`, 404));
      } else if (variantObj.stockQuantity < qty) {
        return next(
          new ApiError(
            ` you can not add more than ${variantObj.stockQuantity} of this product in your cart `,
            404
          )
        );
      }

      cart.cartItem.push({
        product: productId,
        variant: variantId,
        store: product.store,
        quantity: qty,
        snapshot: {
          productName: product.name,
          variantName: variantObj.variantName,
          price: variantObj.isSale ? variantObj.salePrice : variantObj.price,
          imageCover: {
            url: variantObj.imageCover.url,
            public_id: variantObj.imageCover.public_id,
          },
          shippingFeeMethod: product.shippingFeeMethod,
        },
      });
      // calculate the shippingFee & additionalFee for cartItem obj
      const lengthOfCartItem = cart.cartItem.length;
      const lastCartItemObj = cart.cartItem[lengthOfCartItem - 1];
      const { shippingFeeValue, additionalFeeValue } =
        await calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails(
          lastCartItemObj
        );

      lastCartItemObj.shippingFee = shippingFeeValue;
      lastCartItemObj.additionalFee = additionalFeeValue;
    }
  }

  // calculate the shippingFee for each cartItem + total shippingFees and total price
  const { subTotalValue, shippingFeesValue } =
    calculateTotalPriceWithShippingFee(cart.cartItem);
  cart.subTotal = subTotalValue;
  cart.shippingFees = shippingFeesValue;
  cart.total = subTotalValue + shippingFeesValue;

  const newCart = await cart.save();

  res.status(201).json({
    status: "success",
    numOfCartItems: newCart.cartItem.length,
    data: newCart,
  });
});

// @desc    clear logged user cart
// @route   DELETE /api/v1/cart
// @access  Private/User
const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndDelete({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(`Cart not found with id ${req.user._id}`, 404));
  }

  res
    .status(200)
    .json({ status: "success", message: "Cart removed successfully" });
});

// @desc    Update specific cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Private/User
const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(`Cart not found with id ${req.user._id}`, 404));
  }

  const findIndex = cart.cartItem.findIndex(
    (item) => item._id.toString() === req.params.cartId
  );
  if (findIndex > -1) {
    cart.cartItem[findIndex].quantity = req.body.qty;
  } else {
    return next(
      new ApiError(`Item with id ${req.params.cartId} not found in cart`, 404)
    );
  }

  // calculate TotalPrice and ShippingFees for total cartItem
  const { subTotalValue, shippingFeesValue } =
    calculateTotalPriceWithShippingFee(cart.cartItem);
  cart.subTotal = subTotalValue;
  cart.shippingFees = shippingFeesValue;
  cart.total = subTotalValue + shippingFeesValue;

  const updateCart = await cart.save();

  res.status(200).json({ status: "success", data: updateCart });
});

// @desc    Remove specific cart item
// @route   DELETE /api/v1/cart/:itemId
// @access  Private/User
const removeSpecificCartItem = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItem: { _id: req.params.cartId } },
    },
    { new: true }
  );

  if (!cart) {
    return next(
      new ApiError(`Item with id ${req.params.cartId} not found in cart`, 404)
    );
  }

  // calculate TotalPrice and ShippingFees for total cartItem
  const { subTotalValue, shippingFeesValue } =
    calculateTotalPriceWithShippingFee(cart.cartItem);

  cart.subTotal = subTotalValue;
  cart.shippingFees = shippingFeesValue;
  cart.total = subTotalValue + shippingFeesValue;

  await cart.save();

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.cartItem.length,
    message: "Item removed successfully from cart",
  });
});

// @desc    remove Multi Cart Item
// @route   DELETE /api/v1/cart/remove-multi-cartItem
// @access  Private/User
const removeMultiCartItem = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({user: req.user._id})
  if (!cart) {
    return next(
      new ApiError(`cart with user id ${req.user._id} not found `, 404)
    );
  }

  cart.cartItem = cart.cartItem.filter(
    (cartItemObj) => !req.body.cartItemIds.includes(cartItemObj._id.toString())
  );

  // calculate TotalPrice and ShippingFees for total cartItem
  const { subTotalValue, shippingFeesValue } =
    calculateTotalPriceWithShippingFee(cart.cartItem);

  cart.subTotal = subTotalValue;
  cart.shippingFees = shippingFeesValue;
  cart.total = subTotalValue + shippingFeesValue;

  await cart.save();

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.cartItem.length,
    message: "multiItem removed successfully from cart",
  });
});



// @desc    Apply coupon on logged user cart
// @route   PUT /api/v1/cart/applyCoupon
// @access  Private/User
const applyCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findOne({
    name: req.body.name,
    start: { $lt: Date.now() },
    expire: { $gt: Date.now() },
  }).populate("store");
  if (!coupon) {
    return next(new ApiError("Coupon not found or expired", 404));
  }

  // check if the user applied this coupon before
  const couponUsage = await CouponUsage.findById({
    _id: coupon._id,
    user: req.user._id,
  });
  if (couponUsage) {
    return next(
      new ApiError("you applied this coupon before only one time allowed", 404)
    );
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError("Cart not found", 404));
  }

  // get NewTotalPrice After CouponDiscount
  const { newTotal, discountedAmount } = getNewTotalPriceAfterCouponDiscount(
    coupon,
    cart
  );
  cart.total = newTotal;

  // save name of coupon in cart
  cart.appliedCoupon = req.body.name;

  const updateCart = await cart.save();

  res.status(200).json({
    message: `Coupon applied successfully. Discount: -$${discountedAmount.toFixed(2)} applied to items from ${coupon.store.name}.`,
    numOfCartItems: updateCart.cartItem.length,
    data: updateCart,
  });
});

// @desc    remove coupon on logged user cart
// @route   PUT /api/v1/cart/removeCoupon
// @access  Private/User
const removeCoupon = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError("Cart not found", 404));
  }

  if (!cart.appliedCoupon) {
    return next(new ApiError("there is no coupon apply to remove", 404));
  }
  cart.appliedCoupon = null;

  await cart.save();

  res.status(200).json({
    status: "coupon is removed successfully",
    data: cart,
  });
});

module.exports = {
  calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails,
  calculateTotalPriceWithShippingFee,
  updateCartWithLatestForCheckout,
  getNewTotalPriceAfterCouponDiscount,
  getLoggedUserCart,
  getLoggedUserCartForCheckout,
  addProductToCart,
  clearCart,
  updateCartItemQuantity,
  removeSpecificCartItem,
  applyCoupon,
  removeCoupon,
  removeMultiCartItem
};
