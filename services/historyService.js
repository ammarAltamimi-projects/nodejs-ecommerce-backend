const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const Product = require("../models/productModel");

async function updateHistoryWithLatest(history) {
  // >> update the cart item
  const updatedHistory = await Promise.all(
    history.map(async (historyObj) => {
      // 1. Check if all references exist; if not, mark status as "unavailable".

      // Check product reference
      const product = await Product.findOne({ _id: historyObj.product });
      if (!product) {
        historyObj.status = "unavailable";
        return historyObj;
      }
      // Check variant reference
      const variant = product.variant.find(
        (item) => item._id.toString() === historyObj.variant.toString()
      );
      if (!variant) {
        historyObj.status = "unavailable";
        return historyObj;
      }

      // 2. Check if the variant is out of stock
      if (variant.stockQuantity === 0) {
        historyObj.status = "out_of_stock";
        return historyObj;
      }

      //3. this steps is important for this senario which is if varaint of of stock so we enter variant.stockQuantity === 0 condition and the state will be  "out_of_stock";
      // so if admin add stock to this variant then we will not enter any condition right but we dont update the statue so you should say i does not enter any condition then is available
      historyObj.status = "available";

      //4. check the reset of keys that are related to the ref

      // A. Product-related keys
      historyObj.snapshot.productName = product.title;
      // B. Variant-related keys
      historyObj.snapshot.variantName = variant.variantTitle;
      historyObj.snapshot.price = variant.isSale
        ? variant.salePrice
        : variant.price;
        historyObj.snapshot.imageCover = variant.imageCover;

      return historyObj; // Return the updated object
    })
  );

  return updatedHistory;
}

// @desc    Get logged user history
// @route   GET /api/v1/history
// @access  Protected/User
exports.getHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id }).populate(
    "history.product"
  );
  if (!user) {
    return next(new ApiError(`User not found with id ${req.user._id}`, 404));
  }
  
  const updateHistory= await updateHistoryWithLatest(user.history);

  res
    .status(200)
    .json({
      status: "success",
      result: updateHistory.length,
      data: updateHistory,
    });
});

// @desc    Add product to history
// @route   POST /api/v1/history
// @access  Protected/User
exports.addToHistory = asyncHandler(async (req, res, next) => {
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


  // i need to add in the first of the array
  user.history.unshift({
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

// now i need to do things 
//1. remove deplicated but i need to remove old one i mean if [1,2,3,1] i need to remove 1 on 3 index which set doning that
//(note if i make fun before unshift to prevent add the product that in array will not be my idea because my idea to add and then show the last product added and remove old one)
//2 now we should get the fisrt 10 product which ;ast 10 product add to history 

// remove deplicated 
console.log();

let uniqueHistoryArray = user.history.filter(
  (obj, index, self) =>
    index === self.findIndex((o) => o.product.toString() === obj.product.toString() && o.variant.toString() === obj.variant.toString() )
);

// get first 10 product and save in db 
user.history = uniqueHistoryArray.filter((obj,index)=> index <= 9)


  await user.save();

  res.status(200).json({
    status: "success",
    result: user.history.length,
    data: user.history,
  });
});

// @desc    Remove product from history
// @route   DELETE /api/v1/history/:productId
// @access  Protected/User
exports.deleteHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { history: { _id: req.params.historyId } },
    },
    { new: true }
  );

  if (!user) {
    return next(new ApiError(`User not found with id ${req.user._id}`, 404));
  }
  res.status(200).json({
    status: "success",
    message: "product  is removed successfully from history",
  });
});

// @desc    clear logged History
// @route   DELETE /api/v1/history
// @access  Private/User
exports.clearHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return next(new ApiError(`user not found with id ${req.user._id}`, 404));
  }
  user.history = [];
  await user.save();
  res
    .status(200)
    .json({ status: "success", message: "history removed successfully" });
});
