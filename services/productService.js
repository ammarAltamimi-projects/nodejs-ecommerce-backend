const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const Review = require("../models/reviewModel");
const Brand = require("../models/brandModel");
const OfferTag = require("../models/offerTagModel");
const Store = require("../models/storeModel");
const ApiFeature = require("../utils/apiFeatures");

const {
  getAll,
  createOne,
  deleteOne,
} = require("../middlewares/handlersFactoryMiddleware");
const {
  uploadAnyImages,
} = require("../middlewares/uploadImageMiddleware");
const ApiError = require("../utils/apiError");
const {calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails} = require("./cartService")


exports.uploadProductImage = uploadAnyImages("products");



// @desc    Get list of products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = getAll(Product);


// @desc    Get list of products with its default variant
// @route   GET /api/v1/products/default
// @access  Public
exports.getProductsWithItsDefaultVariant =   asyncHandler(async (req, res) => {
  // no need of following code because i did nested router by req.query method ex. get products belongs to subCategory so will send subCategory by req.query (only to try another ways)
  // let filter = {};
  // if (req.filterObj) {
  //   filter = req.filterObj;
  // }

  const documentsCounts = await Product.countDocuments();
  const Query = Product.find();

  const apiFeatures = new ApiFeature(Query, req.query)
    .filter()
    .sort()
    .limitFields()
    .search(Product.modelName)
    .paginate(documentsCounts);

  const { mongooseQuery, pagination } = apiFeatures;

  const documents = await mongooseQuery;

  //------------------------------------------
  // second part

  // new code i will add here because the above code is the general code for get all 
  // i will get online the default variant to display it i mean after get all products or products that have specific filter they have multi variant here i will get the default variant to display it  
 const newDocuments = documents.filter((product)=>{
    // for each product get the default variant we have two option maybe one variant or nothing can not be two because i make validator for one default variant
    let defaultVariant = product.variant.find((variant)=>variant.defaultVariant === true && variant.stockQuantity > 0)
    if(!defaultVariant){
      // if now variant with default true then get that have stockQuantity > 0 but maybe be more than one so find will get the first one
      defaultVariant =  product.variant.find((variant)=>variant.stockQuantity > 0)
    }

    if(defaultVariant) {
      // we have variant obj we will put in [] because the variant is array of obj
      product.variant = [defaultVariant]
      //return true only for filter on  documents.filter to return this product
      return true
    } 
       // delete products that all variant is outOfStock i will do return false to delete it
        return false
    
  })

  await Promise.all(newDocuments.map((product) => product.save()));
  res
    .status(200)
    .json({
      states: "success",
      result: newDocuments.length,
      data: newDocuments,
      pagination: pagination,
    });
});

// @desc    Get list of related products with its default variant
// @route   GET /api/v1/products/:slug?subCategories = subCategoriesId
// @access  Public
exports.getRelatedProducts =   asyncHandler(async (req, res) => {
  // no need of following code because i did nested router by req.query method ex. get products belongs to subCategory so will send subCategory by req.query (only to try another ways)
  // let filter = {};
  // if (req.filterObj) {
  //   filter = req.filterObj;
  // }
  

  const {slug} = req.params
  const Query = Product.find({ slug: { $ne: slug }}).sort("sold");

  // only i need to apply filter to get products belongs to subCategory
  const apiFeatures = new ApiFeature(Query, req.query).filter();

  const { mongooseQuery } = apiFeatures;

  let documents = await mongooseQuery;

  //check if the products less that 6 products (only i need 6 products displayed)
  if(documents.length < 6){
    const documentsSlug = documents.map((p)=> p.slug)
    //i need new product so i do not need documentsSlug and slug params
    const excludedDocumentIds = [...documentsSlug, slug];
    
    // get category id
    const {category} = documents[0]

    // get how many items remaining to 6
    const remainingProducts = 6 - documents.length
    const categoryProducts = await Product.find({category:category._id , slug:{$nin:excludedDocumentIds}}).limit(remainingProducts)
    
    documents = [...documents , ...categoryProducts]
  }

  //------------------------------------------
  // second part
  // i will get online the default variant to display it i mean after get all products or products that have specific filter they have multi variant here i will get the default variant to display it  
 const newDocuments = documents.filter((product)=>{
    // for each product get the default variant we have two option maybe one variant or nothing can not be two because i make validator for one default variant
    let defaultVariant = product.variant.find((variant)=>variant.defaultVariant === true && variant.stockQuantity > 0)
    if(!defaultVariant){
      // if now variant with default true then get that have stockQuantity > 0 but maybe be more than one so find will get the first one
      defaultVariant =  product.variant.find((variant)=>variant.stockQuantity > 0)
    }

    if(defaultVariant) {
      // we have variant obj we will put in [] because the variant is array of obj
      product.variant = [defaultVariant]
      //return true only for filter on  documents.filter to return this product
      return true
    } 
       // delete products that all variant is outOfStock i will do return false to delete it
        return false
    
  })

  await Promise.all(newDocuments.map((product) => product.save()));


  res
    .status(200)
    .json({
      states: "success",
      result: newDocuments.length,
      data: newDocuments,
    });
});


