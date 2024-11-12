const mongoose = require("mongoose");
const cloudinary = require("../utils/cloudinary");
const Store = require("./storeModel");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "review title required"],
      minlength: [2, "too short review title"],
      maxlength: [200, "too long review title"],
    },
    ratings: {
      type: Number,
      required: [true, "ratings required"],
      min: [1, "minimum rating is 1"],
      max: [5, "maximum rating is 5"],
    },
    anonymousComment:{
      type:Boolean,
      default:false
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "user required"],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "product required"],
    },
    variant: {
      type: mongoose.Schema.ObjectId,
      required: [true, "varaint required"],
    },
    images:[ {
      url: {type:String},      
      public_id:{type:String},  
    }],
    userLiked:[ {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    }],
  },
  { timestamps: true }
);













// Static method to calculate average ratings and quantity
reviewSchema.statics.calcAverageRatingsAndQuantity = async function (productId) {
  // make the operations for calcAverageRatingsAndQuantity
  const reviewResultForSpecificProduct = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$ratings" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

    const Product = mongoose.model("Product");
  
  let product;
  // you will say there is no need of this condition because i get productId from review so when i search about review that belongs to this productId there will be one review at least which review that i take productId from it
  // but this wrong because for example if i have one review fot this productId and i remove it  so i will get productId from deleted review and will i search bout review that belongs to this productId when be no result because i delete last review
  // so condition important 

  // save ratingsQuantity , avgRating to product Model
  if (reviewResultForSpecificProduct.length > 0) {

    product = await Product.findByIdAndUpdate(productId, {
      ratingAverage: reviewResultForSpecificProduct[0].avgRating,
      ratingQuality: reviewResultForSpecificProduct[0].ratingsQuantity,
    }, { new: true });
  }
  // if there is no review belongs to this product then ratingAverage and ratingQuality is Zero
  else {

    product = await Product.findByIdAndUpdate(productId, {
      ratingAverage: 0,
      ratingQuality: 0,
    }, { new: true });
  }

  // we have two ways to calculate the  ratingAverage and ratingQuality of store 
  // 1 ---> ratingAverage and ratingQuality of store calculated by ratingQuality,ratingAverage of products that belongs to this store(wrong ways) :
  // this ways does not give the correct values in some senario and al another senario give correct value
  // for example product A have 5 review of 4 value and product B have 1 review of 5 value (first way give wrong value)
// steps of first way
  // now i need to calculate ratingAverage and ratingQuality of the store that ratingAverage and ratingQuality of its product have changed so now i need
  // 1 get storeId that this product belongs to
  // 2 make aggregate fot that product using match storeId and group
  // 3 here  i will get store that have StoreId and edit the value of ratingAverage and ratingQuality
  // const {store} = product;
  // const productResult = await Product.aggregate([
  //   {
  //     $match: { store: store },
  //   },
  //   {
  //     $group: {
  //       _id: "$store",
  //       avgRating: { $avg: "$ratingAverage" },
  //       ratingsQuantity: { $sum: "$ratingQuality" },
  //     },
  //   },
  // ]);

  // // save ratingsQuantity , avgRating to store Model
  // if (productResult.length > 0) {
    
  //   await Store.findByIdAndUpdate(store, {
  //     ratingAverage: productResult[0].avgRating,
  //     ratingQuality: productResult[0].ratingsQuantity,
  //   }, { new: true });  
  // }
  // // if there is no products belongs to this store  then ratingAverage and ratingQuality is Zero
  // else {
  //   await Store.findByIdAndUpdate(store, {
  //     ratingAverage: 0,
  //     ratingQuality: 0,
  //   }, { new: true });  
  // }

  // -------------------------

   // 2 ---> ratingAverage and ratingQuality of store calculated by reviews of all products that belongs to storeId  :
  // steps of second way
  //1.  get storeId that this product belongs to
  // 2. get products belongs   belongs to this storeId and then productsId in array of ref
  // 3 make aggregate and get reviews belongs to productsId and then calculate ratingAverage and ratingQuality
  //4.  edit the ratingAverage and ratingQuality of store
   const {store} = product;
   const products = await Product.find({store:store});
   const productIds = products.map((p)=> p._id)
   const reviewResultForStoreProduct = await this.aggregate([
    {
      $match: { product: {$in:productIds} },
    },
    {
      $group: {
        _id: "null",
        avgRating: { $avg: "$ratings" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  // save ratingsQuantity , avgRating to store Model
  if (reviewResultForStoreProduct.length > 0) {
    
    await Store.findByIdAndUpdate(store, {
      ratingAverage: reviewResultForStoreProduct[0].avgRating,
      ratingQuality: reviewResultForStoreProduct[0].ratingsQuantity,
    }, { new: true });  
  }
  // if there is no review belongs to all these productIds  then ratingAverage and ratingQuality is Zero
  else {
    await Store.findByIdAndUpdate(store, {
      ratingAverage: 0,
      ratingQuality: 0,
    }, { new: true });  
  }






}
// Post-save hook
reviewSchema.post("save", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.product);
});

// Post-remove hook
reviewSchema.post("remove", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.product);
});

// Pre-find hook to populate user data
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name" });
  next();
});


reviewSchema.pre("findOneAndDelete", async function (next) {
  const review = await this.model.findOne(this.getQuery());

  if (review) {
    // delete image for review from cloudinary
    await Promise.all(
      review.images.map(async(image)=>{
        await cloudinary.uploader.destroy(image.public_id);
      })
    )

    
  }
  next();
});

const reviewModel = mongoose.model("Review", reviewSchema);

module.exports = reviewModel;
