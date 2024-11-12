
const { updateOne ,getOne} = require("../middlewares/handlersFactoryMiddleware");
const Footer = require("../models/footerModel")

exports.setFooterIdToParams = (req, res, next) => {
  req.params.id = "footer";
  next();
};

// @desc    get footer
// @route   GET /api/v1/home-page-settings
// @access  Public
exports.getFooter = getOne(Footer)

// @desc    Update footer
// @route   PUT /api/v1/footer
// @access  Private/Admin
exports.updateFooter = updateOne(Footer);
