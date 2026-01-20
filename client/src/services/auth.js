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

// Helper function untuk detect device type
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
            await api.post('/logout', {}, { signal: controller.signal });
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
    
    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // ============ NEW FUNCTIONS ============
    
    // Fetch fresh user data from server (FIX: untuk dapat data lengkap)
    async fetchUserProfile() {
        try {
            const response = await api.get('/users/me');
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
    
    // Log activity
    async logActivity(action, userData = {}, details = {}) {
        try {
            const user = this.getCurrentUser();
            const response = await api.post('/auth/log-activity', {
                action: action,
                username: user?.username || userData.username,
                user_name: user?.full_name || userData.full_name,
                user_agent: navigator.userAgent,
                device_type: getDeviceType(),
                status: 'success',
                details: JSON.stringify({ ...details, ...userData })
            });
            return response.data;
        } catch (error) {
            console.error('Failed to log activity:', error);
            // Jangan throw error, biarkan proses tetap berjalan
            return { success: false, error: 'Failed to log activity' };
        }
    },
    
    // ============ ACTIVITY LOGS ENDPOINTS ============
    
    // Get activity logs (semua user)
    async getActivityLogs(params = {}) {
        try {
            const response = await api.get('/activity-logs', { params });
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
            const response = await api.get('/activity-logs/my', { params });
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
            const response = await api.get('/activity-logs/stats', { params });
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
            const response = await api.patch('/users/profile', data);
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
            const response = await api.patch('/users/password', data);
            const responseData = response.data;
            
            if (responseData.success) {
                // Log activity setelah ganti password
                await this.logActivity('password_change', {});
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
            const response = await api.get('/users/me');
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
    
    // ============ KOL2 DATA ENDPOINTS ============
    
    // Get all Kol2 data
    async getKol2Data() {
        try {
            const response = await api.get('/kol2');
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
            const response = await api.get(`/kol2/${encodeURIComponent(period)}`);
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
            const response = await api.post('/kol2', data);
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
            const response = await api.delete(`/kol2/${encodeURIComponent(period)}`);
            return response.data;
        } catch (error) {
            console.error('Delete Kol2 data error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete Kol2 data'
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