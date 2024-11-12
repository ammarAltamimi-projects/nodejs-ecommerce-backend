const cron = require("node-cron");
const Banner = require("../../models/bannerModel");

cron.schedule("0 0 * * *", async () => {
  const banners = await Banner.findOne({ _id: "banner" });

  if (banners) {
    banners.bannerDetails.forEach((banner) => {
      if (banner.endDate < Date.now() || banner.startDate > Date.now()) {
        banner.isActive = false;
      }
    });
  }

  await banners.save();
});
