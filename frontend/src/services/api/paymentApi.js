import axiosInstance from './axiosInstance';
import { normalizeError } from '../../utils/errorHandler';

export const paymentApi = {
  createOrder: async (data) => {
    try {
      const response = await axiosInstance.post('/payment/create-order', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  verifyPayment: async (data) => {
    try {
      const response = await axiosInstance.post('/payment/verify', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  getPaymentStatus: async (registrationId) => {
    try {
      const response = await axiosInstance.get(`/payment/status/${registrationId}`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
};
