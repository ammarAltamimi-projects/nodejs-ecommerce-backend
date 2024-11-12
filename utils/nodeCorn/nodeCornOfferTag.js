const cron = require("node-cron");
const OfferTag = require("../../models/offerTagModel");
const Product = require("../../models/productModel");

cron.schedule("0 0 * * *", async () => {
  const offerTag = await OfferTag.findOne({ expire: { $lt: Date.now() } });

  if (offerTag) {
    const products = await Product.find({ offerTag: offerTag._id });
    products.forEach(async (product) => {
      product.isSale = false;
      product.offerTag = undefined;
      product.variant.map(async (variantObj) => {
        variantObj.salePrice = null;
      });
    });

    await Promise.all(products.map(async (product) => await product.save()));
  }
});
