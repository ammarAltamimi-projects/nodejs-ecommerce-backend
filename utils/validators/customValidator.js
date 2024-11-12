const slugify = require("slugify");
const bcrypt = require("bcryptjs");

exports.setSlug = async (val, req, Model) => {
  const slug = slugify(val);
  let suffix = 1;
  let newSlug = slug

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const isExist = await Model.findOne({ slug: newSlug });
    if (!isExist) {
      break;
    }
    newSlug = `${slug}-${suffix}`
    suffix += 1;
  }
  req.body.slug = newSlug;
  return true;
};

exports.setSlugArray =async (val, req, Model,path) => {
  const slug = slugify(val);
  let suffix = 1;
  let newSlug = slug
  let isExists;
  const match = path.match(/\[(\d+)\]/); // Extracts the number inside the square brackets
  const index = match ? parseInt(match[1], 10) : null;
  const currentVariant = req.body.variant[index];

  const products = await Model.find();
    // eslint-disable-next-line no-constant-condition
    while (true) {
    
      // eslint-disable-next-line no-loop-func, no-plusplus
      for (let i = 0; i < products.length; i++) {

        // eslint-disable-next-line no-loop-func
        isExists = products[i].variant.find((item)=>item.variantSlug === newSlug)
        if(isExists){
          break;
        }
        
      
      }    
      if (!isExists) {
        break;
      }
       newSlug = `${slug}-${suffix}`
      suffix += 1;
    }

    currentVariant.variantSlug=newSlug
    
  return true;
};

exports.ensureUniqueModelValue = async (val, req, currentId, Model, query) => {
  const document = await Model.findOne(query);

  if (currentId) {
    // Update
    if (document && document._id.toString() !== currentId.toString()) {
      throw new Error(`${val} already exists`);
    }
  } else {
    // Create scenario.
    // eslint-disable-next-line no-lonely-if
    if (document) {
      throw new Error(`${val} already exists`);
    }
  }

  return true;
};

exports.ensureUniqueSubModelValueInItsModel =  async (
  val,
  req,
  Model,
  query,
  currentId,
  array,
  uniqueField
) => {
// for example in userMode i have address array which is array of obj each obj have name 
//  when i push new Obj to add to address array i need to make sure name in this new obj not there in any obj in address array

  const document = await Model.findOne(query);

  let existsDoc = document[array].find((subDoc)=> subDoc[uniqueField]  === val )


  if (currentId) {
    // Update
    if (existsDoc && existsDoc._id.toString() !== currentId.toString()) {
      throw new Error(`${val} already exists`);
    }
  } else {
    // Create scenario.
    // eslint-disable-next-line no-lonely-if
    if (existsDoc) {
      throw new Error(`${uniqueField} already exists`);
    }

  }
  return true;
};


exports.ensureUniqueValueInSendArrayOfObj =  async (
  val,
  req,
  array,
  uniqueField
) => {
// for example i send variant array that have variantObj i want make sure title in each variantObj is different from other

let counter = 0

  req.body[array].forEach((item)=>{
  if(item[uniqueField] === val){
    counter += 1
  }
})

if (counter > 1) {
  throw new Error(`same ${uniqueField}  exists more than one in ${array} `);
}
return true;

};




exports.ensureUniqueSubModelValue = async (
  val,
  req,
  Model,
  currentId,
  array,
  uniqueField
) => {
  // for example sku
  // when i enter sku i should check if its there in any product so we did this logic 
  // some one will say if in same product we enter same sku in in two obj >> that will not happen because 
  // i mast make custom ensure Unique sku in its Product

  const document = await Model.find();

  let isExists;
  let productId ;
  
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < document.length; i++) {
    isExists = document[i][array].find((item)=>item[uniqueField] === val)
    // if he find i want to break loop because maybe he will reach to last product and will not found so isExists will be false
    // so that i need to break if he found 
    if(isExists){
      // i need to store productId for the update option below
      productId =  document[i]._id
      break;
    }
   
  }

  if (currentId) {

    // Update
    if (isExists && productId.toString() !== currentId.toString()) {
      throw new Error(`${val} already exists`);
    }
  } else {
    // Create scenario.
    // eslint-disable-next-line no-lonely-if
    if (isExists) {
      throw new Error(`${uniqueField} already exists`);
    }
   
  }
  return true;
};



exports.ensureDocumentExistsById = async (val, req, Model) => {
  const document = await Model.findById(val);
  if (!document) {
    throw new Error(`Invalid ${Model.modelName}  id `);
  }
  return true;
};

exports.ensureDocumentExistsByIdAndValid = async (val, req, Model,startDate,endDate) => {
  const document = await Model.findOne({_id:val ,[startDate]:{$lt:Date.now()},[endDate]:{$gt:Date.now()}});
  if (!document) {
    throw new Error(`Invalid ${Model.modelName}  id  or expired`);
  }
  return true;
};

