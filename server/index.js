/**
 * Frame Guru - Server Entry Point
 * The main application server that initializes Express, connects to the database,
 * and sets up all routes and middleware.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/api/auth');
const productRoutes = require('./routes/api/products');
const orderRoutes = require('./routes/api/orders');
const customerRoutes = require('./routes/api/customers');
const adminRoutes = require('./routes/api/admin');
const chatbotRoutes = require('./services/chatbotService').router;

// Import services
const { initializeProductCatalog } = require('./services/productManagement');
const { processPendingNotifications } = require('./services/notificationService');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Vendor API routes - protected and requiring admin access
app.use('/api/vendors', authMiddleware, require('./routes/api/vendors'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));
  
  // Serve the index.html file for any route not handled by the API
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Error handling middleware - must be last
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    // Initialize product catalog if needed
    const catalogInitResult = await initializeProductCatalog();
    console.log('Product catalog initialization:', catalogInitResult.message);
    
    // Process any pending notifications
    const notificationResult = await processPendingNotifications();
    console.log('Initial notification processing complete:', 
      notificationResult.success ? 
      `${notificationResult.processedCount} notifications processed` : 
      notificationResult.error);
  } catch (error) {
    console.error('Error during server initialization:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server, just log the error
});

// Export app for testing
module.exports = app;
