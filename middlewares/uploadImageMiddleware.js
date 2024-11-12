/* eslint-disable guard-for-in */
/* eslint-disable import/no-extraneous-dependencies */
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const FileType = require("file-type");
const asyncHandler = require("express-async-handler");

const cloudinary = require("../utils/cloudinary");

const ApiError = require("../utils/apiError");
const { CanvasToGenerateImage } = require("../utils/generateDefaultImage");

// Define whitelist mime type

const whitelist = ["image/jpeg", "image/jpg", "image/webp"];

// Multer configuration for file uploads
const multerOptions = (collectionName) => {
  // diskStorage or memoryStorage

  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join("uploads", collectionName));
    },
    filename: (req, file, cb) => {
      const filename = `${collectionName}-${uuidv4()}-${Date.now()}.jpg`;
      cb(null, filename);
    },
  });

  // Filter to only allow image files
  const multerFilter = (req, file, cb) => {
    if (
      file.mimetype.startsWith("image") &&
      whitelist.includes(file.mimetype.trim().toLowerCase())
    ) {
      cb(null, true);
    } else {
      cb(new ApiError("only PNG and JPEG images allowed ", 400), false);
    }
  };

  //determines the size of the image
  // limits = { fileSize: 1000000 }

  // find uploaded files
  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

  return upload;
};

// Helper function to upload a single image in one key
exports.uploadSingleImage = (collectionName, fileName) =>
  multerOptions(collectionName).single(fileName);

// Helper function to upload a array image in one key
exports.uploadArrayImages = (collectionName, fileName, noOfImages) =>
  multerOptions(collectionName).array(fileName, noOfImages);

// Helper function to upload multiple or single image files in more than one key
exports.uploadFieldsImages = (collectionName, arrayOfFields) =>
  multerOptions(collectionName).fields(arrayOfFields);

// Helper function to upload any image files
exports.uploadAnyImages = (collectionName) =>
  multerOptions(collectionName).any();




// single type : i receive req.file which is obj have details of image
exports.validateSingleFileTypeDisk = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  const meta = await FileType.fromFile(req.file.path);
  if (!whitelist.includes(meta.mime)) {
    fs.unlinkSync(req.file.path); // Remove file if validation fails
    throw new ApiError("file is not allowed", 400);
  }

  next();
});

// array file and any file : i receive req.files which array of obj each obj have details of image so when i loop on req.files
// then i can get obj that have details of image ..
// for array file we have one key which array so all obj of image details is that image push to this array 
// for any file so i receive req.files which array of obj each obj have details of image its same as req.files for array
// ex : if i have in schema array of 2 obj
// if each obj have one key have one image so will have array of two obj each obj for one image
// if each obj have one key have array of two image so will have array of 4 obj each obj for one image
// if each obj have two key first have one image and second have array of two so will have array of 6 obj each obj for one image

exports.validateArrayFileTypeAnyFileTypeDisk = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next();
  }

    await Promise.all(
      req.files.map(async (file) => {
        const meta = await FileType.fromFile(file.path);
        if (!whitelist.includes(meta.mime)) {
          // 1. when you did upload.array all file is uploaded locally so now when you come to this middleware should all file is uploaded locally as i said 
          // 2 if one file is invalid then should remove all file saved locally and to do that i should do two thing
          //first i need to delete all file uploaded
          // second i need to stop process because  problem is with promise its process is parallel not element by element so delete all will effect in parallel process so i need to stop process using return  but using throw will not stop may be
          // what will happen if i use throw , for example i have file 1 file 2 file 3 file 4  and if file1  its ok  ,  file2 added its ok ,  file3 its invalid  here i will remove file 1 2 3 4 locally and because there is throw and promise which is pararell will check after file3 to file 4 but its not exits because i delete so that i use return to stop and next to middlewareError
          req.files.forEach((f) => fs.unlinkSync(f.path));
          // throw new ApiError("file is not allowed", 400);
          return next(new ApiError("file is not allowed", 400))
        }
      })
    );

  
  next();
});

