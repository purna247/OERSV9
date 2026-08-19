import axiosInstance from './axiosInstance';
import { normalizeError } from '../../utils/errorHandler';

export const studentApi = {
  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/student/profile');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  uploadPhoto: async (formData) => {
    try {
      const response = await axiosInstance.post('/student/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  getEvents: async () => {
    try {
      const response = await axiosInstance.get('/student/events');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  registerForEvent: async (data) => {
    try {
      const response = await axiosInstance.post('/student/register', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  getRegistrations: async () => {
    try {
      const response = await axiosInstance.get('/student/registrations');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  getSchedule: async (eventId) => {
    try {
      const response = await axiosInstance.get(`/student/schedule?event_id=${eventId}`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  getAdmitCardData: async (eventId) => {
    try {
      const response = await axiosInstance.get(`/student/admit-card-data?event_id=${eventId}`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  getAttendance: async () => {
    try {
      const response = await axiosInstance.get('/student/attendance');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  downloadAdmitCard: async (eventId) => {
    try {
      const response = await axiosInstance.get(`/student/admit-card?event_id=${eventId}`, {
        responseType: 'blob' // Important for handling PDFs
      });
      return response.data;
    } catch (error) {
      // Need to handle blob errors differently because the error message might be hidden in the blob
      if (error.response && error.response.data instanceof Blob) {
         try {
             const text = await error.response.data.text();
             const data = JSON.parse(text);
             error.response.data = data;
         } catch (e) {
             // Fallback if not JSON
         }
      }
      throw normalizeError(error);
    }
  }
};
