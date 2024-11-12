const mongoose = require("mongoose");

const addressScheme = new mongoose.Schema(
  {
     user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: [true, "user required"],
        },
    firstName: {
      type: String,
      required: [true, "first Name  required"],

    },
    lastName: {
      type: String,
      required: [true, "last Name  required"],
    },
    phone: {
      type: String,
      required: [true, "phone number required"],
    },
    alias: {
      type: String,
      required: [true, "address alias required"],
      minlength: [2, "too short address alias"],
      maxlength: [10, "too long address alias"],
    },
    address1: {
      type: String,
      required: [true, "address details required"],
      minlength: [5, "too short address details"],
      maxlength: [256, "too long address details"],
    },
    address2: {
      type: String, 
    },
    state: {
      type: String,
      required: [true, "city required"],
      minlength: [2, "too short city"],
      maxlength: [32, "too long city"],
    },
    city: {
      type: String,
      required: [true, "city required"],
      minlength: [2, "too short city"],
      maxlength: [32, "too long city"],
    },
    country: {
          type: mongoose.Schema.ObjectId,
          ref: "Country",
          required: [true, "Country required"]
        },
    postalCode: {
      type: String,
      required: [true, "postal code required"],
      minlength: [5, "too short postal code"],
      maxlength: [10, "too long postal code"],
    },
    defaultAddress:{
      type:Boolean,
      default:false
    }
  },
  
  { timestamps: true }
);




const AddressModel = mongoose.model("Address", addressScheme); 




module.exports = AddressModel;
