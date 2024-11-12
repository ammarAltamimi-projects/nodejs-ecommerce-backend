const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Country = require("../models/countryModel")
const ShippingRate = require("../models/shippingRateModel")
const {

  createOne,
  updateOne,
} = require("../middlewares/handlersFactoryMiddleware");

// @desc    Add or update shipping rate 
// @route   POST /api/v1/shippingRate
// @access  Protected/seller
exports.createOrUpdateShippingRate = asyncHandler(async (req, res, next) => {

  // there ate two ways 
  // first ways 
  // const isShippingRateExists = await ShippingRate.findOne({ 
  //   store: req.body.store,
  //   country: req.body.country
  // }); ;
  // if (!isShippingRateExists) {

  //   return createOne(ShippingRate)(req, res, next);
  // }

  // const updatedDocument = await ShippingRate.findOneAndUpdate(
  //   {country:req.body.country,store: req.body.store},
  //    req.body,
  //   { new: true }
  // );
  
  // if (!updatedDocument) {
  //   return next(
  //     new ApiError(
  //       `there is no ${ShippingRate.modelName} with id ${req.body.country}`,
  //       404
  //     )
  //   );
  // }


  // second ways 
  const updatedDocument = await ShippingRate.findOneAndUpdate(
    {country:req.body.country,store: req.body.store},
     req.body,
    { new: true, upsert: true } // إنشاء إذا لم يوجد
  );
  

  res.status(200).json({ states: "success", data: updatedDocument });


});



// @desc    Get shipping Rate(each country) for specific store
// @route   GET /api/v1/shipping-rate/storeId
// @access  Protected/seller
exports.getShippingRate = asyncHandler(async (req, res, next) => {
  const {id} = req.params

 const countries = await Country.find(); 
 if(!countries){
  return next(new ApiError(`countries not found`, 404));
}

 const shippingRate = await ShippingRate.find({store:id});


 const countryWithShippingRate =  countries.map((country)=> {
const countryShippingRate = shippingRate.find((item)=>item.country.toString() ===country._id.toString())


return {
  storeId:id,
  countryId:country._id,
  country : country.name,
  returnPolicy: countryShippingRate?.returnPolicy || "default",
  shippingService: countryShippingRate?.shippingService || "default",
  shippingFeePerItem: countryShippingRate?.shippingFeePerItem || null , // because its number i can make string as value
  shippingFeeForAdditionalItem: countryShippingRate?.shippingFeeForAdditionalItem || null ,
  shippingFeePerKg: countryShippingRate?.shippingFeePerKg || null ,
  shippingFeeFixed: countryShippingRate?.shippingFeeFixed || null ,
  deliveryTimeMin: countryShippingRate?.deliveryTimeMin || null ,
  deliveryTimeMax: countryShippingRate?.deliveryTimeMax || null ,
}

 });

 res.status(200).json({
  status: "success",
  countryWithShippingRate: countryWithShippingRate,
});

});