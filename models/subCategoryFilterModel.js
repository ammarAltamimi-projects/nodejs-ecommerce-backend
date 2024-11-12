// const mongoose = require("mongoose");

// const subcategoryFilterSchema = new mongoose.Schema({
//   subCategory: { type: mongoose.Schema.ObjectId, ref: "subCategory"  },
//   options: [{ type: mongoose.Schema.ObjectId, ref: "Option" }], 
// });

// subcategoryFilterSchema.pre(/^find/, function (next) {
//   this.populate("options");
//   next();
// });


// const SubcategoryFilterModel = mongoose.model("SubcategoryFilter", subcategoryFilterSchema);

// module.exports = SubcategoryFilterModel;
