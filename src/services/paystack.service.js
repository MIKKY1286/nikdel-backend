import axios from 'axios';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${config.paystackSecretKey}`,
    'Content-Type': 'application/json',
  },
});

export const initializePayment = async (amountInNaira, email, reference) => {
  try {
    // Paystack expects amounts in kobo (base unit)
    const amountInKobo = amountInNaira * 100;
    
    const response = await paystackClient.post('/transaction/initialize', {
      amount: amountInKobo,
      email,
      reference,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    });

    return response.data;
  } catch (error) {
    logger.error(`Paystack Init Error: ${error.response?.data?.message || error.message}`);
    throw new Error('Failed to initialize payment with Paystack');
  }
};

export const verifyPayment = async (reference) => {
  try {
    const response = await paystackClient.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    logger.error(`Paystack Verify Error: ${error.response?.data?.message || error.message}`);
    throw new Error('Failed to verify payment with Paystack');
  }
};
