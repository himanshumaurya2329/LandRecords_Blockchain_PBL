// API configuration for connecting to fabric-api
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_FABRIC_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      ME: '/api/auth/me',
      REGISTER: '/api/auth/register'
    },
    LAND: {
      APPLICATIONS: '/api/land/applications',
      CREATE: '/api/land/applications',
      GET_BY_ID: (id: string) => `/api/land/applications/${id}`,
      GET_BY_EMAIL: (email: string) => `/api/land/applications/email/${email}`,
      VERIFY: (id: string) => `/api/land/applications/${id}/verify`,
      SURVEY: (id: string) => `/api/land/applications/${id}/survey`,
      FORWARD: (id: string) => `/api/land/applications/${id}/forward`,
      APPROVE: (id: string) => `/api/land/applications/${id}/approve`,
      HISTORY: (id: string) => `/api/land/applications/${id}/history`
    }
  }
};

// Helper function to make API calls to fabric-api
export async function apiCall(endpoint: string, options: RequestInit = {}, req?: any) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token from cookies (server-side) or localStorage (client-side)
  let token: string | undefined;
  if (req) {
    // Server-side: get from cookies
    token = req.cookies.get('fabric_token')?.value;
  } else {
    // Client-side: get from localStorage
    token = localStorage.getItem('fabric_token') || undefined;
  }

  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Authentication helpers
export const auth = {
  login: async (username: string, password: string) => {
    const response = await apiCall(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.token) {
      localStorage.setItem('fabric_token', response.token);
      localStorage.setItem('fabric_user', JSON.stringify(response.user));
    }

    return response;
  },

  logout: () => {
    localStorage.removeItem('fabric_token');
    localStorage.removeItem('fabric_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('fabric_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => localStorage.getItem('fabric_token'),

  isAuthenticated: () => !!localStorage.getItem('fabric_token'),
};