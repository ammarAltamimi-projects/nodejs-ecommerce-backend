/* eslint-disable import/newline-after-import */
/* eslint-disable import/no-extraneous-dependencies */
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const session = require("express-session");
const crypto = require("crypto");
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");
dotenv.config({ path: "config.env" });
require("./utils/nodeCorn/nodeCornOfferTag");
require("./utils/nodeCorn/nodeCornBanner");
require("./utils/nodeCorn/nodeCornOrder");
const { dbConnection } = require("./config/database");
const { globalError } = require(`./middlewares/errorMiddleware`);
const ApiError = require(`./utils/apiError`);

const { mountRoutes } = require("./routes/indexRouter");
const { webhookCheckout } = require("./services/orderService");

//  Database connection
dbConnection();

// Middleware Setup
app.use(cors()); // Enable cross-origin resource sharing
app.options("*", cors());
app.use(compression()); // Compress responses for faster load times
app.use(xss()); // XSS protection
app.use(helmet()); // Helmet for setting HTTP headers securely
app.use(cookieParser()); // Parse cookies for CSRF protection
app.use(express.json({ limit: "20kb" })); // Limit the request body size
app.use(express.urlencoded({ extended: true }));

//  Security Middlewares
app.use(mongoSanitize()); // Sanitize user inputs to prevent NoSQL injection
app.use(
  hpp({
    whitelist: [
      "price",
      "sold",
      "quantity",
      "ratingsAverage",
      "ratingsQuantity",
      "category",
      "subCategories",
      "brand",
    ],
  })
); // HTTP Parameter Pollution Protection

// Session Handling Middleware
const secret = crypto.randomBytes(64).toString("hex");
const cookieName = "yourAppSession";
app.use(
  session({
    secret: secret,
    name: cookieName,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Ensures cookie is sent only over HTTPS
      httpOnly: true, // Prevents access via JavaScript
      sameSite: "lax", // Helps protect against CSRF
    },
  })
);

// Rate Limiting Middleware
// Limit each IP to 100 requests per `window` (here, per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message:
    "Too many accounts created from this IP, please try again after an hour",
});
app.use("/api", limiter); // Apply the rate limiting middleware to all requests

// // Checkout webhook
// app.post(
//   "/webhook-checkout",
//   express.raw({ type: "application/json" }),
//   webhookCheckout
// );

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// Route Handlers
mountRoutes(app);

//  Global Error Handling
app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

app.use(globalError);

// Server Setup
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`app listening on port  ${port}`);
});

// Unhandled Rejection Handling
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled rejection Error : ${err.name} | ${err.message}`);
  server.close(() => {
    console.log("shutting down ...");
    process.exit(1);
  });
});
