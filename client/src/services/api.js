const API_BASE_URL = 'http://localhost:5000/api';

// Helper untuk mendapatkan token dari localStorage
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

// Helper untuk membuat headers dengan token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Login
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Verify token
export const verifyToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-token`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Verify token error:', error);
    throw error;
  }
};

// Get all DPK data (untuk dashboard dan input)
export const getDPKData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dpk`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get DPK data error:', error);
    throw error;
  }
};

// Get specific period DPK data (untuk edit data)
export const getDPKPeriodData = async (period) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dpk/${period}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get period data error:', error);
    throw error;
  }
};

// Save/update DPK data
export const saveDPKData = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dpk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Save DPK data error:', error);
    throw error;
  }
};

// Get dashboard data dengan summary
export const getDashboardData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get dashboard error:', error);
    throw error;
  }
};

// Delete DPK data (opsional)
export const deleteDPKData = async (period) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dpk/${period}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Delete DPK data error:', error);
    throw error;
  }
};

// Get branch info
export const getBranchInfo = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/my-branch`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get branch info error:', error);
    throw error;
  }
};

// Get profile data
export const getProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Logout (local)
export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

// Get current user dari localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Save user data ke localStorage
export const saveUserData = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('accessToken', token);
};