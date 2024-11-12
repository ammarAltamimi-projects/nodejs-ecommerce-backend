// const asyncHandler = require("express-async-handler");

// const Option = require("../models/filterOptionModel");
// const {
//   getAll,
//   getOne,
//   updateOne,
//   deleteOne,
// } = require("../middlewares/handlersFactoryMiddleware");
// const ApiError = require("../utils/apiError");

// // @desc    Get list of Option
// // @route   GET /api/v1/options
// // @access  Private/Admin
// exports.getFilterOptions = getAll(Option);

// // @desc    Create option
// // @route   POST  /api/v1/options
// // @access  Private/Admin
// exports.createFilterOption =  asyncHandler(async(req,res,next)=>{
//   const {name , values} = req.body;


//   let filterOptions = await Option.findOne({name:name});
//   if(!filterOptions){
      
//     filterOptions = await Option.create({
//           name:name,
//           values:[values],

//      })       

     
//   }else{
//     // check if new values are already present in the existing options
//     if(filterOptions.values.includes(values)){
      
//       return next(new ApiError("new values are already present in the existing options",404))
//     }
//     filterOptions.values.push(values);
//   }

//   await filterOptions.save();

//   res.status(201).json({ states: "success", data: filterOptions });



// })


// // @desc    Update specific option
// // @route   PUT /api/v1/options/:id
// // @access  Private/Admin
// exports.updateFilterOption = updateOne(Option);

// // @desc    Delete specific option
// // @route   DELETE /api/v1/options/:id
// // @access  Private/Admin
// exports.deleteFilterOption = deleteOne(Option);

// // @desc    Get specific option by id
// // @route   GET /api/v1/options/:id
// // @access  Private/Admin
// exports.getFilterOption = getOne(Option);
