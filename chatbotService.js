/**
 * Frame Guru Chatbot Service
 * Handles order status inquiries and customer support through an AI-powered chatbot
 */

const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const { Customer } = require('../models/orderSchema');
const dialogflow = require('@google-cloud/dialogflow');

// Configure Dialogflow client
const dialogflow = require('dialogflow');
const config = require('../config/config');

const dialogflowClient = new dialogflow.SessionsClient({
  credentials: {
    client_email: config.dialogflow.clientEmail,
    private_key: config.dialogflow.privateKey
  }
});

/**
 * Process incoming chat messages and return appropriate responses
 */
async function processChatMessage(userId, message) {
  try {
    // Create a session path
    const sessionPath = dialogflowClient.sessionPath(
      config.dialogflow.projectId,
      userId
    );

    // Create the request
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'en-US'
        }
      }
    };

    // Send request to Dialogflow
    const responses = await dialogflowClient.detectIntent(request);
    const result = responses[0].queryResult;
    
    // Check if we need to fulfill an order status intent
    if (result.intent.displayName === 'order_status') {
      // Extract order number parameter
      const orderNumber = result.parameters.fields.order_number.stringValue;
      
      if (orderNumber) {
        // Fulfill with actual order data
        const orderStatus = await getOrderStatus(orderNumber);
        return {
          type: 'order_status',
          message: orderStatus.message,
          data: orderStatus.data
        };
      }
    }
    
    // Return the standard response from Dialogflow
    return {
      type: 'text',
      message: result.fulfillmentText
    };
  } catch (error) {
    console.error('Error processing chat message:', error);
    return {
      type: 'error',
      message: 'Sorry, I encountered an error processing your request. Please try again later.'
    };
  }
}

/**
 * Get order status information by order number
 */
async function getOrderStatus(orderNumber) {
  try {
    const order = await Order.findOne({ orderNumber }).populate('customer');
    
    if (!order) {
      return {
        message: `I couldn't find an order with number ${orderNumber}. Please check the number and try again.`
      };
    }
    
    // Format status message based on current status
    let statusMessage = '';
    let estimatedCompletion = '';
    
    if (order.estimatedCompletion) {
      // Format date: March 22, 2025
      estimatedCompletion = new Date(order.estimatedCompletion).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    switch (order.currentStatus) {
      case 'placed':
        statusMessage = `Your order #${orderNumber} has been received and is awaiting payment confirmation.`;
        break;
      case 'payment_confirmed':
        statusMessage = `Your payment for order #${orderNumber} has been confirmed. We'll begin production soon.`;
        break;
      case 'in_production':
        statusMessage = `Your order #${orderNumber} is currently in production.${estimatedCompletion ? ` We expect to complete it by ${estimatedCompletion}.` : ''}`;
        break;
      case 'quality_check':
        statusMessage = `Your order #${orderNumber} is in the final quality check phase.`;
        break;
      case 'ready_for_pickup':
        statusMessage = `Great news! Your order #${orderNumber} is ready for pickup at our studio.`;
        break;
      case 'shipped':
        statusMessage = `Your order #${orderNumber} has been shipped${order.trackingNumber ? ` with tracking number: ${order.trackingNumber}` : ''}.`;
        break;
      case 'delivered':
        statusMessage = `Your order #${orderNumber} has been delivered. We hope you love your frames!`;
        break;
      case 'cancelled':
        statusMessage = `Your order #${orderNumber} has been cancelled.`;
        break;
      default:
        statusMessage = `Your order #${orderNumber} is currently being processed.`;
    }
    
    // Add details about the order
    const orderDetails = {
      orderNumber: order.orderNumber,
      status: order.currentStatus,
      dateCreated: new Date(order.createdAt).toLocaleDateString(),
      estimatedCompletion: estimatedCompletion || 'Not yet scheduled',
      items: order.items.length,
      total: order.totalAmount.toFixed(2)
    };
    
    // If the order is shipped, add tracking info
    if (order.currentStatus === 'shipped' && order.trackingNumber) {
      orderDetails.trackingNumber = order.trackingNumber;
    }
    
    return {
      message: statusMessage,
      data: orderDetails
    };
  } catch (error) {
    console.error('Error getting order status:', error);
    return {
      message: 'Sorry, I encountered an error retrieving your order status. Please try again later.'
    };
  }
}

/**
 * Handle webhook requests from Dialogflow
 */
function handleDialogflowWebhook(req, res) {
  const intent = req.body.queryResult.intent.displayName;
  const parameters = req.body.queryResult.parameters;
  
  async function orderStatusHandler() {
    const orderNumber = parameters.order_number;
    
    if (!orderNumber) {
      return {
        fulfillmentText: 'What\'s your order number? You can find it in your confirmation email.'
      };
    }
    
    try {
      // Use the getOrderStatus function and respond accordingly
      const statusResult = await getOrderStatus(orderNumber);
      return {
        fulfillmentText: statusResult.message
      };
    } catch (error) {
      console.error('Error in orderStatusHandler:', error);
      return {
        fulfillmentText: 'Sorry, I couldn\'t retrieve your order status at this moment. Please try again later.'
      };
    }
  }
  
  // Process request based on intent
  const handleIntent = async () => {
    switch (intent) {
      case 'order_status':
        return await orderStatusHandler();
      default:
        return {
          fulfillmentText: 'I don\'t understand that request. Can you try again?'
        };
    }
  };
  
  // Execute the handler and send the response
  handleIntent()
    .then(response => {
      res.json(response);
    })
    .catch(error => {
      console.error('Error in webhook handler:', error);
      res.json({
        fulfillmentText: 'Sorry, something went wrong. Please try again later.'
      });
    });
}

/**
 * Chat history management
 */
const chatSessions = new Map();

function saveChatMessage(sessionId, message, isUser) {
  if (!chatSessions.has(sessionId)) {
    chatSessions.set(sessionId, []);
  }
  
  const session = chatSessions.get(sessionId);
  session.push({
    message,
    timestamp: new Date(),
    isUser
  });
  
  // Limit history to last 50 messages
  if (session.length > 50) {
    session.shift();
  }
}

function getChatHistory(sessionId) {
  return chatSessions.has(sessionId) ? chatSessions.get(sessionId) : [];
}

// Express route for chat interactions
router.post('/message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing userId or message' });
    }
    
    // Save user message to history
    saveChatMessage(userId, message, true);
    
    // Process the message
    const response = await processChatMessage(userId, message);
    
    // Save bot response to history
    saveChatMessage(userId, response.message, false);
    
    res.json(response);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'An error occurred processing your message',
      type: 'error'
    });
  }
});

// Express route for chat history
router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  res.json(getChatHistory(sessionId));
});

// Express route for Dialogflow webhook
router.post('/webhook', handleDialogflowWebhook);

module.exports = {
  router,
  processChatMessage,
  getOrderStatus
};
