import axiosInstance from './axiosInstance';
import { normalizeError } from '../../utils/errorHandler';

export const advisorApi = {
  previewAttendance: async (formData) => {
    try {
      const response = await axiosInstance.post('/advisor/upload-attendance/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  confirmAttendance: async (formData) => {
    try {
      const response = await axiosInstance.post('/advisor/upload-attendance/confirm', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
};
