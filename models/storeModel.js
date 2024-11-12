const mongoose = require("mongoose");

const Coupon = require("./countryModel")
const Product = require("./productModel")
const ShippingRate = require("./shippingRateModel")
const cloudinary = require("../utils/cloudinary");

const storeScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "store  required"],
      unique: [true, " store must  be unique"],
      minlength: [3, "too short store name"],
      maxlength: [32, "too long store name"],
      trim: true,

    },

    description: {
      type: String,
      required: [true, "description required"],
      minlength: [10, "too short store description"],
      maxlength: [500, "too long store description"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "store email required"],
      unique: [true, "email must be unique"],
    },
    phone: {
      type: String,
    },
    featured : {
      type:Boolean,
      default:false
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
    status: {
      type: String,
      enum: ["pending","active", "banned","disabled" ],
      default: "pending",
    },

    // owner of this store
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "user required"],
    },
    // users following this user
    followingUser:[{
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "user required"],
    }],

    images:  [ {
      url: {type:String,required:true},      
      public_id:{type:String,required:true},  
    }],
    imageCover:  {
        url: {type:String,required:true},       // The image URL you will use in your app
        public_id:{type:String,required:true},  // The public ID for future reference
      },


  //default shipping 
  defaultReturnPolicy: {
    type: String,
    default:"Return in 30 days",
  },
  defaultShippingService: {
    type: String,
    default:"International Delivery",
  },
  defaultShippingFeePerItem: {
    type: Number,
    default: 0,
  },
  defaultShippingFeeForAdditionalItem: {
    type: Number,
    default: 0,
  },
  defaultShippingFeePerKg: {
    type: Number,
    default: 0,
  },
  defaultShippingFeeFixed: {
    type: Number,
    default: 0,
  },
  defaultDeliveryTimeMin: {
    type: Number,
    default: 7,
  },
  defaultDeliveryTimeMax: {
    type: Number,
    default: 31,
  },

  },
  
  { timestamps: true }
);

storeScheme.pre(["findOneAndDelete", "deleteMany"], async function (next) {
  const stores = await this.model.find(this.getQuery()); 
  

  if (stores.length > 0) {
        // delete imageCover and images for the stores from cloudinary
        await Promise.all(
          stores.map(async(store)=>{
            await cloudinary.uploader.destroy(store.imageCover.public_id);
            store.images.map(async(image)=>{
              await cloudinary.uploader.destroy(image.public_id);

            })
      
          })
        )
    

    const storeIds = stores.map((p) => p._id);
    await Coupon.deleteMany({ store: { $in: storeIds } });
    await Product.deleteMany({ store: { $in: storeIds } });
    await ShippingRate.deleteMany({ store: { $in: storeIds } });

  }

  next();
});

storeScheme.pre("save", async function (next) {
  const User = mongoose.model("User");

  if (this.isNew) {
    const user = await User.findById(this.user);
    if (!user) {
      return next(new Error('User not found'));
    }
    this.status = user.role === "seller" ? "active" : "pending";
  }
  next();
});

const StoreModel = mongoose.model("Store", storeScheme);

module.exports = StoreModel;
