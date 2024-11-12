// const { check } = require("express-validator");
// const {
//   validatorMiddleware,
// } = require("../../middlewares/validatorMiddleware");
// const {
//   validateOption 
// } = require("./customValidator");

// exports.createFilterOptionValidator = [
//   check("name")
//     .notEmpty()
//     .withMessage("filter name is  required")
//     .trim() 
//     .toLowerCase() 
//     .custom((val,{req})=> validateOption (val,req)),
//   check("values").notEmpty().withMessage("enter the values")
//   .trim() 
//   .toLowerCase(),
//   validatorMiddleware,
// ];

// exports.updateFilterOptionValidator = [
//   check("id").isMongoId().withMessage("Invalid filter option id format"),
//     check("name")
//     .optional()
//     .trim() 
//     .toLowerCase()
//     .custom((val,{req})=> validateOption (val,req)),
//     check("values").optional()
//     .trim() 
//     .toLowerCase() ,
//     validatorMiddleware,

// ];

// exports.deleteFilterOptionValidator = [
//   check("id").isMongoId().withMessage("Invalid filter option format"),
//   validatorMiddleware,
// ];

// exports.getFilterOptionValidator = [
//   check("id").isMongoId().withMessage("Invalid filter option format"),
//   validatorMiddleware,
// ];