//  fields type : i receive req.files which obj have each key image this key have  array of obj each obj have details of image
//  so when i loop on req.files by in which for obj  and get each key then this key is array of obj each obj have details of image so
// so when i loop on it  then i can get  obj that  have details of image
// for example i have three key 1 key i have  one image so 1key have array of one obj and 2key have 5 image so 2key array of 5 obj , and 3key have 8 image so 3key array of 8 obj
exports.validateFieldsFileTypeDisk = asyncHandler(async (req, res, next) => {
  if (!req.files) return next();

  // eslint-disable-next-line no-restricted-syntax
  for (const fieldName in req.files) {
    const filesArray = req.files[fieldName];
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      filesArray.map(async (file) => {
        const meta = await FileType.fromFile(file.path);

        if (!whitelist.includes(meta.mime)) {
          // get all doc on one array because if i have imageCover filesArray and images filesArray
          // in imageCover if all file okay nothing will happen
          // in images if one file invalid and i use filesArray only will delete all file in images 
          // so i have to get one array have all file for imageCover and images
          const allFile = Object.values(req.files).flat()
          allFile.forEach((f) => fs.unlinkSync(f.path));
          // throw new ApiError("file is not allowed", 400);
          return next(new ApiError("file is not allowed", 400))
        }
      })
    );
  }
  next();
});

//Cloudinary -----------------------------

// Cloudinary : single image Disk
exports.uploadSingleImageToCloudinaryDisk =
  (nameOfFolder, quality, width, height, crop) => async (req, res, next) => {
    if (!req.file) {
      return next();
    }
    try {
      const customFileName = `${nameOfFolder}-${uuidv4()}-${Date.now()}`;
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: nameOfFolder,
        public_id: customFileName,
        quality: quality,
        width: width,
        height: height,
        crop: crop,
      });
      req.body[req.file.fieldname] = {
        url: result.secure_url,
        public_id: result.public_id,
      };
      // delete file locally after upload
      fs.unlinkSync(req.file.path);
      next();
    } catch (err) {
      // on case of error
      //1.delete image locally
      fs.unlinkSync(req.file.path);
      //2. return error message
      return next(
        new ApiError(`Failed to upload to cloudinary: ${err.message}`, 500)
      );
    }
  };

// Cloudinary : array images Disk

exports.uploadArrayImagesToCloudinaryDisk =
  (nameOfFolder, quality, width, height, crop) => async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const fieldName = req.files[0].fieldname;
    req.body[fieldName] = [];

    try {
      await Promise.all(
        req.files.map(async (file) => {
          const customFileName = `${nameOfFolder}-${uuidv4()}-${Date.now()}`;
          const result = await cloudinary.uploader.upload(file.path, {
            folder: nameOfFolder,
            public_id: customFileName,
            quality: quality,
            width: width,
            height: height,
            crop: crop,
          });

          // below code if valid for array type
          req.body[fieldName].push({
            url: result.secure_url,
            public_id: result.public_id,
          });

          // delete file locally after upload
          fs.unlinkSync(file.path);
        })
      );
      next();
    } catch (err) {
      // on case of error
      //1. delete all locally  files
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      //2. return error message
      return next(
        new ApiError(`Failed to upload to cloudinary: ${err.message}`, 500)
      );
    }
  };

// Cloudinary : fields images Disk

