
const mongoose = require("mongoose");
const { calculateVariantPricing } = require("../utils/calculateVariantPricing");
const Review = require("./reviewModel");
const cloudinary = require("../utils/cloudinary");




const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "product required"],
      minlength: [2, "too short product name"],
      maxlength: [32, "too long product name"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "description required"],
      minlength: [10, "too short product description"],
      maxlength: [500, "too long product description"],
    },
    specifications: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
    questions: [
      {
        question: { type: String },
        answers: { type: String },
      },
    ],
    shippingFeeMethod: {
      type: String,
      required: true,
      enum: ["item", "weight", "fixed"],
      default: "item",
    },
    freeShippingForAllCountries: {
      type: Boolean,
      default: false,
    },
    freeShippingForSpecificCountries: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Country",
      },
    ],
    sold: {
      type: Number,
      default: 0,
    },
    returns: {
      type: Number,
      default: 0,
    },
    view: {
      type: Number,
      default: 0,
    },

    ratingAverage: {
      type: Number,
      min: [1, "Rating must be above or equal 1.0"],
      max: [5, "Rating must be below or equal 5.0"],
    },
    ratingQuality: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "category",
      required: [true, "category required"],
    },
    offerTag: {
      type: mongoose.Schema.ObjectId,
      ref: "OfferTag",
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    subCategories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "subCategory",
        required: [true, "subcategory required"],
      },
    ],
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: "brand",
      required: [true, "brand required"],
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: [true, "Store required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    discriminatorKey: "subcategoryType",
    collection: "products",
  }
);

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "name ",
  });
  this.populate({
    path: "store",
  });
  next();
});

// Define virtual field
productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

productSchema.pre(["findOneAndDelete", "deleteMany"], async function (next) {
  const products = await this.model.find(this.getQuery());

  if (products.length > 0) {
    // delete imageCover and images for the stores from cloudinary
    await Promise.all(
      products.map(async (product) => {
        product.variant.map(async (variantObj) => {
          await cloudinary.uploader.destroy(variantObj.imageCover.public_id);
          variantObj.images.map(async (image) => {
            await cloudinary.uploader.destroy(image.public_id);
          });
        });
      })
    );

    const productIds = products.map((p) => p._id);
    await Review.deleteMany({ product: { $in: productIds } });
  }

  next();
});



const productModel = mongoose.model("Product", productSchema);

//discriminator

//phone discriminator

const phoneSchema = new mongoose.Schema({
  variant: [
    {
      defaultVariant: {
        type: Boolean,
        default: false,
      },
      variantTitle: {
        type: String,
        required: [true, "variant title required"],
        minlength: [2, "variant title too short (min 2)"],
        maxlength: [32, "variant title too long (max 32)"],
      },
      variantSlug: {
        type: String,
        unique: true,
        slug: "variantTitle",
      },
      variantDescription: {
        type: String,
        required: [true, "variant description required"],
        minlength: [10, "variant description too short (min 10)"],
        maxlength: [500, "variant description too long (max 500)"],
      },
      variantSpecifications: [
        {
          key: { type: String },
          value: { type: String },
        },
      ],
      keywords: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
      sku: {
        type: String,
        required: [true, "SKU required"],
        unique: true,
      },
      price: {
        type: Number,
        required: [true, "price required"],
        min: [0, "price cannot be negative"],
      },
      originalPrice: {
        type: Number,
        min: [0, "original price cannot be negative"],
      },
      discountPercentage: {
        type: Number,
        min: [0, "discount percentage cannot be negative"],
        max: [100, "discount percentage cannot exceed 100%"],
      },
      salePrice: {
        type: Number,
        min: [0, "salePrice cannot be negative"],
      },
      weight: {
        type: Number,
        required: [true, "weight required"],
        min: [0, "weight cannot be negative"],
      },
      stockQuantity: {
        type: Number,
        required: [true, "quantity required"],
        min: [0, "quantity cannot be negative"],
      },
      ReservedStock:{
        type: Number,
        min: [0, "quantity cannot be negative"],
        default:0
      },
      VariantSold: {
        type: Number,
        default: 0,
      },
      VariantReturns: {
        type: Number,
        default: 0,
      },
      imageCover: {
        url: { type: String , required: [true, "image URL required"]},
        public_id: {
          type: String, required: [true, "image public ID required"],
        },
      },
      images: [
        {
          url: { type: String,  },
          public_id: {
            type: String,
          },
        },
      ],
      color: {
        type: String,
        required: [true, "color required"],
      },
      storageCapacity: {
        type: String,
        required: [true, "storageCapacity required"],
      },
      ramSize: {
        type: String,
        required: [true, "ramSize required"],
      },
      networkType: {
        type: String,
        required: [true, "networkType required"],
      },
      operatingSystem: {
        type: String,
        required: [true, "operatingSystem required"],
      },
      batteryCapacity: {
        type: String,
        required: [true, "batteryCapacity required"],
      },
      screenSize: {
        type: String,
        required: [true, "screenSize required"],
      },
    },
  ],
});
phoneSchema.pre("save", async function (next) {
  //get offerTag if its exits
  const OfferTag = mongoose.model("OfferTag");

  const offerTag = await OfferTag.findById(this.offerTag);

  // Map over each variant to recalculate salePrice and discountPercentage
  this.variant = this.variant.map((variantObj) =>
    calculateVariantPricing(variantObj, offerTag,this)
  );
  next();
});