exports.ensureAllDocumentsExistByIds = async (documentReceived, req, Model) => {  
  const document = await Model.find({
    _id: { $exists: true, $in: documentReceived },
  });
  
  if (document.length !== documentReceived.length) {
    throw new Error(`Invalid ${Model.modelName}  Ids`);
  }
  return true;
};



exports.ensureSubDocumentExistsById = async (
  val,
  req,
  Model,
  query,
  subModel
) => {
  console.log(Model.modelName);
  
  const document = await Model.findOne(query);

  if (!document) {
    throw new Error(`Invalid ${Model.modelName}  id`);
  }

 
  
  const isSubDocumentExist = document[subModel].some(
    (a) => a._id.toString() === val
  );
  if (!isSubDocumentExist) {
    throw new Error(` ${subModel} id  ${val} does Not belongs to  ${Model.modelName} `);
  }

  return true;
};


exports.ensureSubDocumentExistsBySlug = async (
  val,
  req,
  Model,
  query,
  subModel
) => {
  const document = await Model.findOne(query);

  if (!document) {
    throw new Error(`Invalid ${Model.modelName}  slug`);
  }

  
  const isSubDocumentExist = document[subModel].some(
    (a) => a.variantSlug === val
  );
  if (!isSubDocumentExist) {
    throw new Error(` ${subModel} slug  ${val} does Not belongs to  ${Model.modelName} `);
  }

  return true;
};

exports.ensureDocumentBelongToParent = async (
  val,
  req,
  Model,
  parentKey,
  parentId
) => {
  const document = await Model.findById(val);
  if (!document) {
    throw new Error(`${Model.modelName}  not found`);
  }
  if (document[parentKey].toString() !== parentId) {
    throw new Error(
      `${Model.modelName} must be belong to parentId id  ${parentId}`
    );
  }
  return true;
};

exports.ensureDocumentBelongToAllParent = async (
  val,
  req,
  Model,
  parentKey,
  receivedParentIds
) => {
  const document = await Model.findById(val);
  if (!document) {
    throw new Error(`${Model.modelName}  not found`);
  }

  // get all parent id and convert to string id
  const allParentIds = document[parentKey].map((id) => id.toString());

  const isAllReceivedParentIdsExist = receivedParentIds.every((id) =>
    allParentIds.includes(id)
  );

  if (!isAllReceivedParentIdsExist) {
    throw new Error(
      `${Model.modelName} must be belong to all parentId id  ${receivedParentIds}`
    );
  }
  return true;
};

exports.ensureAllDocumentsBelongToParent = async (
  childDocumentReceivedId,
  req,
  Model,
  filterObj,
  parentId
) => {
  const allChildDocumentsBelongToThisParent = await Model.find(filterObj);
  const allChildDocumentsId = allChildDocumentsBelongToThisParent.map(
    (itemObj) => itemObj._id.toString()
  );

  const isAllBelongToDocumentsId = childDocumentReceivedId.every((item) =>
    allChildDocumentsId.includes(item)
  );

  if (!isAllBelongToDocumentsId) {
    throw new Error(
      `all ${Model.modelName} must be belong to parentId id ${parentId}`
    );
  }
  return true;
};

exports.isPriceLessThanOfferTagFixedDiscountIfExists =async (val, req,Model) => {
if(req.body.offerTag){
  const offerTag = await Model.findById(req.body.offerTag);
  // i will not check if exits because there is only check for offer tag
if(offerTag.discountType === "fixed" &&  val <= offerTag.discountValue){
  throw new Error(
    `offer tag discount ${offerTag.discountValue} is more than the product price ${val}`
  );
}
}

  return true;
};

exports.isPriceLessThanOriginalPrice = (val, req,path) => {
  const match = path.match(/\[(\d+)\]/); // Extracts the number inside the square brackets
  const index = match ? parseInt(match[1], 10) : null;
  const currentVariant = req.body.variant[index];

  
  if (val < currentVariant.price) {
    throw new Error("price  must be less than originalPrice");
  }

  return true;
};

exports.isTimeMinLessThanTimeMax = (val, req) => {
  
  // i will make this validator for both store and shipping rate but i will save value which send so we have two option
  // if in store may be will send defaultDeliveryTimeMax and if not send when used default value which is 31
  // if in shipping rate it must send deliveryTimeMax
  const timeMax = req.body.deliveryTimeMax || req.body.defaultDeliveryTimeMax ||  31

  if (val > timeMax) {
    throw new Error("Minimum delivery time must be less than maximum");
  }

  return true;
};


