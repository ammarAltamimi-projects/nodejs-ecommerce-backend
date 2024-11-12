const asyncHandler = require("express-async-handler");
const HomePageSettings = require("../models/homePageSettingsModel");
const ApiError = require("../utils/apiError");
const { updateOne } = require("../middlewares/handlersFactoryMiddleware");
const Category = require("../models/categoryModel")
const SubCategory = require("../models/subCategoryModel")
const Brand = require("../models/brandModel")
const OfferTag = require("../models/offerTagModel")
const Store = require("../models/storeModel")
const Product = require("../models/productModel")

exports.setHomePageIdToParams = (req, res, next) => {
  req.params.id = "homepage_settings";
  next();
};

// @desc    Retrieves dynamic homepage settings configured via the admin dashboard.
//          This includes various sections (e.g., Featured Categories, Featured Stores, etc.) along with their display modes,
//          ordering, and limits for content (such as productLimit and subcategoryLimit)
// @route   GET /api/v1/home-page-settings
// @access  Public
exports.getHomePageSettings = asyncHandler(async (req, res, next) => {
  const homePageSettings = await HomePageSettings.findOne({
    _id: "homepage_settings",
  }).sort("order");
  if (!homePageSettings) {
    return next(new ApiError(`homePageSettings not founded`, 404));
  }

  // get active section and sorted them
  const activeHomePageSettingsSection = homePageSettings.section.filter(
    (sec) => sec.isActive === true
  );
  

  // condition replaced by using obj 
  // const allDisplayModeOptions = {
  //    "standalone" : [0,0], // means no withSubcategories , no withProducts 
  //    "withSubcategories" : [1,0], // mean yes  withSubcategories , no withProducts 
  //    "withProducts" : [0,1]// mean no  withSubcategories , yes withProducts 
  // }

  const data = []
  await Promise.all(
    activeHomePageSettingsSection.map(async(item) => {
      // check for category
      if(item.type === "Featured Categories"){
        // const  displayModeOption = allDisplayModeOptions[item.displayMode];
        const category = await Category.aggregate([
          {
            $match: {featured:true }
          },
          {
            $lookup: {
              from: "subcategories",        
              localField: "_id",
              foreignField: "category",  
              as: "subcategories"      
            }
          },
          {
            $lookup: {
              from: "products",        
              localField: "_id",
              foreignField: "category",  
              as: "products"      
            }
          },
          {
            $project: {
              name:1,
              image:1,
              subcategories: {
                $cond: {
                  if: { $gt: [item.subcategoryLimit, 0] },
                  then: { $slice: ["$subcategories", item.subcategoryLimit] },
                  else: "$$REMOVE" // remove field entirely
                }
              },
              products: {
                $cond: {
                  if: { $gt: [item.productLimit, 0] },
                  then: { $slice: ["$products", item.productLimit] },
                  else: "$$REMOVE" // remove field entirely
                }
              },
             
            }
          },
          {
            $limit: item.limit
          }
        ])
        const detailsInfo = {
          type : item.type,
          order:item.order,
          displayMode:item.displayMode,
          data:category
        }
          data.push(detailsInfo)
      }
      // check for subCategory
      if(item.type === "Featured Subcategories"){
        // const  displayModeOption = allDisplayModeOptions[item.displayMode];
        const subcategory = await SubCategory.aggregate([
          {
            $match: {featured:true }
          },
          {
            $lookup: {
              from: "products",        
              localField: "_id",
              foreignField: "subCategories",  
              as: "products"      
            }
          },
          {
            $project: {
              name:1,
              image:1,
              products: {
                $cond: {
                  if: { $gt: [item.productLimit, 0] },
                  then: { $slice: ["$products", item.productLimit] },
                  else: "$$REMOVE" // remove field entirely
                }
              },            }
          },
          {
            $limit: item.limit
          }
        ])
        const detailsInfo = {
          type : item.type,
          order:item.order,
          displayMode:item.displayMode,
          data:subcategory
        }
          data.push(detailsInfo)
      }
      // check for store
      if(item.type === "Featured Stores"){
        // const  displayModeOption = allDisplayModeOptions[item.displayMode];
        const store = await Store.aggregate([
          {
            $match: {featured:true }
          },
          {
            $lookup: {
              from: "products",        
              localField: "_id",
              foreignField: "store",  
              as: "products"      
            }
          },
          {
            $project: {
              name:1,
              imageCover:1,
              products: {
                $cond: {
                  if: { $gt: [item.productLimit, 0] },
                  then: { $slice: ["$products", item.productLimit] },
                  else: "$$REMOVE" // remove field entirely
                }
              },            }
          },
          {
            $limit: item.limit
          }
        ])
        const detailsInfo = {
          type : item.type,
          order:item.order,
          displayMode:item.displayMode,
          data:store
        }
          data.push(detailsInfo)
      }
      // check for brand
      if(item.type === "Featured Brands"){
        // const  displayModeOption = allDisplayModeOptions[item.displayMode];
        const brand = await Brand.aggregate([
          {
            $match: {featured:true }
          },
          {
            $lookup: {
              from: "products",        
              localField: "_id",
              foreignField: "brand",  
              as: "products"      
            }
          },
          {
            $project: {
              name:1,
              image:1,
              products: {
                $cond: {
                  if: { $gt: [item.productLimit, 0] },
                  then: { $slice: ["$products", item.productLimit] },
                  else: "$$REMOVE" // remove field entirely
                }
              },            }
          },
          {
            $limit: item.limit
          }
        ])
        const detailsInfo = {
          type : item.type,
          order:item.order,
          displayMode:item.displayMode,
          data:brand
        }
          data.push(detailsInfo)
      }
      //check for offer tag
      if(item.type === "Featured OfferTags"){
        // const  displayModeOption = allDisplayModeOptions[item.displayMode];
        const offerTag = await OfferTag.aggregate([
          {
            $match: {featured:true }
          },
          {
            $lookup: {
              from: "products",        
              localField: "_id",
              foreignField: "offerTag",  
              as: "products"      
            }
          },
          {
            $project: {
              name:1,
              products: {
                $cond: {
                  if: { $gt: [item.productLimit, 0] },
                  then: { $slice: ["$products", item.productLimit] },
                  else: "$$REMOVE" // remove field entirely
                }
              },            }
          },
          {
            $limit: item.limit
          }
        ])
        const detailsInfo = {
          type : item.type,
          order:item.order,
          displayMode:item.displayMode,
          data:offerTag
        }
          data.push(detailsInfo)
      }
            // check forHighest Rated Products
      if(item.type === "Highest Rated Products"){
      const highestRatedProducts = await Product.find().sort("ratingAverage").limit(item.limit)
      const detailsInfo = {
        type : item.type,
        order:item.order,
        displayMode:item.displayMode,
        data:highestRatedProducts
      }
      
        data.push(detailsInfo)

      }
      // check for Most Popular Products
      if(item.type === "Most Popular Products"){
        const mostPopularProducts = await Product.find().sort("view").limit(item.limit)
        const detailsInfo = {
          type : item.type,
          order:item.order,
          displayMode:item.displayMode,
          data:mostPopularProducts
        }
          data.push(detailsInfo)
        }
            // check for top sale product
      if(item.type === "Top Sales Products"){
        const topSalesProducts = await Product.find().sort("sold").limit(item.limit)
        const detailsInfo = {
          type : item.type,
          order:item.order,
          displayMode:item.displayMode,
          data:topSalesProducts
        }
          data.push(detailsInfo)
        }
    })
  
  )

  const orderedData = data.sort((a,b)=> a.order - b.order);

  res.status(200).json({ states: "success" , data:orderedData});
});

// @desc    Update c homepage settings
// @route   PUT /api/v1/home-page-settings
// @access  Private/Admin
exports.updateHomePageSettings = updateOne(HomePageSettings);
