import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter;

if (config.smtpHost && config.smtpUser && config.smtpPass) {
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
} else {
  logger.warn('SMTP credentials missing. Emails will not be sent.');
}

export const sendWelcomeEmail = async (email, name) => {
  if (!transporter) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
      <h1 style="color: #4CAF50;">Welcome to Our Store!</h1>
      <p style="font-size: 16px;">Hi ${name},</p>
      <p style="font-size: 16px;">We are thrilled to have you here. Browse our latest collections and let us know if you need any help.</p>
      <p style="font-size: 14px; color: #777;">Thank you for joining!</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.fromEmail,
      to: email,
      subject: 'Welcome to Our Store!',
      html,
    });
    logger.info(`Welcome email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending welcome email to ${email}: ${error.message}`);
  }
};

export const sendOrderReceipt = async (email, name, orderNumber, total) => {
  if (!transporter) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2196F3;">Order Confirmed!</h1>
      <p style="font-size: 16px;">Hi ${name},</p>
      <p style="font-size: 16px;">Thank you for your purchase. We have received your payment and are processing your order.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Amount Paid:</strong> NGN ${total}</p>
      </div>
      <p style="font-size: 14px; color: #777;">You will receive another update when your order ships.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.fromEmail,
      to: email,
      subject: `Order Receipt: ${orderNumber}`,
      html,
    });
    logger.info(`Order receipt sent to ${email} for order ${orderNumber}`);
  } catch (error) {
    logger.error(`Error sending receipt email to ${email}: ${error.message}`);
  }
};