exports.checkSizeType = (val, req) => {
 // size is num or includes to   ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
 const sizes =  ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  if (isNaN(parseInt(val)) &&  !sizes.includes(val.toUpperCase()) ) {
    throw new Error("size is num or includes to [ XS S M L XL XXL XXXL] ");
  }

  return true;
};



exports.isOfferTagExists = (val, req) => {

  if (req.body.offerTag ) {
    throw new Error("You cannot use a temporary offer tag and a permanent price together");
  }

 

  return true;
};

exports.checkPasswordConfirm = (password, req) => {
  if (password !== req.body.passwordConfirm) {
    throw new Error(" password Confirm incorrect");
  }
  return true;
};

exports.checkCurrentPassword = async (currentPassword, req, Model) => {
  if (req.user.role === "user") {
    req.params.id = req.user._id;
  }

  const user = await Model.findById(req.params.id);
  const IsCurrentPassword = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!IsCurrentPassword) {
    throw new Error("currentPassword is wrong");
  }
  return true;
};

exports.check6DigitsResetCode = (resetCode, req) => {
  if (resetCode.length !== 6) {
    throw new Error("resetCode must be 6 digits");
  }
  return true;
};

exports.MultipleCountryCodes = (val, validator) => {
  const locales = ["US", "CA", "GB"];
  const isValid = locales.some((locale) => validator.isPostalCode(val, locale));
  if (!isValid) {
    throw new Error("country code must be one of US, CA, GB");
  }
  return true;
};

exports.checkIfUserReviewedProduct = async (productId, req, Model) => {
  const review = await Model.findOne({
    product: productId,
    variant:req.body.variant,
    user: req.user._id,
  });
  if (review) {
    throw new Error("You have already reviewed this product");
  }
  return true;
};

exports.validateUserOwnership = async (Id, req, Model) => {
  let document = await Model.findById(Id);

  // check owner Ship for user key
  const documentUserId = document.user?._id.toString() || document.user?.toString();
  if (documentUserId !== req.user._id.toString()) {
    throw new Error(`You do not have permission to perform this action on ${Model.modelName}.`);
  }

  return true
};

exports.validateReferenceOwnership  = async (Id, req, Model,refName) => {
  let document =await Model.findById(Id);
 if(!document){
  throw new Error(`${Model.modelName} not found.`);
 }
 // because if doc of ref deleted the ref value will ne null and i need only i check if value is there
 // because if its ref delete i want to pass because i deal with this with snapchat (i write note in snapchat topic)
if(document[refName]){
  // check owner ship for ref that has schema include user key
  const documentUserSchema =  document[refName].user.toString()
  if (documentUserSchema !== req.user._id.toString()) {
    throw new Error(`You do not have permission to perform this action on ${Model.modelName}.`);

  }
}
  return true

};

exports.validateOwnership = async (Id, req, Model, idName) => {
  const document = await Model.findById({ _id: req.params.id });

  if (!document) {
    throw new Error(`${Model.modelName}  not found`);
  }
  if (document[idName].toString() !== Id) {
    throw new Error(`${Model.modelName} id does not belongs to parent id `);
  }
};

exports.singleImageRequired = (val, req) => {
  if (!req.file) {
    throw new Error("image is required");
  }
  return true;
};

exports.arrayImagesRequired = (val, req) => {
  if (!req.files || req.files.length === 0) {
    throw new Error("image is required");
  }
  return true;
};

exports.allFieldsImagesRequired = (val, req,allFieldArrayRequired) => {
  const allFieldArray = Object.keys(req.files)
  if (allFieldArray.length === 0 || JSON.stringify(allFieldArray.sort()) !== JSON.stringify(allFieldArrayRequired.sort())) {
    throw new Error("image is required");
  }
  return true;
};

exports.specificFieldsImagesRequired = (val, req,specificKey) => {
  if (Object.keys(req.files).length === 0 || !req.files[specificKey] ) {
    throw new Error("image is required");
  }
  return true;
};

exports.allAnyImagesRequired = (val, req,path,allAnyArrayRequired) => {
  const match = path.match(/\[(\d+)\]/); // Extracts the number inside the square brackets
  const index = match ? parseInt(match[1], 10) : null;
    // get obj of req.files that only belong to this index 
  // mean if im inn index one i wil get obj that have key[0] only 
  // because i need to check for each index so if for example imageCover , images required i need to check if its there in index 0 and index 1 ...
  //if i dont do that then i you send imageCover  , images in index 0 and dont in 1 then will not give you error because its exits in index 0 
  const filesBelongsToCurrentIndex = req.files.filter((file)=> file.fieldname.includes(index))
  

   // edit fieldname in req.files and get name of keys
   const newReqFiles =filesBelongsToCurrentIndex.map((file)=> file.fieldname.split("[")[2].slice(0,-1))
   // delete repeat
   const allAnySet = new Set(newReqFiles);
  const allAnyArray = [...allAnySet]

  if (req.files.length === 0 ||  JSON.stringify(allAnyArray.sort()) !== JSON.stringify(allAnyArrayRequired.sort()) ) {
    throw new Error("image is required");
  }
  return true;
};

