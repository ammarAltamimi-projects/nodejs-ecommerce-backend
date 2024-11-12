exports.calculateVariantPricing =  (variant,offerTag,product) => {
    // Calculate discountPercentage (for permanent discount)    
    if (variant.originalPrice && variant.price) {
      variant.discountPercentage = Math.round(((variant.originalPrice - variant.price) / variant.originalPrice) * 100);

    } else {
      variant.discountPercentage = 0;
    }
  
    // Calculate salePrice (for time-bound discount)
    
    if (offerTag) {
      // make is sale true 
  
      product.isSale = true

      // If discountType is 'percentage', apply percentage discount; if 'fixed', subtract the fixed discount amount.

        variant.salePrice = offerTag.discountType === 'fixed' ?variant.price - offerTag.discountValue :variant.salePrice =  variant.price * (1 - offerTag.discountValue / 100);
    
    }
    
    return variant;
  };
  