productModel.discriminator("phone", phoneSchema);

//laptop discriminator

const laptopSchema = new mongoose.Schema({
  variant: [
    {
      defaultVariant: {
        type: Boolean,
        default: false,
      },
      variantTitle: {
        type: String,
        required: [true, "variant title required"],
        minlength: [2, "variant title too short (min 2)"],
        maxlength: [32, "variant title too long (max 32)"],
      },
      variantSlug: {
        type: String,
        lowercase: true,
        unique: true,
      },
      variantDescription: {
        type: String,
        required: [true, "variant description required"],
        minlength: [10, "variant description too short (min 10)"],
        maxlength: [500, "variant description too long (max 500)"],
      },
      variantSpecifications: [
        {
          key: { type: String },
          value: { type: String },
        },
      ],
      keywords: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
      sku: {
        type: String,
        required: [true, "SKU required"],
        unique: true,
      },
      price: {
        type: Number,
        required: [true, "price required"],
        min: [0, "price cannot be negative"],
      },
      originalPrice: {
        type: Number,
        min: [0, "original price cannot be negative"],
      },
      discountPercentage: {
        type: Number,
        min: [0, "discount percentage cannot be negative"],
        max: [100, "discount percentage cannot exceed 100%"],
      },
      salePrice: {
        type: Number,
        min: [0, "salePrice cannot be negative"],
      },
      weight: {
        type: Number,
        required: [true, "weight required"],
        min: [0, "weight cannot be negative"],
      },
      stockQuantity: {
        type: Number,
        required: [true, "quantity required"],
        min: [0, "quantity cannot be negative"],
      },
      ReservedStock:{
        type: Number,
        min: [0, "quantity cannot be negative"],
        default:0
      },
      VariantSold: {
        type: Number,
        default: 0,
      },
      VariantReturns: {
        type: Number,
        default: 0,
      },
      imageCover: {
        url: { type: String, required: [true, "image URL required"] },
        public_id: {
          type: String,
          required: [true, "image public ID required"],
        },
      },
      images: [
        {
          url: { type: String, },
          public_id: {
            type: String,
            
          },
        },
      ],
      color: {
        type: String,
        required: [true, "color required"],
      },
      ramSize: {
        type: String,
        required: [true, "ramSize required"],
      },
      processorBrand: {
        type: String,
        required: [true, "processorBrand required"],
      },
      processorType: {
        type: String,
        required: [true, "processorType required"],
      },
      hardDiskCapacity: {
        type: String,
        required: [true, "hardDiskCapacity required"],
      },
      storageType: {
        type: String,
        required: [true, "storageType required"],
      },
      operatingSystem: {
        type: String,
        required: [true, "operatingSystem required"],
      },
      screenSize: {
        type: String,
        required: [true, "screenSize required"],
      },
    },
  ],
});

laptopSchema.pre("save", async function (next) {
  //get offerTag if its exits
  const OfferTag = mongoose.model("OfferTag");

  const offerTag = await OfferTag.findById(this.offerTag);

  // Map over each variant to recalculate salePrice and discountPercentage
  this.variant = this.variant.map((variantObj) =>
    calculateVariantPricing(variantObj, offerTag,this)
  );
  next();
});
productModel.discriminator("laptop", laptopSchema);

//men discriminator

