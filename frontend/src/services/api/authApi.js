import axiosInstance from './axiosInstance';
import { normalizeError } from '../../utils/errorHandler';

export const authApi = {
  login: async (identifier, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { identifier, password });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  logout: async () => {
    try {
      const response = await axiosInstance.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
};
