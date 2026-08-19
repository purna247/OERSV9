import axiosInstance from './axiosInstance';
import { normalizeError } from '../../utils/errorHandler';

export const adminApi = {
  getDashboardSummary: async () => {
    try {
      const response = await axiosInstance.get('/admin/dashboard-summary');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Programs
  getPrograms: async () => {
    try {
      const response = await axiosInstance.get('/admin/programs');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  createProgram: async (data) => {
    try {
      const response = await axiosInstance.post('/admin/programs', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  updateProgram: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/admin/programs/${id}`, data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  deleteProgram: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/programs/${id}`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Students Directory
  getStudents: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/admin/students', { params });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  updateStudentStatus: async (id, status) => {
    try {
      const response = await axiosInstance.put(`/admin/students/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  resetStudentPassword: async (id) => {
    try {
      const response = await axiosInstance.post(`/admin/students/${id}/reset-password`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  bulkUpdateCGPA: async (data) => {
    try {
      const response = await axiosInstance.put('/admin/students-cgpa/bulk', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Advisors Directory
  getAdvisors: async () => {
    try {
      const response = await axiosInstance.get('/admin/advisors');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  deleteAdvisor: async (id) => {
    try {
      const response = await axiosInstance.delete(`/admin/advisors/${id}`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  reactivateAdvisor: async (id) => {
    try {
      const response = await axiosInstance.put(`/admin/advisors/${id}/reactivate`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Subjects
  getSubjects: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/admin/subjects', { params });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Bulk Uploads
  uploadStudents: async (formData) => {
    try {
      const response = await axiosInstance.post('/admin/upload-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  uploadAdvisors: async (formData) => {
    try {
      const response = await axiosInstance.post('/admin/upload-advisors', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  uploadSubjects: async (formData) => {
    try {
      const response = await axiosInstance.post('/admin/upload-subjects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  uploadBacklogs: async (formData) => {
    try {
      const response = await axiosInstance.post('/admin/upload-backlogs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  bulkClearBacklogs: async (data) => {
    try {
      const response = await axiosInstance.put('/admin/backlogs/bulk-clear', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Events
  createBulkEvents: async (data) => {
    try {
      const response = await axiosInstance.post('/admin/events/bulk', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  getEvents: async () => {
    try {
      const response = await axiosInstance.get('/admin/events');
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Registrations
  getRegistrations: async (eventId) => {
    try {
      const response = await axiosInstance.get('/admin/registrations', { params: { event_id: eventId } });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  confirmPayment: async (registrationId) => {
    try {
      const response = await axiosInstance.post(`/admin/registrations/${registrationId}/confirm-payment`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