exports.specificAnyImagesRequired = (val, req,path,specificKey) => {
  const match = path.match(/\[(\d+)\]/); // Extracts the number inside the square brackets
  const index = match ? parseInt(match[1], 10) : null;

  // get obj of req.files that only belong to this index 
  // mean if im inn index one i wil get obj that have key[0] only 
  // because i need to check for each index so if for example imageCover required i need to check if its there in index 0 and index 1 ...
  //if i dont do that then i you send imageCover in index 0 and dont in 1 then will not give you error because its exits in index 0 
  const filesBelongsToCurrentIndex = req.files.filter((file)=> file.fieldname.includes(index))
  


  
   // edit fieldname in req.files and get name of keys for example fieldname : variant[0][images]
   const newReqFiles = filesBelongsToCurrentIndex.map((file)=> file.fieldname.split("[")[2].slice(0,-1))
   // delete repeat
   const allAnySet = new Set(newReqFiles);
  const allAnyArray = [...allAnySet]
  
  if (req.files.length === 0 || !allAnyArray.includes(specificKey) ) {
    throw new Error("image is required");
  }
  return true;
};



exports.validateTypeDiscriminator = (val, req) => {
  const validSubCategories = ["women", "men", "phone", "laptop"];
  if (!validSubCategories.includes(val)) {
    throw new Error("Invalid  subcategory type.");
  }
  return true;
};



exports.checkDiscountPercentage = (val, req, path) => {

  if (
    req.body.discountType === "percentage" &&
    (req.body.discountValue > 100 || req.body.discountValue < 0)
  ) {
    throw new Error("percentage discount value must be between 0 and 100");
  }

  return true;
};


exports.validateOption = (val, req) => {
  const option = [
    "color",
    "size",
    "material",
    "phone storage capacity",
    "phone ram size",
    "phone network type",
    "phone operating system",
    "phone battery capacity",
    "phone screen size",
    "laptop processor brand",
    "laptop processor type",
    "laptop hardDisk capacity",
    "laptop storage type",
    "laptop operating system",
    "laptop screen size",
  ];

  if (!option.includes(val)) {
    throw new Error(
      "Invalid name. Choose from the following options: color, size, material, phone storage capacity, phone ram size, phone network type, phone operating system, phone battery capacity, phone screen size, laptop processor brand, laptop processor type, laptop hard disk capacity, laptop storage type, laptop operating system, laptop screen size"
    );
  }
  return true;
};

exports.ensureStartDateLessThanExpireDate = (val, req,dateExpired) => {
  const expireDate = new Date(req.body[dateExpired]).getTime();
  const startDate = new Date(val).getTime();

  if (expireDate <= startDate) {
    throw new Error("start Date must be less than expire Date");
  }

  return true;
};


exports.ensureStartDateLessThanExpireDateInArray = (val, req,path,dateExpired) => {

  const match = path.match(/\[(\d+)\]/); // Extracts the number inside the square brackets
  const index = match ? parseInt(match[1], 10) : null;
  const currentBanner = req.body.bannerDetails[index];
  

  const startDate = new Date(val).getTime();
  
  const expireDate = new Date(currentBanner[dateExpired]).getTime();

 
  if (expireDate <= startDate) {
    throw new Error("start Date must be less than expire Date");
  }

  return true;
};



exports.ensureNoFreeShippingForAll = (val, req) => {

  
  if (req.body.freeShippingForAllCountries ===  "true") {
    throw new Error("Cannot have both freeShippingForAllCountries and specific countries");
  }

  return true;
};




exports.ensureSingleDefaultVariant = (val, req) => {
let counter = 0;
  req.body.variant.forEach((item)=>{
    if(item.defaultVariant === "true"){
      counter += 1
    }
  })
  if(counter > 1){
    throw new Error("Cannot have more than one default variant");

  }
  return true;
};



exports.ensureUniqueUserAddressAlias =async (val, req,Model) => {
  const address = await Model.findOne({user:req.user._id , alias:val})
    if(address){
      throw new Error(`You already have an address with the alias "${val}". Please choose a different alias.`);
  
    }
    return true;
  };
  


  exports.ensureUniqueDefaultUser =async (val, req,Model) => {
    const address = await Model.findOne({user:req.user._id , defaultAddress:true})
      if(address){
        address.defaultAddress = false;
        await address.save();
      }
      return true;
    };
    