import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor untuk handle error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Jika token expired, redirect ke login
        if (error.response && error.response.status === 401) {
            // Hapus semua data dari localStorage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            // Redirect ke login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const authService = {
    // ============ AUTHENTICATION ============
    
    // Login
    async login(username, password) {
        try {
            const response = await api.post('/login', { username, password });
            const data = response.data;
            
            if (data.success) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    },
    
    // Logout
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        return { success: true, message: 'Logged out successfully' };
    },
    
    // Verify token
    async verifyToken() {
        try {
            const response = await api.get('/verify-token');
            return response.data;
        } catch (error) {
            console.error('Token verification error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Token verification failed'
            };
        }
    },
    
    // Get profile
    async getProfile() {
        try {
            const response = await api.get('/profile');
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get profile'
            };
        }
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },
    
    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // ============ DPK DATA ENDPOINTS ============
    
    // Get all DPK data
    async getDPKData() {
        try {
            const response = await api.get('/dpk');
            return response.data;
        } catch (error) {
            console.error('Get DPK data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get DPK data'
            };
        }
    },
    
    // Get specific period DPK data
    async getDPKPeriodData(period) {
        try {
            const response = await api.get(`/dpk/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Get DPK period data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get period data'
            };
        }
    },
    
    // Save/update DPK data
    async saveDPKData(data) {
        try {
            const response = await api.post('/dpk', data);
            return response.data;
        } catch (error) {
            console.error('Save DPK data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to save DPK data'
            };
        }
    },
    
    // Delete DPK data
    async deleteDPKData(period) {
        try {
            const response = await api.delete(`/dpk/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Delete DPK data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete DPK data'
            };
        }
    },
    
    // ============ PBY DATA ENDPOINTS ============
    
    // Get all PBY data
    async getPBYData() {
        try {
            const response = await api.get('/pby');
            return response.data;
        } catch (error) {
            console.error('Get PBY data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get PBY data'
            };
        }
    },
    
    // Get specific period PBY data
    async getPBYPeriodData(period) {
        try {
            const response = await api.get(`/pby/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Get PBY period data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get PBY period data'
            };
        }
    },
    
    // Save/update PBY data
    async savePBYData(data) {
        try {
            const response = await api.post('/pby', data);
            return response.data;
        } catch (error) {
            console.error('Save PBY data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to save PBY data'
            };
        }
    },
    
    // Delete PBY data
    async deletePBYData(period) {
        try {
            const response = await api.delete(`/pby/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Delete PBY data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete PBY data'
            };
        }
    },
    
    // ============ DASHBOARD ============
    
    // Get dashboard data
    async getDashboardData() {
        try {
            const response = await api.get('/dashboard');
            return response.data;
        } catch (error) {
            console.error('Get dashboard data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get dashboard data'
            };
        }
    },
    
    // ============ OTHER ENDPOINTS ============
    
    // Get branch data
    async getBranchData() {
        try {
            const response = await api.get('/branch-data');
            return response.data;
        } catch (error) {
            console.error('Get branch data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get branch data'
            };
        }
    },
    
    // Get my branch info
    async getMyBranch() {
        try {
            const response = await api.get('/my-branch');
            return response.data;
        } catch (error) {
            console.error('Get my branch error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get branch info'
            };
        }
    },
    
    // Refresh token (jika ada endpoint refresh-token)
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            const response = await api.post('/refresh-token', { refreshToken });
            const data = response.data;
            
            if (data.success && data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
            }
            
            return data;
        } catch (error) {
            console.error('Refresh token error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to refresh token'
            };
        }
    },
    
    // ============ HELPER FUNCTIONS ============
    
    // Save user data
    saveUserData(user, token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', token);
    },
    
    // Get auth headers (untuk fetch API jika perlu)
    getAuthHeaders() {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    },
    
    // Check token validity
    async checkAuthStatus() {
        if (!this.isAuthenticated()) {
            return { authenticated: false, user: null };
        }
        
        try {
            const verifyResponse = await this.verifyToken();
            if (verifyResponse.success) {
                return { 
                    authenticated: true, 
                    user: this.getCurrentUser() 
                };
            } else {
                this.logout();
                return { authenticated: false, user: null };
            }
        } catch (error) {
            this.logout();
            return { authenticated: false, user: null };
        }
    }
};

export default authService;