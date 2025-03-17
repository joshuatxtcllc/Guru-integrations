/**
 * Frame Guru - Vendor Integration Service
 * Handles the integration with Frame Destination and Frame It Easy for dropshipping
 */

const axios = require('axios');
const config = require('../config/config');
const { Order, Product } = require('../models/orderSchema');
const { logActivity } = require('../utils/activityLogger');

// Vendor API configuration
const vendors = {
  frameDest: {
    baseURL: config.vendors.frameDestination.apiUrl,
    apiKey: config.vendors.frameDestination.apiKey,
    account: config.vendors.frameDestination.account,
    active: config.vendors.frameDestination.active
  },
  frameItEasy: {
    baseURL: config.vendors.frameItEasy.apiUrl,
    apiKey: config.vendors.frameItEasy.apiKey,
    partnerId: config.vendors.frameItEasy.partnerId,
    active: config.vendors.frameItEasy.active
  }
};

// Product mappings
const productMappings = require('../config/productMappings');

/**
 * Determine the best vendor for an order based on product type, availability, and cost
 */
async function determineVendor(order) {
  try {
    // For complex custom orders (Tier 3), always use in-house
    if (order.items.some(item => item.framingTier && item.framingTier.tier === 3)) {
      return {
        vendor: 'in-house',
        reason: 'Tier 3 custom framing requires in-house production'
      };
    }

    // Initialize vendor scores
    let vendorScores = {
      'frame-destination': 0,
      'frame-it-easy': 0,
      'in-house': 0
    };
    
    // Check product compatibility with each vendor
    for (const item of order.items) {
      // Skip any service items
      if (item.itemType !== 'standard') continue;
      
      // Check product mappings for preferred vendors
      const product = await Product.findById(item.product);
      if (!product) continue;
      
      const mapping = productMappings.find(m => 
        m.frameGuruId === product._id.toString() || 
        m.frameGuruSKU === product.sku
      );
      
      if (mapping) {
        // Add points based on product mapping preferences
        if (mapping.preferredVendor === 'frame-destination') {
          vendorScores['frame-destination'] += 3;
        } else if (mapping.preferredVendor === 'frame-it-easy') {
          vendorScores['frame-it-easy'] += 3;
        } else if (mapping.preferredVendor === 'either') {
          vendorScores['frame-destination'] += 1;
          vendorScores['frame-it-easy'] += 1;
        } else if (mapping.preferredVendor === 'in-house') {
          vendorScores['in-house'] += 3;
        }
        
        // Check if vendor has the product mapped
        if (!mapping.frameDestinationSKU) {
          vendorScores['frame-destination'] -= 5; // Large penalty for no mapping
        }
        
        if (!mapping.frameItEasySKU) {
          vendorScores['frame-it-easy'] -= 5; // Large penalty for no mapping
        }
      } else {
        // No mapping found, prefer in-house
        vendorScores['in-house'] += 2;
      }
    }
    
    // Check vendor availability
    if (!vendors.frameDest.active) {
      vendorScores['frame-destination'] = -10;
    }
    
    if (!vendors.frameItEasy.active) {
      vendorScores['frame-it-easy'] = -10;
    }
    
    // Determine best vendor based on scores
    let bestVendor = 'in-house';
    let highestScore = vendorScores['in-house'];
    
    if (vendorScores['frame-destination'] > highestScore) {
      bestVendor = 'frame-destination';
      highestScore = vendorScores['frame-destination'];
    }
    
    if (vendorScores['frame-it-easy'] > highestScore) {
      bestVendor = 'frame-it-easy';
      highestScore = vendorScores['frame-it-easy'];
    }
    
    return {
      vendor: bestVendor,
      scores: vendorScores,
      reason: `Selected based on product compatibility and vendor availability (Score: ${highestScore})`
    };
  } catch (error) {
    console.error('Error determining vendor:', error);
    // Default to in-house on error
    return {
      vendor: 'in-house',
      reason: 'Error in vendor determination process, defaulting to in-house'
    };
  }
}
