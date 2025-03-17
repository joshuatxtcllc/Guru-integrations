/**
 * Frame Guru Product Management System
 * Handles product catalog, inventory, and pricing for both standard and custom framing
 */

const { Product, FramingTier } = require('../models/orderSchema');
const mongoose = require('mongoose');
const config = require('../config/config');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const express = require('express');
const router = express.Router();

// Configure AWS S3
AWS.config.update({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
});

const s3 = new AWS.S3();

// Configure multer for file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: config.aws.bucket,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const folderPath = req.body.fileType || 'products';
      const fileName = `${folderPath}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'model/gltf-binary', 'model/gltf+json'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and glTF models are allowed.'), false);
    }
    cb(null, true);
  }
});

/**
 * Get all products with optional filtering
 */
async function getAllProducts(filters = {}) {
  try {
    let query = { isActive: true };
    
    // Apply filters
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.frameType) {
      query.frameType = filters.frameType;
    }
    
    const products = await Product.find(query).sort({ name: 1 });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Get a single product by ID
 */
async function getProductById(productId) {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
}

/**
 * Create a new product
 */
async function createProduct(productData) {
  try {
    const product = new Product(productData);
    await product.save();
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update an existing product
 */
async function updateProduct(productId, updates) {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
}

/**
 * Deactivate a product (soft delete)
 */
async function deactivateProduct(productId) {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    console.error(`Error deactivating product ${productId}:`, error);
    throw error;
  }
}

/**
 * Update product inventory
 */
async function updateInventory(productId, sizeUpdates) {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    for (const size of product.sizes) {
      if (sizeUpdates[size.size] !== undefined) {
        size.inventoryCount = sizeUpdates[size.size];
      }
    }
    
    await product.save();
    return product;
  } catch (error) {
    console.error(`Error updating inventory for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Get all framing tiers
 */
async function getAllFramingTiers() {
  try {
    const tiers = await FramingTier.find({ isActive: true }).sort({ tier: 1 });
    return tiers;
  } catch (error) {
    console.error('Error fetching framing tiers:', error);
    throw error;
  }
}

/**
 * Create a new framing tier
 */
async function createFramingTier(tierData) {
  try {
    const tier = new FramingTier(tierData);
    await tier.save();
    return tier;
  } catch (error) {
    console.error('Error creating framing tier:', error);
    throw error;
  }
}

/**
 * Update an existing framing tier
 */
async function updateFramingTier(tierId, updates) {
  try {
    const tier = await FramingTier.findByIdAndUpdate(
      tierId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!tier) {
      throw new Error('Framing tier not found');
    }
    return tier;
  } catch (error) {
    console.error(`Error updating framing tier ${tierId}:`, error);
    throw error;
  }
}

/**
 * Calculate price for a custom framing job
 */
async function calculateCustomFramingPrice(config) {
  try {
    // Get the base tier pricing
    const tier = await FramingTier.findOne({ tier: config.tier });
    if (!tier) {
      throw new Error(`Invalid framing tier: ${config.tier}`);
    }
    
    let price = tier.basePrice;
    
    // Add size multiplier
    const sizeDimensions = {
      '8x10': { multiplier: 1.0 },
      '11x14': { multiplier: 1.3 },
      '16x20': { multiplier: 1.7 },
      '18x24': { multiplier: 2.0 },
      '20x30': { multiplier: 2.5 },
      '24x36': { multiplier: 3.0 }
    };
    
    if (sizeDimensions[config.size]) {
      price *= sizeDimensions[config.size].multiplier;
    } else {
      // Custom size calculation based on dimensions
      if (config.width && config.height) {
        const area = config.width * config.height;
        const standardArea = 8 * 10; // 8x10 is our base
        const customMultiplier = Math.sqrt(area / standardArea);
        price *= customMultiplier;
      }
    }
    
    // Add features
    if (config.features) {
      if (config.features.includes('double_mat')) {
        price += 15;
      }
      
      if (config.features.includes('museum_glass')) {
        price += 40;
      }
      
      if (config.features.includes('spacers')) {
        price += 20;
      }
      
      if (config.features.includes('conservation_mount')) {
        price += 35;
      }
    }
    
    // Add complexity factor for tier 3 custom objects
    if (config.tier === 3 && config.complexityFactor) {
      price *= (1 + config.complexityFactor);
    }
    
    // Round to nearest cent
    return Math.round(price * 100) / 100;
  } catch (error) {
    console.error('Error calculating custom framing price:', error);
    throw error;
  }
}

