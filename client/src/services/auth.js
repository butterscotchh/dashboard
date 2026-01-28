import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production'
    ? 'https://dashboard-backend-virid.vercel.app'
    : 'http://localhost:5000');

// Create axios instance dengan config dinamis
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: process.env.NODE_ENV === 'production' ? 15000 : 10000,
});

// LOG untuk debugging (hanya di development)
if (process.env.NODE_ENV === 'development') {
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('🚀 Environment:', process.env.NODE_ENV);
    console.log('📡 API Key:', process.env.REACT_APP_API_URL ? 'Set' : 'Not set');
}

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request di development
        if (process.env.NODE_ENV === 'development') {
            console.log(`➡️ ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor untuk handle error
api.interceptors.response.use(
    (response) => {
        // Log response di development
        if (process.env.NODE_ENV === 'development') {
            console.log(`⬅️ ${response.status} ${response.config.url}`, response.data);
        }
        return response;
    },
    (error) => {
        // Log error di development
        if (process.env.NODE_ENV === 'development') {
            console.error('❌ API Error:', error.response?.status, error.config?.url, error.message);
        }
        
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

const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
};

const authService = {
    // ============ AUTHENTICATION ============
    
    // Login
    async login(username, password) {
        try {
            const response = await api.post('/api/login', { username, password });
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
    
    // Logout - BEST SOLUTION (Balance UX & Data Integrity)
    async logout() {
        try {
            const user = this.getCurrentUser();
            
            // 1. LOG ACTIVITY DI BACKGROUND (jangan tunggu)
            this.logActivity('logout', { username: user?.username })
                .catch(err => console.warn('Background activity log failed:', err));
            
            // 2. KIRIM LOGOUT REQUEST DENGAN TIMEOUT (max 2 detik)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            try {
                await api.post('/api/logout', {}, { signal: controller.signal });
            } catch (apiError) {
                if (apiError.name === 'AbortError') {
                    console.log('Logout API timeout, proceeding anyway');
                } else {
                    console.warn('Logout API error:', apiError);
                }
            } finally {
                clearTimeout(timeoutId);
            }
            
            // 3. HAPUS DATA LOKAL
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            
            // 4. REDIRECT CEPAT
            setTimeout(() => {
                window.location.href = '/login';
            }, 50); // Delay kecil untuk smooth transition
            
            return { 
                success: true, 
                message: 'Logged out successfully' 
            };
            
        } catch (error) {
            console.error('Unexpected logout error:', error);
            
            // FALLBACK: Pastikan data dihapus dan redirect
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            
            return { 
                success: true, 
                message: 'Logged out successfully' 
            };
        }
    },
    
    // Verify token
    async verifyToken() {
        try {
            const response = await api.get('/api/verify-token');
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
            const response = await api.get('/api/profile');
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
    
    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // ============ NEW FUNCTIONS ============
    
    // Fetch fresh user data from server (FIX: untuk dapat data lengkap)
    async fetchUserProfile() {
        try {
            const response = await api.get('/api/users/me');
            const data = response.data;
            
            if (data.success && data.user) {
                // Update localStorage dengan data lengkap
                localStorage.setItem('user', JSON.stringify(data.user));
                return data.user;
            }
            return null;
        } catch (error) {
            console.error('Fetch user profile error:', error);
            return null;
        }
    },
    
    // Check auth status dengan fetch data terbaru
    async checkAuthStatus() {
        if (!this.isAuthenticated()) {
            return { authenticated: false, user: null };
        }
        
        try {
            const verifyResponse = await this.verifyToken();
            if (verifyResponse.success) {
                // Fetch data user terbaru dari server
                const freshUser = await this.fetchUserProfile();
                return { 
                    authenticated: true, 
                    user: freshUser || this.getCurrentUser()
                };
            } else {
                this.logout();
                return { authenticated: false, user: null };
            }
        } catch (error) {
            this.logout();
            return { authenticated: false, user: null };
        }
    },
    
    // Log activity - FIX: Backend tidak punya endpoint ini, jadi kita skip
    async logActivity(action, userData = {}, details = {}) {
        // Backend sudah handle logging otomatis di setiap endpoint
        // Tidak perlu request tambahan
        console.log(`Activity logged: ${action}`);
        return { success: true };
    },
    
    // ============ ACTIVITY LOGS ENDPOINTS ============
    
    // Get activity logs (semua user)
    async getActivityLogs(params = {}) {
        try {
            const response = await api.get('/api/activity-logs', { params });
            return response.data;
        } catch (error) {
            console.error('Get activity logs error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get activity logs'
            };
        }
    },
    
    // Get user's own activity logs
    async getMyActivityLogs(params = {}) {
        try {
            const response = await api.get('/api/activity-logs/my', { params });
            return response.data;
        } catch (error) {
            console.error('Get my activity logs error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get activity logs'
            };
        }
    },
    
    // Get activity log statistics
    async getActivityStats(params = {}) {
        try {
            const response = await api.get('/api/activity-logs/stats', { params });
            return response.data;
        } catch (error) {
            console.error('Get activity stats error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get activity statistics'
            };
        }
    },
    
    // ============ USER PROFILE ENDPOINTS ============
    
    // Update user profile (full_name dan username) - DIPERBAIKI
    async updateProfile(data) {
        try {
            const response = await api.patch('/api/users/profile', data);
            const responseData = response.data;
            
            if (responseData.success) {
                // Fetch data terbaru dari server untuk pastikan data lengkap
                if (responseData.user) {
                    localStorage.setItem('user', JSON.stringify(responseData.user));
                } else {
                    // Jika server tidak return user data, fetch ulang
                    const freshUser = await this.fetchUserProfile();
                    if (freshUser) {
                        localStorage.setItem('user', JSON.stringify(freshUser));
                        responseData.user = freshUser;
                    }
                }
            }
            
            return responseData;
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update profile'
            };
        }
    },
    
    // Change password - DIPERBAIKI
    async changePassword(data) {
        try {
            const response = await api.patch('/api/users/password', data);
            const responseData = response.data;
            
            if (responseData.success) {
                // Backend sudah handle activity logging otomatis
            }
            
            return responseData;
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to change password'
            };
        }
    },
    
    // Get user details (sudah ada di fetchUserProfile)
    async getUserDetails() {
        try {
            const response = await api.get('/api/users/me');
            return response.data;
        } catch (error) {
            console.error('Get user details error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get user details'
            };
        }
    },
    
    // ============ DPK DATA ENDPOINTS ============
    
    // Get all DPK data
    async getDPKData() {
        try {
            const response = await api.get('/api/dpk');
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
            const response = await api.get(`/api/dpk/${encodeURIComponent(period)}`);
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
            const response = await api.post('/api/dpk', data);
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
            const response = await api.delete(`/api/dpk/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Delete DPK data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete DPK data'
            };
        }
    },
    
    // ============ TABUNGAN DATA ENDPOINTS ============

    // Get all Tabungan data
    async getTabunganData() {
        try {
            const response = await api.get('/api/tabungan');
            return response.data;
        } catch (error) {
            console.error('Get Tabungan data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get Tabungan data'
            };
        }
    },

    // Get specific period Tabungan data
    async getTabunganPeriodData(period) {
        try {
            const response = await api.get(`/api/tabungan/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Get Tabungan period data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get period data'
            };
        }
    },

    // Save/update Tabungan data
    async saveTabunganData(data) {
        try {
            const response = await api.post('/api/tabungan', data);
            return response.data;
        } catch (error) {
            console.error('Save Tabungan data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to save Tabungan data'
            };
        }
    },

    // Delete Tabungan data
    async deleteTabunganData(period) {
        try {
            const response = await api.delete(`/api/tabungan/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Delete Tabungan data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete Tabungan data'
            };
        }
    },

    // ============ PBY DATA ENDPOINTS ============
    
    // Get all PBY data
    async getPBYData() {
        try {
            const response = await api.get('/api/pby');
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
            const response = await api.get(`/api/pby/${encodeURIComponent(period)}`);
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
            const response = await api.post('/api/pby', data);
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
            const response = await api.delete(`/api/pby/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Delete PBY data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete PBY data'
            };
        }
    },
    
    // ============ KOL2 DATA ENDPOINTS ============
    
    // Get all Kol2 data
    async getKol2Data() {
        try {
            const response = await api.get('/api/kol2');
            return response.data;
        } catch (error) {
            console.error('Get Kol2 data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get Kol2 data'
            };
        }
    },
    
    // Get specific period Kol2 data
    async getKol2PeriodData(period) {
        try {
            const response = await api.get(`/api/kol2/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Get Kol2 period data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get Kol2 period data'
            };
        }
    },
    
    // Save/update Kol2 data
    async saveKol2Data(data) {
        try {
            const response = await api.post('/api/kol2', data);
            return response.data;
        } catch (error) {
            console.error('Save Kol2 data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to save Kol2 data'
            };
        }
    },
    
    // Delete Kol2 data
    async deleteKol2Data(period) {
        try {
            const response = await api.delete(`/api/kol2/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Delete Kol2 data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete Kol2 data'
            };
        }
    },

    // ============ NPF DATA ENDPOINTS ============
    
    // Get all NPF data
    async getNPFData() {
        try {
            const response = await api.get('/api/npf');
            return response.data;
        } catch (error) {
            console.error('Get NPF data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get NPF data'
            };
        }
    },
    
    // Get specific period NPF data
    async getNPFPeriodData(period) {
        try {
            const response = await api.get(`/api/npf/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Get NPF period data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get NPF period data'
            };
        }
    },
    
    // Save/update NPF data
    async saveNPFData(data) {
        try {
            const response = await api.post('/api/npf', data);
            return response.data;
        } catch (error) {
            console.error('Save NPF data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to save NPF data'
            };
        }
    },
    
    // Delete NPF data
    async deleteNPFData(period) {
        try {
            const response = await api.delete(`/api/npf/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Delete NPF data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete NPF data'
            };
        }
    },
    
    // ============ DASHBOARD ============
    
    // Get dashboard data
    async getDashboardData() {
        try {
            const response = await api.get('/api/dashboard');
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
            const response = await api.get('/api/branch-data');
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
            const response = await api.get('/api/my-branch');
            return response.data;
        } catch (error) {
            console.error('Get my branch error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get branch info'
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
    
    // ============ FUNGSI UNTUK PROFILE PAGE ============
    
    // Get recent activity logs with limit (UNTUK PROFILE PAGE)
    async getRecentActivityLogs(limit = 20, page = 1) {
        try {
            const params = {
                limit,
                page,
                sortBy: 'created_at',
                sortOrder: 'desc'
            };
            
            const response = await this.getActivityLogs(params);
            
            if (response.success) {
                return {
                    success: true,
                    data: response.data || [],
                    pagination: response.pagination || {}
                };
            }
            
            return response;
            
        } catch (error) {
            console.error('Get recent activity logs error:', error);
            return {
                success: false,
                error: 'Failed to get recent activity logs'
            };
        }
    },
    
    // Get today's activity summary
    async getTodayActivitySummary() {
        try {
            const response = await this.getActivityStats({
                period: 'today',
                groupBy: 'user'
            });
            
            return response;
            
        } catch (error) {
            console.error('Get today activity summary error:', error);
            return {
                success: false,
                error: 'Failed to get today activity summary'
            };
        }
    }
};

export default authService;