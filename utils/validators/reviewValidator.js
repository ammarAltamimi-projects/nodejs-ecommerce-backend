const { check } = require("express-validator");

const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const Product = require("../../models/productModel");
const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");
const {
  ensureDocumentExistsById,
  checkIfUserReviewedProduct,
  validateUserOwnership,
  ensureSubDocumentExistsById
} = require("./customValidator");

exports.validatorProductId = [
 
  check("productId")
    .optional()
    .isMongoId()
    .withMessage("Invalid Product id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Product)),
  validatorMiddleware,
];

exports.createReviewValidator = [
  check("title")
    .notEmpty()
    .withMessage("review title required")
    .isLength({ min: 2 })
    .withMessage("too short product title")
    .isLength({ max: 200  })
    .withMessage("too long product title"),
  check("ratings")
    .notEmpty()
    .withMessage("ratings  required")
    .isFloat({ min: 1, max: 5 })
    .withMessage("ratings between 1 and 5"),
  check("user")
    .isMongoId()
    .withMessage("Invalid user id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, User)),
  check("product")
    .notEmpty()
    .withMessage("product required")
    .isMongoId()
    .withMessage("Invalid product id format")
    .custom((val, { req }) =>ensureDocumentExistsById(val, req, Product))
    .custom(async (productId, { req }) =>
      checkIfUserReviewedProduct(productId, req, Review)
    ),
    check("variant")
    .notEmpty()
    .withMessage("variant required")
    .isMongoId()
    .withMessage("Invalid variant id format")
    .custom((val, { req }) => ensureSubDocumentExistsById(val, req, Product,{_id:req.body.product},"variant")),
  validatorMiddleware,
];

exports.updateReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Review id format")
    .custom(async (reviewId, { req }) =>
      validateUserOwnership(reviewId, req, Review)
    ),
  check("title")
    .optional()
    .isLength({ min: 2 })
    .withMessage("too short review title")
    .isLength({ max: 200  })
    .withMessage("too long review title"),
  check("ratings").optional().isFloat({ min: 1, max: 5 }),
  check("user")
    .optional()
    .isMongoId()
    .withMessage("Invalid user id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, User)),
  check("product")
    .optional()
    .isMongoId()
    .withMessage("Invalid product id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Product))
    .custom(async (productId, { req }) =>
      checkIfUserReviewedProduct(productId, req, Review)
    ),
    check("variant")
    .optional()
    .isMongoId()
    .withMessage("Invalid variant id format")
    .custom((val, { req }) => ensureSubDocumentExistsById(val, req, Product,{_id:req.body.product},"variant")),
  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Review id format")
    .custom(async (reviewId, { req }) => {
      if (req.user.role === "user") {
        await validateUserOwnership(reviewId, req, Review);
      }
      return true;
    }),
  validatorMiddleware,
];

exports.getReviewValidator = [
  check("id").isMongoId().withMessage("Invalid Review id format"),
  validatorMiddleware,
];


exports.updateLikesReviewValidator = [
  check("id")
  .isMongoId()
  .withMessage("Invalid Review id format")
  .custom(async (reviewId, { req }) =>
    validateUserOwnership(reviewId, req, Review)
  ),
  validatorMiddleware,
]