exports.uploadFieldsImagesToCloudinaryDisk =
  (nameOfFolder, quality, width, height, crop, fieldType) =>
  async (req, res, next) => {
    if (!req.files) {
      return next();
    }

    
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const fieldName in req.files) {
        const filesArray = req.files[fieldName];
        // in fields have more than one key also the key maybe have one image or array of images
        // so if type = single mean one image and if its type multi means array of images
        // Maybe will ask why you send single or Multi  , Can you check length of array
        // Ans is maybe key is array but admin send one image
        console.log(fieldType);
        console.log(fieldName);
        
        const type = fieldType[fieldName];
        if (type === "multi") {
          console.log("1",fieldName);
          
          req.body[fieldName] = [];
        }else {
          console.log("2",fieldName);

        }

        // eslint-disable-next-line no-await-in-loop
        await Promise.all(
          filesArray.map(async (file) => {
            try {
              const customFileName = `${nameOfFolder}-${uuidv4()}-${Date.now()}`;
              const result = await cloudinary.uploader.upload(file.path, {
                folder: nameOfFolder,
                public_id: customFileName,
                quality: quality,
                width: width,
                height: height,
                crop: crop,
              });

              if (type === "multi") {
                req.body[fieldName].push({
                  url: result.secure_url,
                  public_id: result.public_id,
                });
              } else {
                req.body[fieldName] = {
                  url: result.secure_url,
                  public_id: result.public_id,
                };
              }

              // delete file locally after upload
              fs.unlinkSync(file.path);
            } catch (err) {
              fs.unlinkSync(file.path);
              throw new ApiError(
                `Failed to upload to Cloudinary: ${err.message}`,
                500
              );
            }
          })
        );
      }

      next();
    } catch (err) {
      // on case of error
      //1. delete all locally  files
      Object.values(req.files).forEach((filesArray) => {
        filesArray.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
      //2. return error message
      return next(
        new ApiError(`Failed to upload to cloudinary: ${err.message}`, 500)
      );
    }
  };





// Cloudinary : any images Disk

//its same as the array Cloudinary but with one different thing 
// --> in array is one key only which fieldname and its array so direct we push to it 

//-->in any file  fieldname now is variant[0][images] and we need to split and get each one alone like firstKey:variant ,Index:0 ,ImageName: images and that for two reason
//1. i will send fieldType which tell me each key is array or not if multi then i will push otherwise obj and i wil send like imageCover or images so in each req.files i should get it but i have only variant[0][images] so that i split to get (ImageName)
//2.when i add to body i should make req.body[variant][0][images] so if i direct put fieldname then variant[0][images] will be like one name or one key not nested 
// so we should get eacKey alone then and add in each obj
exports.uploadAnyImagesToCloudinaryDisk =
  (nameOfFolder, quality, width, height, crop,fieldType) => async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }


     // will edit on the req.files as following 
    // fieldname now is variant[0][images] and we need to split and get each one alone like firstKey:variant ,Index:0 ,ImageName: images and that for two reason
    //1. i will send fieldType which tell me each key is array or not if multi then i will push otherwise obj and i wil send like imageCover or images so in each req.files i should get it but i have only variant[0][images] so that i split to get (ImageName)
    //2.when i add to body i should make req.body[variant][0][images] so if i direct put fieldname then variant[0][images] will be like one name or one key not nested 
    // so we should get eacKey alone then and add in each obj
    //note also will initial key inside obj here special array  (not related to the reason 1 ,2 )
    req.files = req.files.map((file)=>{
     const [firstKey,Index,ImageName] = file.fieldname.split(/\[|\]/).filter(part => part !== "");

     //-------------------------------------
    // initial the key inside req.body (not related to the reason 1 ,2 )
    const type = fieldType[ImageName];
    if (type === "multi") {

      req.body[firstKey][Index][ImageName] = [];
      
    }else {

      req.body[firstKey][Index][ImageName] = {};
    }
    //-------------------------------------
    
    return {
        firstKey ,
        Index,
        ImageName,
        ...file
        
      }
    })



    try {
      await Promise.all(
        
        req.files.map(async (file) => {
          const customFileName = `${nameOfFolder}-${uuidv4()}-${Date.now()}`;
          const result = await cloudinary.uploader.upload(file.path, {
            folder: nameOfFolder,
            public_id: customFileName,
            quality: quality,
            width: width,
            height: height,
            crop: crop,
          });

          const type = fieldType[file.ImageName];
          if (type === "multi") {
            req.body[file.firstKey][file.Index][file.ImageName].push({
              url: result.secure_url,
              public_id: result.public_id,
            });
            
     
          }else {
            req.body[file.firstKey][file.Index][file.ImageName] = {
              url: result.secure_url,
              public_id: result.public_id,
            };
     
          }

          // delete file locally after upload
          fs.unlinkSync(file.path);
        })
      );
      next();
    } catch (err) {
      // on case of error
      //1. delete all locally  files
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      //2. return error message
      return next(
        new ApiError(`فشل في رفع الصور إلى Cloudinary: ${err.message}`, 500)
      );
    }
  };



//----------------------------------------------------------

exports.userDefaultImage = async (req, res, next) => {
  if (!req.file) {
    req.file = {};
    req.file.path = await CanvasToGenerateImage(req.body.name);
  }
  next();
};
