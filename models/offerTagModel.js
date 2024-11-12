const mongoose = require("mongoose");
const Product = require("./productModel");

const offerTagScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "offerTag  required"],
      unique: [true, " offerTag must  be unique"],
      minlength: [3, "too short offerTag name"],
      maxlength: [32, "too long offerTag name"],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    saleStartDate: {
      type: Date,
      required: [true, "offerTag start date required"],
    },
    saleEndDate: {
      type: Date,
      required: [true, "offerTag expiration date required"],
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: [true, "offerTag discount Type required"],
    },
    discountValue: {
      type: Number,
      min: [0, "discount value cannot be negative"],
      required: [true, "offerTag discount  required"],
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

offerTagScheme.pre("findOneAndDelete", async function (next) {
  const offerTag = await this.model.findOne(this.getQuery());

  if (offerTag) {
    const products = await Product.find({offerTag:offerTag._id});
        products.forEach(async(product) => {
            product.isSale = false;
            product.offerTag = undefined;
              product.variant.map(async(variantObj) => {
                variantObj.salePrice = null                    
            })    
        })

        await Promise.all(
          products.map(async (product)=> await product.save())
        )
  }
  next();
});

const OfferTagModel = mongoose.model("OfferTag", offerTagScheme);

module.exports = OfferTagModel;
