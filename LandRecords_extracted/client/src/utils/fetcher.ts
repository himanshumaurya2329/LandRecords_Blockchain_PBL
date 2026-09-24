// API fetcher utility for client-side API calls
import { API_CONFIG, apiCall, auth } from '@/lib/fabric-api';

const apiFetcher = {
  // Authentication
  async login(credentials: { username: string; password: string }) {
    return await auth.login(credentials.username, credentials.password);
  },

  // Applications
  async getUserApplications() {
    return await apiCall(API_CONFIG.ENDPOINTS.LAND.APPLICATIONS);
  },

  async createApplication(formData: any) {
    return await apiCall(API_CONFIG.ENDPOINTS.LAND.CREATE, {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  async queryApplicationsByStatus(status: string) {
    return await apiCall(`${API_CONFIG.ENDPOINTS.LAND.APPLICATIONS}/status/${status}`);
  },

  async verifyApplication(data: { applicationId: string }) {
    return await apiCall(API_CONFIG.ENDPOINTS.LAND.VERIFY(data.applicationId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateSurveyReport(data: any) {
    return await apiCall(API_CONFIG.ENDPOINTS.LAND.SURVEY(data.applicationId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async approveApplication(data: { applicationId: string }) {
    return await apiCall(API_CONFIG.ENDPOINTS.LAND.APPROVE(data.applicationId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Generic API call
  async call(endpoint: string, options: RequestInit = {}) {
    return await apiCall(endpoint, options);
  },
};

export default apiFetcher;