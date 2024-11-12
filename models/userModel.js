const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Cart = require("./cartModel");
const Order = require("./paymentDetailsModel");
const Store = require("./storeModel");
const Review = require("./reviewModel");
const Address = require("./addressModel");
const PaymentDetails = require("./paymentDetailsModel");
const CouponUsage = require("./couponUsageModel");
const cloudinary = require("../utils/cloudinary");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "user name required"],
      minlength: [2, "too short user name"],
      maxlength: [32, "too long user name"],
      trim: true,

    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "user email required"],
      unique: [true, "email must be unique"],
    },
    phone: {
      type: String,
    },
    // profileImg : {}
    password: {
      type: String,
      required: [true, "password required"],
      minlength: [8, "too short password"],
      maxlength: [64, "too long password"],
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetCode: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    passwordResetVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "seller","admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    profileImg: {
        url: {type:String},       // The image URL you will use in your app
        public_id:{type:String},  // The public ID for future reference
      },
    wishlist: [
      {
        product:{
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          },
          variant:{
            type: mongoose.Schema.ObjectId,
          },
          snapshot: {
            productName:{
              type: String,
                },
            variantName:{
              type: String,
                },
            price: {
              type: Number,
              min: [0, "price cannot be negative"],
            },
            imageCover: {
              url: { type: String, required: [true, "image URL required"] },
              public_id: { type: String, required: [true, "image public ID required"] },
            }
          }, 
          status: { 
            type: String, 
            enum: ['available', 'unavailable', 'out_of_stock'],
            default: 'available'
          }
      },
    ],
    history: [
      {
        product:{
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          },
          variant:{
            type: mongoose.Schema.ObjectId,
          },
          snapshot: {
            productName:{
              type: String,
                },
            variantName:{
              type: String,
                },
            price: {
              type: Number,
              min: [0, "price cannot be negative"],
            },
            imageCover: {
              url: { type: String, required: [true, "image URL required"] },
              public_id: { type: String, required: [true, "image public ID required"] },
            }
          }, 
          status: { 
            type: String, 
            enum: ['available', 'unavailable', 'out_of_stock'],
            default: 'available'
          }
      },
    ],

 
  },
  { timestamps: true }
);


userSchema.pre("findOneAndDelete", async function (next) {
  const user = await this.model.findOne(this.getQuery());

  if (user) {
   // delete image for user from cloudinary
    await cloudinary.uploader.destroy(user.profileImg.public_id);

    await Cart.deleteMany({ user: user._id });
    await Order.deleteMany({ user: user._id });
    await Review.deleteMany({ user: user._id });
    await Store.deleteMany({ user: user._id });
    await Address.deleteMany({ user: user._id });
    await CouponUsage.deleteMany({ user: user._id });
    await PaymentDetails.deleteMany({ user: user._id });
  }
  next();
});


// Hash the password before saving the user document
userSchema.pre("save", async function (next) {

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
