/**
 * Frame Guru Chatbot Service
 * Handles order status inquiries and customer support through an AI-powered chatbot
 */

const express = require('express');
const router = express.Router();
const { Order } = require('../models/orderSchema');
const { Customer } = require('../models/orderSchema');
const dialogflow = require('@google-cloud/dialogflow');
const config = require('../config/config');

// Initialize a session client
const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    client_email: config.dialogflow.clientEmail,
    private_key: config.dialogflow.privateKey && config.dialogflow.privateKey.replace(/\\n/g, '\n')
  },
  projectId: config.dialogflow.projectId
});

/**
 * Process a customer message through Dialogflow
 * @param {String} message - The customer's message
 * @param {String} sessionId - Unique session ID for this conversation
 */
async function processMessage(message, sessionId) {
  try {
    const sessionPath = sessionClient.projectAgentSessionPath(
      config.dialogflow.projectId, 
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'en-US',
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    return responses[0].queryResult;
  } catch (error) {
    console.error('Error processing message with Dialogflow:', error);
    return {
      fulfillmentText: 'Sorry, I\'m having trouble understanding right now. Please try again later.'
    };
  }
}

// Handle chatbot interactions
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    const response = await processMessage(message, sessionId);

    return res.json({
      reply: response.fulfillmentText,
      intent: response.intent ? response.intent.displayName : null,
      parameters: response.parameters ? response.parameters.fields : {}
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return res.status(500).json({ error: 'Failed to process message' });
  }
});

// Check order status via chatbot
router.post('/order-status', async (req, res) => {
  try {
    const { orderId, email } = req.body;

    if (!orderId && !email) {
      return res.status(400).json({ error: 'Either orderId or email is required' });
    }

    let order;

    if (orderId) {
      order = await Order.findById(orderId);
    } else {
      const customer = await Customer.findOne({ email });
      if (!customer) {
        return res.json({ 
          status: 'not_found',
          message: 'No customer found with that email address.'
        });
      }

      order = await Order.findOne({ customer: customer._id }).sort({ createdAt: -1 });
    }

    if (!order) {
      return res.json({ 
        status: 'not_found',
        message: 'Order not found. Please check your order ID or contact support.'
      });
    }

    return res.json({
      status: 'found',
      orderStatus: order.status,
      estimatedCompletion: order.estimatedCompletionDate,
      message: `Your order #${order._id} is currently ${order.status}.`
    });
  } catch (error) {
    console.error('Order status check error:', error);
    return res.status(500).json({ error: 'Failed to check order status' });
  }
});

module.exports = {
  router,
  processMessage
};