// @desc    Create product
// @route   POST  /api/v1/products
// @access  Private/seller
exports.createProduct = createOne(Product);

// @desc    Update specific product
// @route   PUT /api/v1/products/:id
// @access  Private/seller
exports.updatedProduct =asyncHandler(async (req, res, next) => {
    
  const updatedDocument = await Product.findByIdAndUpdate(
    req.params.id,
     req.body,
    { new: true }
  );


  if (!updatedDocument) {
    return next(
      new ApiError(
        `there is no ${Product.modelName} with id ${req.params.id}`,
        404
      )
    );
  }

// update the variant by dot because big array of obj can not update by findAndUpdate
  updatedDocument.variant =req.body.variant


  // Trigger "save" event when update document
  await updatedDocument.save();

  res.status(200).json({ states: "success", data: updatedDocument });
});


// @desc    Update OfferTag For Selected Product
// @route   PUT /api/v1/products/add-offerTag
// @access  Private/seller
exports.addOfferTagForSelectedProduct = asyncHandler(async (req, res, next) => {
  const { productsIds, offerTagId } = req.body;
    //  get the offer tag discount Type and discount value 
    const offerTag = await OfferTag.findOne({_id:offerTagId ,saleStartDate:{$lt:Date.now()},saleEndDate:{$gt:Date.now()} })
    if(!offerTag){
      return next(
        new ApiError(
          `offerTag is not found or expired`,
          404
        )
      );
    }

await Promise.all(
  productsIds.map(async(id)=>{
    //1. get the product 
    const product = await Product.findById(id);
    //2. edit offerTag and isSale 
    product.offerTag = offerTagId;
    product.isSale = true;
    //3. get salePrice For Each variant of this product 
    // > make loop for the variant and add salePrice
    product.variant.forEach((variantObj)=>{
      // get price of this variantObj 
      const {price} = variantObj
      // make sure discount value is less than price if discount Type is fixed
      if(offerTag.discountType === 'fixed' && offerTag.discountValue >= price){
         throw new ApiError(`OfferTag discount value should be less than the price for product ${id}`, 404);

      }
      // add salePrice
      variantObj.salePrice = offerTag.discountType === 'fixed' ? variantObj.price - offerTag.discountValue :variantObj.salePrice =  variantObj.price * (1 - offerTag.discountValue / 100);

    })

    await product.save()
  })
) 



  res.status(200).json({ status: "success", message: "offerTag is added successfully to all selected product" });
});



// @desc    Delete specific product
// @route   DELETE /api/v1/products/:id
// @access  Private/seller
exports.deleteProduct = deleteOne(Product);





