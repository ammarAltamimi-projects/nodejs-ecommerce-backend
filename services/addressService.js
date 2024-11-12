const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Address = require("../models/addressModel");
const {
  getAll,
  createOne,
  updateOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");


// address belongs to my user (get)
exports.createFilterObj = asyncHandler((req, res, next) => {
  if (req.user._id) {
    req.filterObj = { user: req.user._id };
  }

  next();
});


// Nested route (Create) for my  user or

exports.setUserIdToBody = asyncHandler((req, res, next) => {
  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  next();
});


// @desc    Get logged user addresses list
// @route   GET /api/v1/addresses
// @access  Protected/User
exports.getLoggedUserAddresses = getAll(Address)

// @desc    Add address to my  user
// @route   POST /api/v1/addresses
// @access  Protected/User
exports.addToAddress = createOne(Address)

// @desc    update address belongs to my user
// @route   UPDATE /api/v1/addresses/:addressId
// @access  Protected/User
exports.updateAddress = updateOne(Address)


// @desc    Remove address  belongs to my user
// @route   DELETE /api/v1/addresses/:addressId
// @access  Protected/User
exports.deleteAddress = deleteOne(Address)



// @desc    Update address to be default 
// @route   PUT /api/v1/addresses/:id/ UpdateDefaultAddress
// @access  Protected/User
exports.updateToDefaultAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findByIdAndUpdate(
    req.params.addressId,
    {
      defaultAddress: true,
    },
    { new: true }
  );

  if (!address) {
    return next(
      new ApiError(`address not found with id ${req.params.addressId}`, 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: address,
  });
});