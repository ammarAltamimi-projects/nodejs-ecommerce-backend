const mongoose = require("mongoose");
const Product = require("./productModel")
const cloudinary = require("../utils/cloudinary");

const brandSchema = new mongoose.Schema(
  {
    category: {
          type: mongoose.Schema.ObjectId,
          ref: "category",
          required: [true, "category required"],
        },
     subCategories: [
          {
            type: mongoose.Schema.ObjectId,
            ref: "SubCategory",
            required: [true, "subcategory required"],
          },
        ],
    name: {
      type: String,
      required: [true, "brand required"],
      unique: [true, "brand must be unique"],
      minlength: [2, "too short brand name"],
      maxlength: [32, "too long brand name"],
      trim: true,

    },
    slug: {
      type: String,
      lowercase: true,
    },
    featured : {
      type:Boolean,
      default:false
    },
    image:  {
      url: {type:String,required:true},       // The image URL you will use in your app
      public_id:{type:String,required:true},  // The public ID for future reference
    }
    
  },
  { timestamps: true }
);

brandSchema.pre(["findOneAndDelete", "deleteMany"], async function (next) {
  const brands = await this.model.find(this.getQuery()); 
  

  if (brands.length > 0) {
    // delete Image for the brands from cloudinary
    await Promise.all(
      brands.map(async(brand)=>{
        await cloudinary.uploader.destroy(brand.image.public_id);
  
      })
    )
    

    const brandIds = brands.map((p) => p._id);
    await Product.deleteMany({ brand: { $in: brandIds } }); ;

  }

  next();
});

const BrandModel = mongoose.model("brand", brandSchema);

module.exports = BrandModel;