/**
 * Initialize standard product catalog with starter data
 */
async function initializeProductCatalog() {
  try {
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('Product catalog already initialized, skipping');
      return { success: true, message: 'Catalog already exists' };
    }
    
    // Create standard frame products
    const standardFrames = [
      {
        name: 'Classic Wood Frame',
        sku: 'FRM-CLS-001',
        category: 'frame',
        description: 'Traditional wood frame with a timeless profile',
        basePrice: 45.99,
        sizes: [
          { size: '8x10', price: 45.99, inventoryCount: 50 },
          { size: '11x14', price: 59.99, inventoryCount: 40 },
          { size: '16x20', price: 79.99, inventoryCount: 30 },
          { size: '18x24', price: 99.99, inventoryCount: 20 },
          { size: '20x30', price: 129.99, inventoryCount: 15 },
          { size: '24x36', price: 159.99, inventoryCount: 10 }
        ],
        frameType: 'standard',
        availableColors: ['walnut', 'black', 'natural', 'espresso', 'white'],
        colorImages: {
          walnut: 'frames/classic-walnut.jpg',
          black: 'frames/classic-black.jpg',
          natural: 'frames/classic-natural.jpg',
          espresso: 'frames/classic-espresso.jpg',
          white: 'frames/classic-white.jpg'
        },
        modelFile: 'models/classic_frame.glb',
        isActive: true
      },
      {
        name: 'Modern Metal Frame',
        sku: 'FRM-MOD-001',
        category: 'frame',
        description: 'Sleek aluminum frame with clean lines',
        basePrice: 49.99,
        sizes: [
          { size: '8x10', price: 49.99, inventoryCount: 40 },
          { size: '11x14', price: 69.99, inventoryCount: 35 },
          { size: '16x20', price: 89.99, inventoryCount: 25 },
          { size: '18x24', price: 109.99, inventoryCount: 20 },
          { size: '20x30', price: 139.99, inventoryCount: 15 },
          { size: '24x36', price: 179.99, inventoryCount: 10 }
        ],
        frameType: 'standard',
        availableColors: ['silver', 'black', 'gold', 'gunmetal', 'white'],
        colorImages: {
          silver: 'frames/modern-silver.jpg',
          black: 'frames/modern-black.jpg',
          gold: 'frames/modern-gold.jpg',
          gunmetal: 'frames/modern-gunmetal.jpg',
          white: 'frames/modern-white.jpg'
        },
        modelFile: 'models/modern_frame.glb',
        isActive: true
      },
      {
        name: 'Floating Frame',
        sku: 'FRM-FLT-001',
        category: 'frame',
        description: 'Contemporary floating frame for canvas and board art',
        basePrice: 79.99,
        sizes: [
          { size: '8x10', price: 79.99, inventoryCount: 30 },
          { size: '11x14', price: 99.99, inventoryCount: 25 },
          { size: '16x20', price: 129.99, inventoryCount: 20 },
          { size: '18x24', price: 149.99, inventoryCount: 15 },
          { size: '20x30', price: 179.99, inventoryCount: 10 },
          { size: '24x36', price: 209.99, inventoryCount: 5 }
        ],
        frameType: 'standard',
        availableColors: ['black', 'walnut', 'white', 'natural'],
        colorImages: {
          black: 'frames/floating-black.jpg',
          walnut: 'frames/floating-walnut.jpg',
          white: 'frames/floating-white.jpg',
          natural: 'frames/floating-natural.jpg'
        },
        modelFile: 'models/floating_frame.glb',
        isActive: true
      }
    ];
    
    // Create mat frame products
    const matFrames = [
      {
        name: 'Single Mat Frame',
        sku: 'FRM-MAT-001',
        category: 'frame',
        description: 'Classic frame with single acid-free mat',
        basePrice: 69.99,
        sizes: [
          { size: '8x10', price: 69.99, inventoryCount: 40 },
          { size: '11x14', price: 89.99, inventoryCount: 35 },
          { size: '16x20', price: 119.99, inventoryCount: 25 },
          { size: '18x24', price: 149.99, inventoryCount: 20 },
          { size: '20x30', price: 179.99, inventoryCount: 15 },
          { size: '24x36', price: 209.99, inventoryCount: 10 }
        ],
        frameType: 'mat',
        availableColors: ['walnut', 'black', 'natural', 'white'],
        colorImages: {
          walnut: 'frames/matframe-walnut.jpg',
          black: 'frames/matframe-black.jpg',
          natural: 'frames/matframe-natural.jpg',
          white: 'frames/matframe-white.jpg'
        },
        modelFile: 'models/mat_frame.glb',
        isActive: true
      }
    ];
    
    // Create shadowbox products
    const shadowboxFrames = [
      {
        name: 'Standard Shadowbox',
        sku: 'FRM-SHD-001',
        category: 'frame',
        description: 'Float mount shadowbox for dimensional display',
        basePrice: 99.99,
        sizes: [
          { size: '8x10', price: 99.99, inventoryCount: 30 },
          { size: '11x14', price: 129.99, inventoryCount: 25 },
          { size: '16x20', price: 159.99, inventoryCount: 20 },
          { size: '18x24', price: 189.99, inventoryCount: 15 },
          { size: '20x30', price: 229.99, inventoryCount: 10 },
          { size: '24x36', price: 279.99, inventoryCount: 5 }
        ],
        frameType: 'shadowbox',
        availableColors: ['black', 'walnut', 'white', 'espresso'],
        colorImages: {
          black: 'frames/shadowbox-black.jpg',
          walnut: 'frames/shadowbox-walnut.jpg',
          white: 'frames/shadowbox-white.jpg',
          espresso: 'frames/shadowbox-espresso.jpg'
        },
        modelFile: 'models/shadowbox_frame.glb',
        isActive: true
      }
    ];
    
    // Create standard framing tiers
    const framingTiers = [
      {
        tier: 1,
        name: 'Basic Custom',
        description: 'Custom sizing with standard materials and techniques',
        basePrice: 79.99,
        features: [
          'Custom sizing',
          'Standard frame profiles',
          'Basic acid-free matting',
          'Regular glass'
        ],
        turnaroundDays: 7,
        isActive: true
      },
      {
        tier: 2,
        name: 'Premium Custom',
        description: 'Premium materials with advanced framing techniques',
        basePrice: 149.99,
        features: [
          'Custom sizing',
          'Premium frame profiles',
          'Double mat option',
          'UV-protective glass',
          'Specialized mounting'
        ],
        turnaroundDays: 10,
        isActive: true
      },
      {
        tier: 3,
        name: 'Museum/Conservation',
        description: 'Museum-quality framing with archival materials',
        basePrice: 249.99,
        features: [
          'Custom sizing',
          'Archival matting',
          'Museum glass',
          'Object mounting',
          'Conservation techniques',
          'Specialized design consultation'
        ],
        turnaroundDays: 14,
        isActive: true
      }
    ];
    
    // Save all products to database
    await Product.insertMany([...standardFrames, ...matFrames, ...shadowboxFrames]);
    
    // Save framing tiers
    await FramingTier.insertMany(framingTiers);
    
    return {
      success: true,
      message: 'Product catalog initialized successfully'
    };
  } catch (error) {
    console.error('Error initializing product catalog:', error);
    throw error;
  }
}

// API Routes
router.get('/', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      frameType: req.query.frameType
    };
    
    const products = await getAllProducts(filters);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deactivateProduct(req.params.id);
    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      fileUrl: req.file.location,
      fileName: req.file.key
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/framing-tiers', async (req, res) => {
  try {
    const tiers = await getAllFramingTiers();
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/calculate-price', async (req, res) => {
  try {
    const price = await calculateCustomFramingPrice(req.body);
    res.json({ price });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/initialize', async (req, res) => {
  try {
    const result = await initializeProductCatalog();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
  updateInventory,
  getAllFramingTiers,
  createFramingTier,
  updateFramingTier,
  calculateCustomFramingPrice,
  initializeProductCatalog
};
