const fs = require("fs");
require("colors");
const dotenv = require("dotenv");
const Footer = require("../../models/footerModel")
// const Banner = require("../../models/bannerModel")
// const HomepageSettings = require("../../models/homePageSettingsModel");
// const Category = require('../../models/categoryModel');
// const SubCategory = require('../../models/subCategoryModel');
// const Brand = require('../../models/brandModel');
// const User = require('../../models/userModel');
// const Store = require('../../models/storeModel');
// const OfferTag = require('../../models/offerTagModel');
// const ShippingRates = require('../../models/shippingRateModel');
const Product = require('../../models/productModel');
const { dbConnection } = require("../../config/database");

dotenv.config({ path: "../../config.env" });

// connect to DB
dbConnection();

// Read data
const products = JSON.parse(fs.readFileSync("./product.json"));

// Insert data into DB
const insertData = async () => {
  try {
    await Product.create(products);

    console.log("Data Inserted".green.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Delete data from DB
const destroyData = async () => {
  try {
    await Footer.deleteMany();
    console.log("Data Destroyed".red.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// node seeder.js -d
if (process.argv[2] === "-i") {
  insertData();
} else if (process.argv[2] === "-d") {
  destroyData();
}
