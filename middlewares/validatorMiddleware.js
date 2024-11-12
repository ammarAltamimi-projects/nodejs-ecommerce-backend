const { validationResult } = require("express-validator");
const fs = require("fs");

//  function DeleteUploadedFile(req,res,next){

// delete all UploadedFile locally if there error in express validator
function DeleteUploadedFile(req, res, next) {
  // mean if using single multer
  if (req.file) {
    fs.unlinkSync(req.file.path);
    return;
  }

  if (req.files) {
    // mean if using array multer
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => fs.unlinkSync(file.path));
    }
    //  mean if using fields multer
    else {
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const fieldName in req.files) {
        const filesArray = req.files[fieldName];
        filesArray.forEach((file) => fs.unlinkSync(file.path));
      }
    }
  }
}

// Validation middleware to check request validation errors
exports.validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Delete all uploaded images on error
    DeleteUploadedFile(req, res, next);

    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
