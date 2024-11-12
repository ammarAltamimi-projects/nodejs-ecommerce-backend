const mongoose = require("mongoose");
const Brand = require("./brandModel")
const Product = require("./productModel")
const SubCategoryFilter = require("./subCategoryFilterModel")
const cloudinary = require("../utils/cloudinary");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "subCategory required"],
      minlength: [2, "too short subCategory name"],
      maxlength: [32, "too long subCategory name"],
      unique: [true, "sub category must be unique"],
      trim: true,

    },
    slug: {
      type: String,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "category",
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

subCategorySchema.pre(["findOneAndDelete", "deleteMany"], async function (next) {
  const subCategories = await this.model.find(this.getFilter()); 

  if (subCategories.length > 0) {
    // delete Image for the subCategories from cloudinary
    await Promise.all(
      subCategories.map(async(subCategory)=>{
        await cloudinary.uploader.destroy(subCategory.image.public_id);
  
      })
    )
    

    const subCategoryIds = subCategories.map((p) => p._id);
    await Brand.updateMany(
      { subCategories: { $in: subCategoryIds } }, 
      { $pull: { subCategories: { $in: subCategoryIds } } }
    );
       // Delete Brand that will have empty subCategories after pull
       await Brand.deleteMany({
        subCategories: {$size: 0 }
      })
   await Product.updateMany(
      { subCategories: { $in: subCategoryIds } }, 
      { $pull: { subCategories: { $in: subCategoryIds } } }
    );
    // Delete products that will have empty subCategories after pull
    await Product.deleteMany({
      subCategories: { $size: 0 }
    })
    await SubCategoryFilter.deleteMany({ subCategories: { $in: subCategoryIds } });
  }

  next();
});


const SubCategoryModel = mongoose.model("SubCategory", subCategorySchema);

module.exports = SubCategoryModel;
