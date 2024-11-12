const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, "Country name must be unique"],
      trim: true,

    },
    code: {
      type: String,
      unique: [true, "Country code must be unique"],
      trim: true,

    },
    

  },
  { timestamps: true }
);

const countryModel = mongoose.model("Country", countrySchema);

module.exports = countryModel;
