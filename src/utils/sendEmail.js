import nodemailer from 'nodemailer';
import { logger } from './logger.js';

export const sendEmail = async (options) => {
  try {
    // If SMTP credentials aren't provided in .env, just log it (useful for dev/testing)
    if (!process.env.SMTP_HOST) {
      logger.info(`[MOCK EMAIL] To: ${options.email} | Subject: ${options.subject}`);
      logger.info(`[MOCK EMAIL] Content: ${options.message}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const message = {
      from: `${process.env.FROM_NAME || 'Nikdel Webstore'} <${process.env.FROM_EMAIL || 'noreply@nikdel.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || undefined
    };

    const info = await transporter.sendMail(message);
    logger.info(`Email sent: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending email:', error);
  }
};
