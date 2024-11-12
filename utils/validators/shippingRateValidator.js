const { check } = require("express-validator");
const {
  validatorMiddleware,
} = require("../../middlewares/validatorMiddleware");
const Store = require("../../models/storeModel");
const Country = require("../../models/countryModel");
const ShippingRate = require("../../models/shippingRateModel");
const {
  ensureDocumentExistsById,
  validateUserOwnership,
  isTimeMinLessThanTimeMax
} = require("./customValidator");

const createShippingRateValidator = [
  check("store")
    .notEmpty()
    .withMessage("Store required")
    .custom((val, { req }) => validateUserOwnership(val, req, Store)),
  check("country")
    .notEmpty()
    .withMessage("country required")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Country)),

  check("returnPolicy").notEmpty().withMessage("returnPolicy required"),

  check("shippingService").notEmpty().withMessage("shippingService required"),

  check("shippingFeePerItem")
    .isFloat()
    .notEmpty()
    .withMessage("shippingFeePerItem required"),

  check("shippingFeeForAdditionalItem")
    .isFloat()
    .notEmpty()
    .withMessage("shippingFeeForAdditionalItem required"),

  check("shippingFeePerKg")
    .isFloat()
    .notEmpty()
    .withMessage("shippingFeePerKg required"),

  check("shippingFeeFixed")
    .isFloat()
    .notEmpty()
    .withMessage("shippingFeeFixedrequired"),

  check("deliveryTimeMin")
    .isFloat()
    .notEmpty()
    .withMessage("deliveryTimeMin required")
    .custom((val, { req }) => isTimeMinLessThanTimeMax(val, req)),

  check("deliveryTimeMax")
    .isFloat()
    .notEmpty()
    .withMessage("deliveryTimeMax required"),
];

const updateShippingRateValidator = [
  check("store").custom((val, { req }) =>
    validateUserOwnership(val, req, Store)
  ),
  check("country")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Country)),

  check("returnPolicy").optional(),

  check("shippingService").optional(),
  check("shippingFeePerItem").optional().isFloat(),

  check("shippingFeeForAdditionalItem").optional().isFloat(),

  check("shippingFeePerKg").optional().isFloat(),

  check("shippingFeeFixed").optional().isFloat(),

  check("deliveryTimeMin").optional().isFloat()
  .custom((val, { req }) => isTimeMinLessThanTimeMax(val, req)),

  check("deliveryTimeMax").optional().isFloat(),
];

exports.getShippingRateValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Store id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Store)),
  validatorMiddleware,
];

// Create or update validator based on send id or not
const createConditionalValidation = async (req) => {
  const isShippingRateExists = await ShippingRate.find({
    country: req.body.country,
  });


  if (isShippingRateExists.length===0) {
    
    return createShippingRateValidator;
  }

  return updateShippingRateValidator;
};

exports.createOrUpdateShippingRateValidator = async (req, res, next) => {
  const validators = await createConditionalValidation(req);
  const validations = [...validators];
  await Promise.all(validations.map((validation) => validation.run(req)));
  validatorMiddleware(req, res, next);
};
