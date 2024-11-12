const mongoose = require("mongoose");

const homePageSettingsSchema = new mongoose.Schema(
  {
    _id:{
      type: String,
      default : "homepage_settings"
    },
    section :[{
      type :{
        type:String,
        enum : ["Featured Categories","Featured Subcategories","Featured Stores","Featured OfferTags","Featured Brands","Top Sales Products","Most Popular Products","Highest Rated Products"],
        required:[true , "type is required"]
      },
      displayMode:{
        type:String,
        enum:["standalone","withSubcategories","withProducts"],
        required:[true , "displayMode is required"]

      },
      isActive:{
        type:Boolean,
        default:true
      },
      order : {
        type:Number,
        required:[true , "order is required"]
      },
      limit:{
        type:Number,
        required:[true , "limit is required"]
      },
      // optional but required if displayMode is withProducts 
      productLimit :{
        type:Number
      },
      // optional but required if displayMode is withSubcategories 
      subcategoryLimit :{
        type:Number
      },
    }]

},
{
  timestamps: true,
});

const homePageSettingsModel = mongoose.model("HomePageSettings", homePageSettingsSchema);

module.exports = homePageSettingsModel;
