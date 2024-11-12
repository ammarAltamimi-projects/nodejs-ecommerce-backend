const express = require("express");

const router = express.Router();

const {
  getLoggedUserAddresses,
  addToAddress,
  updateAddress,
  deleteAddress,
  createFilterObj,
  setUserIdToBody,
  updateToDefaultAddress
} = require("../services/addressService");
const {
  addToAddressValidator,
  deleteAddressValidator,
  updateAddressValidator,
  updateToDefaultAddressValidator
} = require("../utils/validators/addressValidator");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router
  .route("/")
  .get(protect, allowedTo("user"),createFilterObj, getLoggedUserAddresses)
  .post(protect, allowedTo("user"),addToAddressValidator,setUserIdToBody, addToAddress);
router
  .route("/:id")
  .put(protect, allowedTo("user"),updateAddressValidator, updateAddress)
  .delete(protect, allowedTo("user"), deleteAddressValidator, deleteAddress);

  router.put("/:addressId/updateToDefaultAddress",protect, allowedTo("user"),updateToDefaultAddressValidator,updateToDefaultAddress)

module.exports = router;
