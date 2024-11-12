const categoryRouter = require("./categoryRoute");
const subCategoryRouter = require("./subCategoryRoute");
const offerTagRouter = require("./offerTagRoute")
const brandRouter = require("./brandRoute");
const storeRouter = require("./storeRoute");
const productRouter = require("./productRoute");
const couponRouter = require("./couponRoute");
const authRouter = require("./authRoute");
const userRouter = require("./userRoute");
const wishlistRouter = require("./wishlistRoute")
const historyRouter = require("./historyRoute")
const addressRouter = require("./addressRoute")
const reviewRouter = require("./reviewRoute")
const cartRouter = require("./cartRouter")
const orderRouter = require("./orderRoute")
const paymentDetailsRouter = require("./paymentDetailsRoute")
// const filterOptionRouter = require("./filterOptionRoute")
// const subcategoryFilterRouter = require("./subCategoryFilterRoute")
const shippingRateRouter = require("./shippingRateRoute")
const homePageSettingsRouter = require("./homePageSettingsRoute")
const bannerRouter = require("./bannerRoute")
const footerRouter = require("./footerRoute")






 exports.mountRoutes = (app)=>{
app.use("/api/v1/categories",categoryRouter);
app.use("/api/v1/subcategories",subCategoryRouter);
app.use("/api/v1/offer-tag",offerTagRouter);
app.use("/api/v1/brands",brandRouter);
app.use("/api/v1/stores",storeRouter);
app.use("/api/v1/products",productRouter);
app.use("/api/v1/coupons",couponRouter);
app.use("/api/v1/users",userRouter);
app.use("/api/v1/auth",authRouter);
app.use("/api/v1/wishlists",wishlistRouter);
app.use("/api/v1/history",historyRouter);
app.use("/api/v1/addresses",addressRouter);
app.use("/api/v1/reviews",reviewRouter);
app.use("/api/v1/carts",cartRouter);
app.use("/api/v1/orders",orderRouter);
app.use("/api/v1/payment",paymentDetailsRouter);
// app.use("/api/v1/options",filterOptionRouter);
// app.use("/api/v1/subcategory-filter",subcategoryFilterRouter);
app.use("/api/v1/shipping-rate",shippingRateRouter);
app.use("/api/v1/home-page-settings",homePageSettingsRouter);
app.use("/api/v1/banner",bannerRouter);
app.use("/api/v1/footer",footerRouter);


}