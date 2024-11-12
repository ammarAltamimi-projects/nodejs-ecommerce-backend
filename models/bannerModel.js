const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "banner",
    },
    bannerDetails: [{
      title: {
        type: String,
        required: [true, "banner title is required"],
      },

        images: [
          {
            url: { type: String },
            public_id: { type: String },
          },
        ],

        links: [{ type: String }],

        fallBack:{
          url: {type:String},      
          public_id:{type:String},  
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        startDate: {
          type: Date,
          required: [true, "start date required"],
        },
        endDate: {
          type: Date,
          required: [true, "expiration date required"],
        },

      }],

  },
  {
    timestamps: true,
  }
);

const bannerModel = mongoose.model(
  "Banner",
  bannerSchema
);

module.exports = bannerModel;
