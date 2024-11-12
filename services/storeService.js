const asyncHandler = require("express-async-handler");
const Store = require("../models/storeModel");
const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");
const { uploadFieldsImages } = require("../middlewares/uploadImageMiddleware");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");

// Nested route (Create) for my  user or
exports.setUserIdToBody = asyncHandler((req, res, next) => {

  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  next();
});


exports.uploadStoreImage =  uploadFieldsImages("stores", [
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);


  exports.createFilterObj = async (req, res, next) => {  
    if(req.user.role === "user"){
      req.filterObj = { followingUser: req.user._id };
    }  

    if(req.user.role === "seller"){
      req.filterObj = { user: req.user._id };

    }
    
    next();
  };


// @desc    Get list of store
// @route   GET /api/v1/store
// @access  Public
exports.getStores = getAll(Store);

// @desc    Create store
// @route   POST  /api/v1/store
// @access  Private/seller-user
exports.createStore = createOne(Store);

// @desc    Update specific store
// @route   PUT /api/v1/store/:id
// @access  Private/seller
exports.updateStore = updateOne(Store);

// @desc    Delete specific store
// @route   DELETE /api/v1/store/:id
// @access  Private/Admin - seller
exports.deleteStore = deleteOne(Store);

// @desc    Get specific store by id
// @route   GET /api/v1/store/:slug
// @access  Public
exports.getStore = getOne(Store);

// @desc    Get my followed store
// @route   GET /api/v1/store/followed-store
// @access  Private/user
exports.getLoggedUserFollowedStores =getAll(Store);

// @desc    Update Following User
// @route   PUT /api/v1/store/:id/following-user
// @access  Private/user
exports.updateFollowingUser = asyncHandler(async (req, res, next) =>   {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ApiError(`store not found with id ${req.params.id}`, 404));
  }

  const isFollowed = store.followingUser.includes(req.user._id)
  if(isFollowed){
    store.followingUser.pull(req.user._id)
  }else {
    store.followingUser.addToSet(req.user._id)
  }

await store.save()

  res.status(200).json({
    status: "success",
    data:store
  });

 });


// @desc    Update Store Status
// @route   PUT /api/v1/store/:id/update-status
// @access  Private/admin
exports.updateStoreStatus = asyncHandler(async (req, res, next) => {
  const {status} = req.body

  const store = await Store.findById(req.params.id)
  if(!store){
    return next(new ApiError(`store not found with id ${req.params.id}`, 404));
  } 

  store.status = status
 
  
  if(status === "active"){
    const user = await User.findById(store.user);
    if(!user){
      return next(new ApiError(`user not found with id ${store.user}`, 404));
    } 
    // if role is role convert to seller or you can direct same i as seller
    user.role = user.role==="user" ? "seller" : "seller"
    await user.save()

  }

  await store.save()
  res.status(200).json({
    status: "success",
    data: store,
  });
});
