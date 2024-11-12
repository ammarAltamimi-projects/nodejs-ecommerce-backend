const mongoose = require("mongoose");
// Connects to the MongoDB using the URL stored in the environment variable DB_URL
exports.dbConnection = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then((conn) => {
      console.log(`database connected ${conn.connection.host}`);
    })
    .catch((error) => {
      console.log(`database error: ${error}`);
      process.exit(1);
    });
};
