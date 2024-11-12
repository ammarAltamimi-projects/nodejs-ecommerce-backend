const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const Product = require("../models/productModel");

async function updateWishlistWithLatest(wishlist) {
  // >> update the cart item
  const updatedWishlist = await Promise.all(
    wishlist.map(async (wishlistObj) => {
      // 1. Check if all references exist; if not, mark status as "unavailable".

      // Check product reference
      const product = await Product.findOne({ _id: wishlistObj.product });
      if (!product) {
        wishlistObj.status = "unavailable";
        return wishlistObj;
      }
      // Check variant reference
      const variant = product.variant.find(
        (item) => item._id.toString() === wishlistObj.variant.toString()
      );
      if (!variant) {
        wishlistObj.status = "unavailable";
        return wishlistObj;
      }

      // 2. Check if the variant is out of stock
      if (variant.stockQuantity === 0) {
        wishlistObj.status = "out_of_stock";
        return wishlistObj;
      }

      //3. this steps is important for this senario which is if varaint of of stock so we enter variant.stockQuantity === 0 condition and the state will be  "out_of_stock";
      // so if admin add stock to this variant then we will not enter any condition right but we dont update the statue so you should say i does not enter any condition then is available
      wishlistObj.status = "available";

      //4. check the reset of keys that are related to the ref

      // A. Product-related keys
      wishlistObj.snapshot.productName = product.title;
      // B. Variant-related keys
      wishlistObj.snapshot.variantName = variant.variantTitle;
      wishlistObj.snapshot.price = variant.isSale
        ? variant.salePrice
        : variant.price;
      wishlistObj.snapshot.imageCover = variant.imageCover;

      return wishlistObj; // Return the updated object
    })
  );

  return updatedWishlist;
}

// @desc    Get logged user wishlist
// @route   GET /api/v1/wishlist
// @access  Protected/User
exports.getWishlists = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id }).populate(
    "wishlist.product"
  );
  if (!user) {
    return next(new ApiError(`User not found with id ${req.user._id}`, 404));
  }
  const updateWishlist = await updateWishlistWithLatest(user.wishlist);

  res
    .status(200)
    .json({
      status: "success",
      result: updateWishlist.length,
      data: updateWishlist,
    });
});

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist
// @access  Protected/User
exports.addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId, variantId } = req.params;

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

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError(`User not found with id ${req.user._id}`, 404));
  }

  const isExists = user.wishlist.find(
    (item) =>
      item.product.toString() === productId &&
      item.variant.toString() === variantId
  );
  if (isExists) {
    return next(new ApiError(`product already exists in wishlist`, 404));
  }
  user.wishlist.push({
    product: productId,
    variant: variantId,

    snapshot: {
      productName: product.title,
      variantName: variantObj.variantTitle,
      price: variantObj.isSale ? variantObj.salePrice : variantObj.price,
      imageCover: {
        url: variantObj.imageCover.url,
        public_id: variantObj.imageCover.public_id,
      },
    },
  });

  // const user = await User.findByIdAndUpdate(
  //   req.user._id,
  //   {
  //     $addToSet: {
  //       wishlist: {
  //         product: productId,
  //         variant:variantId,

  //         snapshot: {
  //           productName: product.title,
  //           variantName: variantObj.variantTitle,
  //           price: variantObj.isSale ? variantObj.salePrice : variantObj.price,
  //           imageCover: {
  //             url: variantObj.imageCover.url,
  //             public_id: variantObj.imageCover.public_id,
  //           },
  //         },
  //       },
  //     },
  //   },
  //   { new: true }
  // );

  await user.save();

  res.status(200).json({
    status: "success",
    result: user.wishlist.length,
    data: user.wishlist,
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Protected/User
exports.deleteWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { wishlist: { _id: req.params.wishlistId } },
    },
    { new: true }
  );

  if (!user) {
    return next(new ApiError(`User not found with id ${req.user._id}`, 404));
  }
  res.status(200).json({
    status: "success",
    message: "product  is removed successfully from wishlist",
  });
});

// @desc    clear logged wishlist
// @route   DELETE /api/v1/wishlists
// @access  Private/User
exports.clearWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new ApiError(`user not found with id ${req.user._id}`, 404));
  }
  user.wishlist = [];
  await user.save();
  res
    .status(200)
    .json({ status: "success", message: "wishlist removed successfully" });
});
