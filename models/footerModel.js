const mongoose = require("mongoose");

const footerSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: "footer",
  },
  callToAction: {
    title: { type: String, required: [true, "callToAction title required"] },
    phoneNumbers: { type: String, required: [true, "callToAction phoneNumbers required"] }
  },
  contactInfo: {
    title: { type: String, required: [true, "contactInfo title required"] },
    info: { type: String, required: [true, "contactInfo info required"] }
  },
  socialMedia: [{
    title: { type: String, required: [true, "socialMedia title required"] },
    url: { type: String, required: [true, "socialMedia url required"] }
  }],
  findItFast: {
    title: { type: String, required: [true, "findItFast title required"] },
    text: [{
      textTitle: { type: String },
      url: { type: String }
    }]
  },
  quickAccess: {
    title: { type: String, required: [true, "quickAccess title required"] },
    text: [{
      textTitle: { type: String },
      url: { type: String }
    }]
  },
  customerCare: {
    title: { type: String, required: [true, "customerCare title required"] },
    text: [{
      textTitle: { type: String },
      url: { type: String }
    }]
  },
  newsletterSignUp: {
    type: String,
    required: [true, "newsletterSignUp required"]
  },
  signUpButton: {
    type: String,
    required: [true, "signUpButton required"]
  },
  copyright: {
    type: String,
    required: [true, "copyright required"]
  }
}, {
  timestamps: true
});

const footerModel = mongoose.model(
  "Footer",
  footerSchema
);

module.exports = footerModel;
