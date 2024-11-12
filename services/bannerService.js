const { updateOne,getOne } = require("../middlewares/handlersFactoryMiddleware");
const Banner = require("../models/bannerModel")
const {
  uploadAnyImages,
} = require("../middlewares/uploadImageMiddleware");

exports.uploadBannerImage = uploadAnyImages("banners");

exports.setBannerIdToParams = (req, res, next) => {
  req.params.id = "banner";
  next();
};

// @desc    get banner details
// @route   GET /api/v1/home-page-settings
// @access  Public
exports.getBanners =getOne(Banner)

// @desc    Update banner
// @route   PUT /api/v1/banner
// @access  Private/Admin
exports.updateBanner = updateOne(Banner);
