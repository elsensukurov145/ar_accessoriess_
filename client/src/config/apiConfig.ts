/**
 * Centralized API Configuration
 * Uses environment variables for flexibility across environments (dev, staging, prod)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    verify: `${API_BASE_URL}/api/auth/verify`,
  },
  
  // Product endpoints
  products: {
    list: `${API_BASE_URL}/api/products`,
    detail: (id: string | number) => `${API_BASE_URL}/api/products/${id}`,
    create: `${API_BASE_URL}/api/products`,
    update: (id: string | number) => `${API_BASE_URL}/api/products/${id}`,
    delete: (id: string | number) => `${API_BASE_URL}/api/products/${id}`,
  },
  
  // Order endpoints
  orders: {
    create: `${API_BASE_URL}/api/order`,
    verify: `${API_BASE_URL}/api/order/verify`,
    list: `${API_BASE_URL}/api/order`,
    updateStatus: (id: string | number) => `${API_BASE_URL}/api/order/${id}/status`,
    kapitalCallback: `${API_BASE_URL}/api/order/kapital/callback`,
    kapitalReturn: `${API_BASE_URL}/api/order/kapital/return`,
  },
  
  // User endpoints
  user: {
    profile: `${API_BASE_URL}/api/user/profile`,
    orders: `${API_BASE_URL}/api/user/orders`,
  },
};

/**
 * Validate API configuration on app startup
 */
export const validateAPIConfig = () => {
  if (!API_BASE_URL) {
    console.error('❌ VITE_API_URL is not configured. Set it in .env file.');
    console.warn('⚠️ Falling back to localhost:5000');
  } else {
    console.log('✅ API configured for:', API_BASE_URL);
  }
};
