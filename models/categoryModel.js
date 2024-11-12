const mongoose = require("mongoose");
const Brand = require("./brandModel")
const Product = require("./productModel")
const SubCategory = require("./subCategoryModel")
const cloudinary = require("../utils/cloudinary");

const categoryScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "category  required"],
      unique: [true, " category must  be unique"],
      minlength: [3, "too short category name"],
      maxlength: [32, "too long category name"],
      trim: true,

    },
    slug: {
      type: String,
      lowercase: true,
    },

    featured: {
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

categoryScheme.pre("findOneAndDelete", async function (next) {
  const category = await this.model.findOne(this.getQuery());

  if (category) {
    // delete image for category from cloudinary
    await cloudinary.uploader.destroy(category.image.public_id);
    
    await Brand.deleteMany({ category: category._id });
    await SubCategory.deleteMany({ category: category._id });
    await Product.deleteMany({ category: category._id });
  }
  next();
});

const CategoryModel = mongoose.model("category", categoryScheme);




module.exports = CategoryModel;