// @desc    Get specific product by id
// @route   GET /api/v1/products/:slug/:variantSlug
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const {slug,variantSlug} = req.params
  const product = await Product.findOne({slug:slug}).populate("reviews");

  if (!product) {
    return next(
      new ApiError(`there is no product  with id ${slug}`, 404)
    );
  }

  const allVariant = product.variant
  // get product with selected variant
  const variant = product.variant.find((item)=>item.variantSlug === variantSlug)
  product.variant = [variant]
  const variantId = variant._id


  

  // i need selectedOptions options to display them  except reset options
  const selectedOptions = { ...variant.toObject() };
  const excepts = [
    "defaultVariant",
    "variantTitle",
    "variantSlug",
    "variantDescription",
    "variantSpecifications",
    "keywords",
    "sku",
    "price",
    "originalPrice",
    "discountPercentage",
    "isSale",
    "saleEndDate",
    "discountType",
    "discountValue",
    "salePrice",
    "weight",
    "stockQuantity",
    "imageCover",
    "images",
    "_id",
  ];
  excepts.forEach((except) => delete selectedOptions[except]); // now selectedOptions is object of selected options and its value


  // make object have  array of each option with its  options without repeat
  const allOptions = {};
  Object.keys(selectedOptions).forEach((option) => {
    allOptions[option] = [
      ...new Set(allVariant.map((variantObj) => variantObj[option])),
    ];
  });


  // get the Product ShippingFee for this product with variant
  const {_id,store,shippingFeeMethod} = product
  // make obj such as cartItemObj to send to calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails and get the getProductShippingFee
  const ProductShippingFeeObj ={
      product: _id,
      variant: variantId,
      store: store,
      snapshot:{
        shippingFeeMethod:shippingFeeMethod
      }
  }
 const ProductShippingFee = await calculateShippingFeeAndAdditionalFeeAndOtherShippingDetails(ProductShippingFeeObj)



 // get the percentage of each ratingAverage ex. for 1 rating 14% ..ect

 // get num of review belongs to this product 
 const totalReviews = await Review.countDocuments({ product: _id });

 const ratingAveragePercentage = await Review.aggregate([
  {
    $match: {
      product : _id
    }
  },
  {
    $addFields: {
      roundedValue: { $floor: "$ratings" }
    }
  },
  {
    $group: {
      _id: "$roundedValue",
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id : 1,
      count:1,
      percentage: { $multiply: [ { $divide: ["$count", totalReviews] }, 100 ] }
    }
  }
])

  await product.save()
  res.status(200).json({
    states: "success",
    data: product,
    ShippingFee: ProductShippingFee,
    selectedOptions,
    allOptions,
    ratingAveragePercentage
  });
});