const menSchema = new mongoose.Schema({
  variant: [
    {
      defaultVariant: {
        type: Boolean,
        default: false,
      },
      variantTitle: {
        type: String,
        required: [true, "variant title required"],
        minlength: [2, "variant title too short (min 2)"],
        maxlength: [32, "variant title too long (max 32)"],
      },
      variantSlug: {
        type: String,
        lowercase: true,
        unique: true,
      },
      variantDescription: {
        type: String,
        required: [true, "variant description required"],
        minlength: [10, "variant description too short (min 10)"],
        maxlength: [500, "variant description too long (max 500)"],
      },
      variantSpecifications: [
        {
          key: { type: String },
          value: { type: String },
        },
      ],
      keywords: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
      sku: {
        type: String,
        required: [true, "SKU required"],
        unique: true,
      },
      price: {
        type: Number,
        required: [true, "price required"],
        min: [0, "price cannot be negative"],
      },
      originalPrice: {
        type: Number,
        min: [0, "original price cannot be negative"],
      },
      discountPercentage: {
        type: Number,
        min: [0, "discount percentage cannot be negative"],
        max: [100, "discount percentage cannot exceed 100%"],
      },
      salePrice: {
        type: Number,
        min: [0, "salePrice cannot be negative"],
      },
      weight: {
        type: Number,
        required: [true, "weight required"],
        min: [0, "weight cannot be negative"],
      },
      stockQuantity: {
        type: Number,
        required: [true, "quantity required"],
        min: [0, "quantity cannot be negative"],
      },
      ReservedStock:{
        type: Number,
        min: [0, "quantity cannot be negative"],
        default:0
      },
      VariantSold: {
        type: Number,
        default: 0,
      },
      VariantReturns: {
        type: Number,
        default: 0,
      },
      imageCover: {
        url: { type: String, required: [true, "image URL required"] },
        public_id: {
          type: String,
          required: [true, "image public ID required"],
        },
      },
      images: [
        {
          url: { type: String,},
          public_id: {
            type: String,
           
          },
        },
      ],
      color: {
        type: String,
        required: [true, "color required"],
      },
      size: {
        type: String,
        required: [true, "size required"],
      },
      material: {
        type: String,
        required: [true, "material required"],
      },
    },
  ],
});
menSchema.pre("save", async function (next) {
  //get offerTag if its exits
  const OfferTag = mongoose.model("OfferTag");

  const offerTag = await OfferTag.findById(this.offerTag);

  // Map over each variant to recalculate salePrice and discountPercentage
  this.variant = this.variant.map((variantObj) =>
    calculateVariantPricing(variantObj, offerTag,this)
  );
  next();
});

productModel.discriminator("men", menSchema);

//women discriminator

const womenSchema = new mongoose.Schema({
  variant: [
    {
      defaultVariant: {
        type: Boolean,
        default: false,
      },
      variantTitle: {
        type: String,
        required: [true, "variant title required"],
        minlength: [2, "variant title too short (min 2)"],
        maxlength: [32, "variant title too long (max 32)"],
      },
      variantSlug: {
        type: String,
        lowercase: true,
        unique: true,
      },
      variantDescription: {
        type: String,
        required: [true, "variant description required"],
        minlength: [10, "variant description too short (min 10)"],
        maxlength: [500, "variant description too long (max 500)"],
      },
      variantSpecifications: [
        {
          key: { type: String },
          value: { type: String },
        },
      ],
      keywords: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
      sku: {
        type: String,
        required: [true, "SKU required"],
        unique: true,
      },
      price: {
        type: Number,
        required: [true, "price required"],
        min: [0, "price cannot be negative"],
      },
      originalPrice: {
        type: Number,
        min: [0, "original price cannot be negative"],
      },
      discountPercentage: {
        type: Number,
        min: [0, "discount percentage cannot be negative"],
        max: [100, "discount percentage cannot exceed 100%"],
      },
      salePrice: {
        type: Number,
        min: [0, "salePrice cannot be negative"],
      },
      weight: {
        type: Number,
        required: [true, "weight required"],
        min: [0, "weight cannot be negative"],
      },
      stockQuantity: {
        type: Number,
        required: [true, "quantity required"],
        min: [0, "quantity cannot be negative"],
      },
      ReservedStock:{
        type: Number,
        min: [0, "quantity cannot be negative"],
        default:0
      },
      VariantSold: {
        type: Number,
        default: 0,
      },
      VariantReturns: {
        type: Number,
        default: 0,
      },
      imageCover: {
        url: { type: String, required: [true, "image URL required"] },
        public_id: {
          type: String,
          required: [true, "image public ID required"],
        },
      },
      images: [
        {
          url: { type: String },
          public_id: {
            type: String,
          
          },
        },
      ],
      color: {
        type: String,
        required: [true, "color required"],
      },
      size: {
        type: String,
        required: [true, "size required"],
      },
      material: {
        type: String,
        required: [true, "material required"],
      },
    },
  ],
});
womenSchema.pre("save", async function (next) {
  //get offerTag if its exits
  const OfferTag = mongoose.model("OfferTag");

  const offerTag = await OfferTag.findById(this.offerTag);

  // Map over each variant to recalculate salePrice and discountPercentage
  this.variant = this.variant.map((variantObj) =>
    calculateVariantPricing(variantObj, offerTag,this)
  );
  next();
});

productModel.discriminator("women", womenSchema);

module.exports = productModel;
