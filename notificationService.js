/**
 * Frame Guru Notification Service
 * Handles automated notifications for order status updates, shipping, and customer follow-ups
 */

const { Notification, Order, Customer /**
 * Schedule follow-up notifications for completed orders
 */
async function scheduleFollowUpNotifications() {
  try {
    // Find orders delivered in the last 7 days that haven't received a follow-up
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentDeliveries = await Order.find({
      currentStatus: 'delivered',
      completedDate: { $gte: sevenDaysAgo }
    }).populate('customer');
    
    // Check if follow-up notifications already exist
    const followUps = [];
    for (const order of recentDeliveries) {
      const existingFollowUp = await Notification.findOne({
        order: order._id,
        type: 'follow_up'
      });
      
      if (!existingFollowUp) {
        // Schedule a follow-up notification for tomorrow
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 1);
        scheduledDate.setHours(10, 0, 0, 0); // 10 AM
        
        const followUpNotification = new Notification({
          recipient: order.customer._id,
          order: order._id,
          type: 'follow_up',
          channel: 'email',
          subject: 'How are you enjoying your frames?',
          content: 'Follow-up email content will be generated at sending time',
          status: 'pending',
          scheduledFor: scheduledDate
        });
        
        await followUpNotification.save();
        followUps.push(followUpNotification);
      }
    }
    
    return {
      success: true,
      scheduledCount: followUps.length
    };
  } catch (error) {
    console.error('Error in scheduleFollowUpNotifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send a test notification
 */
async function sendTestNotification(email, phone) {
  try {
    const testResults = {
      email: null,
      sms: null
    };
    
    if (email) {
      testResults.email = await sendEmail(
        email,
        'Frame Guru Notification System Test',
        'test_notification',
        {
          testTime: new Date().toLocaleString()
        }
      );
    }
    
    if (phone) {
      testResults.sms = await sendSMS(
        phone,
        'This is a test message from Frame Guru. If you received this, our notification system is working correctly.'
      );
    }
    
    return {
      success: true,
      results: testResults
    };
  } catch (error) {
    console.error('Error in sendTestNotification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Scheduled tasks using node-cron
const cron = require('node-cron');

// Process pending notifications every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled task: processPendingNotifications');
  await processPendingNotifications();
});

// Schedule follow-up notifications once a day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled task: scheduleFollowUpNotifications');
  await scheduleFollowUpNotifications();
});

module.exports = {
  notifyOrderStatusChange,
  processPendingNotifications,
  scheduleFollowUpNotifications,
  sendTestNotification
}; = require('../models/orderSchema');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const config = require('../config/config');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises;

// Initialize email transporter
const emailTransporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

// Initialize Twilio client
const twilioClient = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

/**
 * Load and compile an email template
 */
async function loadEmailTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.ejs`);
    const template = await fs.readFile(templatePath, 'utf8');
    return ejs.render(template, data);
  } catch (error) {
    console.error(`Error loading email template '${templateName}':`, error);
    throw error;
  }
}

/**
 * Send an email notification
 */
async function sendEmail(recipient, subject, templateName, data) {
  try {
    const htmlContent = await loadEmailTemplate(templateName, data);
    
    const mailOptions = {
      from: `"Frame Guru" <${config.email.fromAddress}>`,
      to: recipient,
      subject: subject,
      html: htmlContent
    };
    
    const info = await emailTransporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send an SMS notification
 */
async function sendSMS(phoneNumber, message) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: phoneNumber
    });
    
    return {
      success: true,
      messageId: result.sid
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create and send notification based on order status change
 */
async function notifyOrderStatusChange(orderId, status, additionalData = {}) {
  try {
    // Fetch order with customer details
    const order = await Order.findById(orderId).populate('customer');
    
    if (!order) {
      throw new Error(`Order not found with ID: ${orderId}`);
    }
    
    const customer = order.customer;
    let notificationType, subject, emailTemplate, smsMessage;
    
    // Determine notification content based on status
    switch (status) {
      case 'placed':
        notificationType = 'order_confirmation';
        subject = `Order Confirmation: #${order.orderNumber}`;
        emailTemplate = 'order_confirmation';
        smsMessage = `Your Frame Guru order #${order.orderNumber} has been placed. Total: $${order.totalAmount.toFixed(2)}. Track your order on our website.`;
        break;
        
      case 'payment_confirmed':
        notificationType = 'payment_confirmation';
        subject = `Payment Confirmed: Order #${order.orderNumber}`;
        emailTemplate = 'payment_confirmation';
        smsMessage = `Payment confirmed for your Frame Guru order #${order.orderNumber}. We'll begin working on it soon!`;
        break;
        
      case 'in_production':
        notificationType = 'status_update';
        subject = `Your Order #${order.orderNumber} is in Production`;
        emailTemplate = 'status_update';
        smsMessage = `Your Frame Guru order #${order.orderNumber} is now in production. Estimated completion: ${order.estimatedCompletion ? new Date(order.estimatedCompletion).toLocaleDateString() : 'To be determined'}`;
        break;
        
      case 'quality_check':
        notificationType = 'status_update';
        subject = `Quality Check: Order #${order.orderNumber}`;
        emailTemplate = 'status_update';
        smsMessage = `Your Frame Guru order #${order.orderNumber} is now in quality check. Almost ready!`;
        break;
        
      case 'ready_for_pickup':
        notificationType = 'ready_for_pickup';
        subject = `Your Order #${order.orderNumber} is Ready for Pickup`;
        emailTemplate = 'ready_for_pickup';
        smsMessage = `Great news! Your Frame Guru order #${order.orderNumber} is ready for pickup at our studio.`;
        break;
        
      case 'shipped':
        notificationType = 'shipping_notification';
        subject = `Your Order #${order.orderNumber} Has Shipped`;
        emailTemplate = 'shipping_notification';
        smsMessage = `Your Frame Guru order #${order.orderNumber} has shipped${order.trackingNumber ? `. Tracking #: ${order.trackingNumber}` : ''}!`;
        break;
        
      case 'delivered':
        notificationType = 'follow_up';
        subject = `How are you enjoying your frames?`;
        emailTemplate = 'follow_up';
        smsMessage = `Your Frame Guru order #${order.orderNumber} has been delivered. We hope you love your frames! Please let us know if you have any questions.`;
        break;
        
      default:
        notificationType = 'status_update';
        subject = `Order #${order.orderNumber} Status Updated`;
        emailTemplate = 'status_update';
        smsMessage = `Your Frame Guru order #${order.orderNumber} status has been updated to: ${status}`;
    }
    
    // Prepare template data
    const templateData = {
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email
      },
      order: {
        orderNumber: order.orderNumber,
        items: order.items,
        subtotal: order.subtotal.toFixed(2),
        tax: order.taxAmount.toFixed(2),
        shipping: order.shippingAmount.toFixed(2),
        discount: order.discountAmount.toFixed(2),
        total: order.totalAmount.toFixed(2),
        status: status,
        trackingNumber: order.trackingNumber,
        estimatedCompletion: order.estimatedCompletion ? 
          new Date(order.estimatedCompletion).toLocaleDateString() : null
      },
      studio: {
        address: config.studioAddress,
        phone: config.studioPhone,
        hours: config.studioHours
      },
      ...additionalData
    };
    
    // Create notification records for each channel
    const notifications = [];
    
    // Email notification
    if (customer.notificationPreferences.email) {
      const emailNotification = new Notification({
        recipient: customer._id,
        order: order._id,
        type: notificationType,
        channel: 'email',
        subject: subject,
        content: await loadEmailTemplate(emailTemplate, templateData),
        status: 'pending',
        scheduledFor: new Date()
      });
      
      await emailNotification.save();
      notifications.push(emailNotification);
      
      // Send email immediately
      const emailResult = await sendEmail(
        customer.email,
        subject,
        emailTemplate,
        templateData
      );
      
      // Update notification status
      if (emailResult.success) {
        emailNotification.status = 'sent';
        emailNotification.sentAt = new Date();
      } else {
        emailNotification.status = 'failed';
        emailNotification.statusMessage = emailResult.error;
      }
      
      await emailNotification.save();
    }
    
    // SMS notification
    if (customer.notificationPreferences.sms && customer.phone) {
      const smsNotification = new Notification({
        recipient: customer._id,
        order: order._id,
        type: notificationType,
        channel: 'sms',
        content: smsMessage,
        status: 'pending',
        scheduledFor: new Date()
      });
      
      await smsNotification.save();
      notifications.push(smsNotification);
      
      // Send SMS immediately
      const smsResult = await sendSMS(customer.phone, smsMessage);
      
      // Update notification status
      if (smsResult.success) {
        smsNotification.status = 'sent';
        smsNotification.sentAt = new Date();
      } else {
        smsNotification.status = 'failed';
        smsNotification.statusMessage = smsResult.error;
      }
      
      await smsNotification.save();
    }
    
    return {
      success: true,
      notifications
    };
  } catch (error) {
    console.error('Error in notifyOrderStatusChange:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process and send all pending notifications
 */
async function processPendingNotifications() {
  try {
    const pendingNotifications = await Notification.find({
      status: 'pending',
      scheduledFor: { $lte: new Date() }
    }).populate('recipient').populate('order');
    
    for (const notification of pendingNotifications) {
      try {
        let result;
        
        switch (notification.channel) {
          case 'email':
            result = await sendEmail(
              notification.recipient.email,
              notification.subject,
              notification.type, // Using type as template name
              {
                customer: notification.recipient,
                order: notification.order,
                studio: {
                  address: config.studioAddress,
                  phone: config.studioPhone,
                  hours: config.studioHours
                }
              }
            );
            break;
            
          case 'sms':
            result = await sendSMS(
              notification.recipient.phone,
              notification.content
            );
            break;
            
          default:
            throw new Error(`Unsupported notification channel: ${notification.channel}`);
        }
        
        if (result.success) {
          notification.status = 'sent';
          notification.sentAt = new Date();
        } else {
          notification.status = 'failed';
          notification.statusMessage = result.error;
        }
      } catch (error) {
        console.error(`Error processing notification ${notification._id}:`, error);
        notification.status = 'failed';
        notification.statusMessage = error.message;
      }
      
      await notification.save();
    }
    
    return {
      success: true,
      processedCount: pendingNotifications.length
    };
  } catch (error) {
    console.error('Error in processPendingNotifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