// @desc    get Filter Options
// @route   PUT /api/v1/products/:id/filter-options
// @access  Public
exports.getFilterOptionsForProductPage = asyncHandler(async (req, res, next) => {

  // eslint-disable-next-line prefer-destructuring
  const  subcategoryType  = req.params.subcategoryType ; 
  const filterFieldsBySubcategory = {
    phone: ["color","storageCapacity","ramSize","networkType","operatingSystem","batteryCapacity","screenSize",],
    laptop: ["color", "ramSize", "processorBrand", "processorType", "hardDiskCapacity", "storageType", "operatingSystem", "screenSize",],
    men: ["color", "size", "material"],
    women: ["color", "size", "material"],
  };
  

  const  alphabet =  (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
  const num =  (a, b) => {
    const numA = parseInt(a,10);
    const numB = parseInt(b,10);
    return numA - numB;
  };
  const size = (a, b) => {
  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  return sizes.indexOf( a.toUpperCase()) - sizes.indexOf(b.toUpperCase());
};

  

  const fieldsToBeTheFilter = filterFieldsBySubcategory[subcategoryType];


  const filterOptions = {};
  await Promise.all(
    fieldsToBeTheFilter.map(async (field) => {
      filterOptions[field] = await Product.distinct(`variant.${field}`, { subcategoryType });
      
      if (field === "color" || field === "material" || field === "operatingSystem" || field === "processorBrand" || field === "processorType") {
        filterOptions[field].sort(alphabet);
      } else if (field === "size") {
        if (!Number.isNaN(parseInt(filterOptions[field][0], 10))) {
          filterOptions[field].sort(num);
        } else {
          filterOptions[field].sort(size);
        }
      } else {
        filterOptions[field].sort(num);
      }
    })
  );

 const brandsIds = await Product.distinct("brand", {
  subcategoryType,
});
filterOptions.brands = await Brand.find({_id:{$in:brandsIds}}).select("_id name").sort("name")



const offerTagsIds = await Product.distinct("offerTag", {
  subcategoryType,
});
filterOptions.offerTags = await OfferTag.find({_id:{$in:offerTagsIds}}).select("_id name").sort("name")



const storesIds= await Product.distinct("store", {
  subcategoryType,
});
filterOptions.stores = await Store.find({_id:{$in:storesIds}}).select("_id name").sort("name")


const priceRangeResult = await Product.aggregate([
  {
    $match: {
      subcategoryType,
    },
  },
  { $unwind: "$variant" },
  {
    $group: {
      _id: null,
      minPrice: { $min: "$variant.price" },
      maxPrice: { $max: "$variant.price" },
    },
  },
  { $project: { _id: 0, minPrice: 1, maxPrice: 1 } },
]);

filterOptions.priceRange = priceRangeResult[0] || { minPrice: 0, maxPrice: 0 };



  res.status(200).json({ status: "success", data: filterOptions , subcategoryType:subcategoryType});
});


exports.getFilterOptionsForStorePage = asyncHandler(async (req, res, next) => {
//there one point diff from Filter Options For Product Page

//1 for first time one i click in store in main page so we only send storeId  and then display store page with its product
// the problem is in filter i do not know which filter i should display and i have many for phone , clothes , ..... will be not good to display them all
// i can not send random subcategoryType because i do not know if this store have products with this subcategory
// solution is -> get all subcategoryType that storeID have and then choose any one of them to be default subcategoryType

//2 for second time i will send subcategoryType because im now in store product page so when i click in filter i will send subcategoryType

//--------------------------------------------------------------------


// if there is no subcategoryType i should find one by get all subcategoryType belongs to this storeId then choose one of them 
let allSubcategoryType 
if(!req.body.subcategoryType){
   allSubcategoryType = await Product.distinct("subcategoryType", { store:req.params.storeId});   
}



  const  subcategoryType  =req.body.subcategoryType || allSubcategoryType[0]; //if no subcategoryType then will choose from allSubcategoryType
  const filterFieldsBySubcategory = {
    phone: ["color","storageCapacity","ramSize","networkType","operatingSystem","batteryCapacity","screenSize",],
    laptop: ["color", "ramSize", "processorBrand", "processorType", "hardDiskCapacity", "storageType", "operatingSystem", "screenSize",],
    men: ["color", "size", "material"],
    women: ["color", "size", "material"],
  };
  

  const  alphabet =  (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
  const num =  (a, b) => {
    const numA = parseInt(a,10);
    const numB = parseInt(b,10);
    return numA - numB;
  };
  const size = (a, b) => {
  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  return sizes.indexOf( a.toUpperCase()) - sizes.indexOf(b.toUpperCase());
};

  

  const fieldsToBeTheFilter = filterFieldsBySubcategory[subcategoryType];


  const filterOptions = {};
  await Promise.all(
    fieldsToBeTheFilter.map(async (field) => {
      filterOptions[field] = await Product.distinct(`variant.${field}`, { subcategoryType });
      
      if (field === "color" || field === "material" || field === "operatingSystem" || field === "processorBrand" || field === "processorType") {
        filterOptions[field].sort(alphabet);
      } else if (field === "size") {
        if (!Number.isNaN(parseInt(filterOptions[field][0], 10))) {
          filterOptions[field].sort(num);
        } else {
          filterOptions[field].sort(size);
        }
      } else {
        filterOptions[field].sort(num);
      }
    })
  );

 const brandsIds = await Product.distinct("brand", {
  subcategoryType,
});
filterOptions.brands = await Brand.find({_id:{$in:brandsIds}}).select("_id name").sort("name")



const offerTagsIds = await Product.distinct("offerTag", {
  subcategoryType,
});
filterOptions.offerTags = await OfferTag.find({_id:{$in:offerTagsIds}}).select("_id name").sort("name")



const priceRangeResult = await Product.aggregate([
  {
    $match: {
      subcategoryType,
    },
  },
  { $unwind: "$variant" },
  {
    $group: {
      _id: null,
      minPrice: { $min: "$variant.price" },
      maxPrice: { $max: "$variant.price" },
    },
  },
  { $project: { _id: 0, minPrice: 1, maxPrice: 1 } },
]);

filterOptions.priceRange = priceRangeResult[0] || { minPrice: 0, maxPrice: 0 };



  res.status(200).json({ status: "success", data: filterOptions , subcategoryType:subcategoryType});
});

exports.getFilterOptionsForOfferTagPage = asyncHandler(async (req, res, next) => {
  //there one point diff from Filter Options For Product Page
  
  //1 for first time one i click in OfferTag in main page so we only send OfferTagId  and then display OfferTag page with its product
  // the problem is in filter i do not know which filter i should display and i have many for phone , clothes , ..... will be not good to display them all
  // i can not send random subcategoryType because i do not know if this OfferTag have products with this subcategory
  // solution is -> get all subcategoryType that OfferTagId have and then choose any one of them to be default subcategoryType
  
  //2 for second time i will send subcategoryType because im now in OfferTag product page so when i click in filter i will send subcategoryType
  
  //--------------------------------------------------------------------
  
  
  // if there is no subcategoryType i should find one by get all subcategoryType belongs to this OfferTagId then choose one of them 
  let allSubcategoryType 
  if(!req.body.subcategoryType){
     allSubcategoryType = await Product.distinct("subcategoryType", { offerTag:req.params.offerTagId});   
  }
  
  
  
    const  subcategoryType  =req.body.subcategoryType || allSubcategoryType[0]; //if no subcategoryType then will choose from allSubcategoryType
    const filterFieldsBySubcategory = {
      phone: ["color","storageCapacity","ramSize","networkType","operatingSystem","batteryCapacity","screenSize",],
      laptop: ["color", "ramSize", "processorBrand", "processorType", "hardDiskCapacity", "storageType", "operatingSystem", "screenSize",],
      men: ["color", "size", "material"],
      women: ["color", "size", "material"],
    };
    
  
    const  alphabet =  (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
    const num =  (a, b) => {
      const numA = parseInt(a,10);
      const numB = parseInt(b,10);
      return numA - numB;
    };
    const size = (a, b) => {
    const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    return sizes.indexOf( a.toUpperCase()) - sizes.indexOf(b.toUpperCase());
  };
  
    
  
    const fieldsToBeTheFilter = filterFieldsBySubcategory[subcategoryType];
  
  
    const filterOptions = {};
    await Promise.all(
      fieldsToBeTheFilter.map(async (field) => {
        filterOptions[field] = await Product.distinct(`variant.${field}`, { subcategoryType });
        
        if (field === "color" || field === "material" || field === "operatingSystem" || field === "processorBrand" || field === "processorType") {
          filterOptions[field].sort(alphabet);
        } else if (field === "size") {
          if (!Number.isNaN(parseInt(filterOptions[field][0], 10))) {
            filterOptions[field].sort(num);
          } else {
            filterOptions[field].sort(size);
          }
        } else {
          filterOptions[field].sort(num);
        }
      })
    );
  
   const brandsIds = await Product.distinct("brand", {
    subcategoryType,
  });
  filterOptions.brands = await Brand.find({_id:{$in:brandsIds}}).select("_id name").sort("name")
  
  
  
  const storesIds= await Product.distinct("store", {
    subcategoryType,
  });
  filterOptions.stores = await Store.find({_id:{$in:storesIds}}).select("_id name").sort("name")
  
  
  const priceRangeResult = await Product.aggregate([
    {
      $match: {
        subcategoryType,
      },
    },
    { $unwind: "$variant" },
    {
      $group: {
        _id: null,
        minPrice: { $min: "$variant.price" },
        maxPrice: { $max: "$variant.price" },
      },
    },
    { $project: { _id: 0, minPrice: 1, maxPrice: 1 } },
  ]);
  
  filterOptions.priceRange = priceRangeResult[0] || { minPrice: 0, maxPrice: 0 };
  
  
  
    res.status(200).json({ status: "success", data: filterOptions , subcategoryType:subcategoryType});
  });


exports.getFilterOptionsForBrandPage = asyncHandler(async (req, res, next) => {
    //there one point diff from Filter Options For Product Page
    
    //1 for first time one i click in store in main page so we only send BrandId  and then display Brand page with its product
    // the problem is in filter i do not know which filter i should display and i have many for phone , clothes , ..... will be not good to display them all
    // i can not send random subcategoryType because i do not know if this Brand have products with this subcategory
    // solution is -> get all subcategoryType that BrandId have and then choose any one of them to be default subcategoryType
    
    //2 for second time i will send subcategoryType because im now in Brand product page so when i click in filter i will send subcategoryType
    
    //--------------------------------------------------------------------
    
    
    // if there is no subcategoryType i should find one by get all subcategoryType belongs to this BrandId then choose one of them 
    let allSubcategoryType 
    if(!req.body.subcategoryType){
       allSubcategoryType = await Product.distinct("subcategoryType", { store:req.params.brandId});   
    }
    
    
    
      const  subcategoryType  =req.body.subcategoryType || allSubcategoryType[0]; //if no subcategoryType then will choose from allSubcategoryType
      const filterFieldsBySubcategory = {
        phone: ["color","storageCapacity","ramSize","networkType","operatingSystem","batteryCapacity","screenSize",],
        laptop: ["color", "ramSize", "processorBrand", "processorType", "hardDiskCapacity", "storageType", "operatingSystem", "screenSize",],
        men: ["color", "size", "material"],
        women: ["color", "size", "material"],
      };
      
    
      const  alphabet =  (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
      const num =  (a, b) => {
        const numA = parseInt(a,10);
        const numB = parseInt(b,10);
        return numA - numB;
      };
      const size = (a, b) => {
      const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
      return sizes.indexOf( a.toUpperCase()) - sizes.indexOf(b.toUpperCase());
    };
    
      
    
      const fieldsToBeTheFilter = filterFieldsBySubcategory[subcategoryType];
    
    
      const filterOptions = {};
      await Promise.all(
        fieldsToBeTheFilter.map(async (field) => {
          filterOptions[field] = await Product.distinct(`variant.${field}`, { subcategoryType });
          
          if (field === "color" || field === "material" || field === "operatingSystem" || field === "processorBrand" || field === "processorType") {
            filterOptions[field].sort(alphabet);
          } else if (field === "size") {
            if (!Number.isNaN(parseInt(filterOptions[field][0], 10))) {
              filterOptions[field].sort(num);
            } else {
              filterOptions[field].sort(size);
            }
          } else {
            filterOptions[field].sort(num);
          }
        })
      );
    
      const storesIds= await Product.distinct("store", {
        subcategoryType,
      });
      filterOptions.stores = await Store.find({_id:{$in:storesIds}}).select("_id name").sort("name")
      
    
    
    const offerTagsIds = await Product.distinct("offerTag", {
      subcategoryType,
    });
    filterOptions.offerTags = await OfferTag.find({_id:{$in:offerTagsIds}}).select("_id name").sort("name")
    
    
    
    const priceRangeResult = await Product.aggregate([
      {
        $match: {
          subcategoryType,
        },
      },
      { $unwind: "$variant" },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$variant.price" },
          maxPrice: { $max: "$variant.price" },
        },
      },
      { $project: { _id: 0, minPrice: 1, maxPrice: 1 } },
    ]);
    
    filterOptions.priceRange = priceRangeResult[0] || { minPrice: 0, maxPrice: 0 };
    
    
    
      res.status(200).json({ status: "success", data: filterOptions , subcategoryType:subcategoryType});
    });
// exports.updateProductVariant = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;
//   const { variantId, variant } = req.body;

//   const product = await Product.findById(id);

//   if (!product) {
//     return next(
//       new ApiError(`No product with ID ${id} or variant ${variantId}`, 404)
//     );
//   }

//   const updatedObjIndex = product.variant.findIndex(
//     (item) => item._id.toString() === variantId
//   );

//   if (updatedObjIndex === -1) {
//     return next(
//       new ApiError(`No variant with ID ${variantId} found in product`, 404)
//     );
//   }

//   product.variant[updatedObjIndex] = variant;
//   await product.save();

//   res.status(200).json({ status: "success", data: product });
// });
