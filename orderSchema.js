/**
 * MongoDB schemas for the order tracking system
 * This file defines the data models for customers, products, orders, and notifications
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Customer Schema
const CustomerSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

// Update the lastModified date before saving
CustomerSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Frame Configuration Schema
const FrameConfigSchema = new Schema({
  frameType: {
    type: String,
    enum: ['standard', 'mat', 'shadowbox'],
    required: true
  },
  frameStyle: {
    type: String,
    required: true
  },
  frameColor: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  matColor: String,
  hasSecondMat: {
    type: Boolean,
    default: false
  },
  secondMatColor: String,
  artworkUrl: String,
  customObjectUrl: String,
  previewImageUrl: String,
  notes: String
});

// Product Schema
const ProductSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['frame', 'mat', 'glass', 'accessory'],
    required: true
  },
  description: String,
  basePrice: {
    type: Number,
    required: true
  },
  sizes: [{
    size: String,
    price: Number,
    inventoryCount: Number
  }],
  frameType: {
    type: String,
    enum: ['standard', 'mat', 'shadowbox']
  },
  availableColors: [String],
  colorImages: {
    type: Map,
    of: String
  },
  modelFile: String, // 3D model file path
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Custom Framing Tier Schema
const FramingTierSchema = new Schema({
  tier: {
    type: Number,
    required: true,
    enum: [1, 2, 3]
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  basePrice: {
    type: Number,
    required: true
  },
  features: [String],
  turnaroundDays: Number,
  isActive: {
    type: Boolean,
    default: true
  }
});

// Order Item Schema
const OrderItemSchema = new Schema({
  itemType: {
    type: String,
    enum: ['standard', 'custom'],
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  framingTier: {
    type: Schema.Types.ObjectId,
    ref: 'FramingTier'
  },
  frameConfig: FrameConfigSchema,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  notes: String,
  customerArtworkUrl: String
});

// Order Status History Schema
const StatusHistorySchema = new Schema({
  status: {
    type: String,
    enum: [
      'placed', 
      'payment_confirmed', 
      'in_production', 
      'quality_check', 
      'ready_for_pickup', 
      'shipped', 
      'delivered', 
      'cancelled'
    ],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: String,
  updatedBy: {
    type: String,
    required: true
  }
});

// Order Schema
const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [OrderItemSchema],
  statusHistory: [StatusHistorySchema],
  currentStatus: {
    type: String,
    enum: [
      'placed', 
      'payment_confirmed', 
      'in_production', 
      'quality_check', 
      'ready_for_pickup', 
      'shipped', 
      'delivered', 
      'cancelled'
    ],
    required: true,
    default: 'placed'
  },
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  shippingAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'square_pos', 'in_store', 'invoice'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentTransactionId: String,
  shippingMethod: {
    type: String,
    enum: ['pickup', 'local_delivery', 'standard_shipping', 'expedited_shipping']
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  trackingNumber: String,
  estimatedCompletion: Date,
  completedDate: Date,
  notes: String,
  source: {
    type: String,
    enum: ['website', 'in_store', 'phone', 'event'],
    default: 'website'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

// Update order lastModified and calculate totals
OrderSchema.pre('save', function(next) {
  this.lastModified = new Date();
  
  // Calculate totals
  let subtotal = 0;
  this.items.forEach(item => {
    subtotal += item.subtotal;
  });
  
  this.subtotal = subtotal;
  this.totalAmount = subtotal + this.taxAmount + this.shippingAmount - this.discountAmount;
  
  next();
});

// Add method to update order status
OrderSchema.methods.updateStatus = function(status, notes, updatedBy) {
  const statusUpdate = {
    status: status,
    timestamp: new Date(),
    notes: notes || '',
    updatedBy: updatedBy
  };
  
  this.statusHistory.push(statusUpdate);
  this.currentStatus = status;
  
  return this.save();
};

// Notification Schema
const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: [
      'order_confirmation', 
      'payment_confirmation', 
      'status_update', 
      'shipping_notification', 
      'ready_for_pickup', 
      'follow_up'
    ],
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'app'],
    required: true
  },
  subject: String,
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  statusMessage: String,
  scheduledFor: Date,
  sentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const Customer = mongoose.model('Customer', CustomerSchema);
const Product = mongoose.model('Product', ProductSchema);
const FramingTier = mongoose.model('FramingTier', FramingTierSchema);
const Order = mongoose.model('Order', OrderSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = {
  Customer,
  Product,
  FramingTier,
  Order,
  Notification
};
