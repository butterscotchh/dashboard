import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../services/auth';
import { 
  ArrowLeft, 
  User, 
  Key, 
  BadgeCheck,
  Edit,
  Save,
  X,
  Shield,
  Eye,
  EyeOff,
  UserCircle,
  Clock,
  LogIn,
  Users,
  Monitor,
  Smartphone,
  AlertCircle,
  Briefcase,
  Hash
} from 'lucide-react';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [stats, setStats] = useState({
        todayLogins: 0,
        totalActivities: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Cek autentikasi
                const authStatus = await authService.checkAuthStatus();
                if (!authStatus.authenticated) {
                    navigate('/login');
                    return;
                }
                
                // Load data user
                const userData = authService.getCurrentUser();
                setUser(userData);
                
                // Set form data dengan data user
                setFormData({
                    full_name: userData.full_name || '',
                    username: userData.username || '',
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                });

                // Load activity logs
                await loadActivityLogs();
            } catch (error) {
                console.error('Failed to load profile:', error);
                setError('Gagal memuat profil');
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [navigate]);

    const loadActivityLogs = async () => {
        try {
            setLoadingLogs(true);
            
            // Load activity logs dari API
            const response = await authService.getRecentActivityLogs(20, 1);
            
            if (response.success) {
                // Format data untuk match dengan frontend
                const formattedLogs = response.data.map(log => ({
                    id: log.id,
                    user_name: log.user_name,
                    username: log.username,
                    action: log.action,
                    timestamp: log.created_at,
                    device: log.device_type || 'Unknown Device'
                }));
                
                setActivityLogs(formattedLogs);
                
                // Hitung statistik
                const today = new Date().toISOString().split('T')[0];
                const todayLogins = formattedLogs.filter(log => {
                    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                    return log.action === 'login' && logDate === today;
                }).length;
                
                setStats({
                    todayLogins,
                    totalActivities: formattedLogs.length
                });
            } else {
                console.error('Failed to load activity logs:', response.error);
                // Fallback ke data dummy jika API error
                const mockLogs = getMockLogs();
                setActivityLogs(mockLogs);
                calculateStats(mockLogs);
            }
        } catch (error) {
            console.error('Failed to load activity logs:', error);
            // Fallback ke data dummy jika network error
            const mockLogs = getMockLogs();
            setActivityLogs(mockLogs);
            calculateStats(mockLogs);
        } finally {
            setLoadingLogs(false);
        }
    };

    // Helper function untuk data dummy
    const getMockLogs = () => {
        return [
            {
                id: 1,
                user_name: user?.full_name || 'Admin User',
                username: user?.username || 'admin',
                action: 'login',
                timestamp: new Date().toISOString(),
                device: 'Chrome on Windows'
            }
        ];
    };

    // Helper function untuk hitung statistik
    const calculateStats = (logs) => {
        const today = new Date().toISOString().split('T')[0];
        const todayLogins = logs.filter(log => {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            return log.action === 'login' && logDate === today;
        }).length;
        
        setStats({
            todayLogins,
            totalActivities: logs.length
        });
    };

    // Update user state immediately when form changes
    useEffect(() => {
        if (editing && user) {
            setUser(prev => ({
                ...prev,
                full_name: formData.full_name,
                username: formData.username
            }));
        }
    }, [formData.full_name, formData.username, editing]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (error) setError('');
    };

    const validateForm = () => {
        // Validasi username
        if (!formData.username.trim()) {
            setError('Username tidak boleh kosong');
            return false;
        }
        
        // Validasi password jika user ingin ganti password
        if (formData.new_password || formData.confirm_password) {
            if (!formData.current_password) {
                setError('Masukkan password saat ini untuk mengubah password');
                return false;
            }
            
            if (formData.new_password.length < 6) {
                setError('Password baru minimal 6 karakter');
                return false;
            }
            
            if (formData.new_password !== formData.confirm_password) {
                setError('Password baru dan konfirmasi password tidak sama');
                return false;
            }
        }
        
        return true;
    };

   const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
        // Prepare payload
        const payload = {
            full_name: formData.full_name,
            username: formData.username
        };
        
        // Jika mengubah password
        if (formData.new_password) {
            const passwordResponse = await authService.changePassword({
                current_password: formData.current_password,
                new_password: formData.new_password
            });
            
            if (!passwordResponse.success) {
                setError(passwordResponse.error || 'Gagal mengubah password');
                return;
            }
        }
        
        // Update profile (TANPA log activity)
        const profileResponse = await authService.updateProfile(payload);
        
        if (profileResponse.success) {
            // Update user state dengan data TERBARU dari server
            if (profileResponse.user) {
                setUser(profileResponse.user);
            } else {
                // Fetch ulang data lengkap
                const refreshedUser = await authService.fetchUserProfile();
                if (refreshedUser) {
                    setUser(refreshedUser);
                } else {
                    // Fallback ke local update
                    const updatedUser = {
                        ...user,
                        full_name: formData.full_name,
                        username: formData.username
                    };
                    setUser(updatedUser);
                }
            }
            
            setSuccess('Profil berhasil diperbarui!');
            setEditing(false);
            
            // Reset password fields
            setFormData(prev => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));
            
            // Reload activity logs (hanya untuk refresh data, bukan log update)
            await loadActivityLogs();
            
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(profileResponse.error || 'Gagal menyimpan perubahan');
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        setError('Gagal menyimpan perubahan');
    }
};

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInMinutes = Math.floor((now - past) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Baru saja';
        if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
        return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`;
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDeviceIcon = (device) => {
        if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('app')) {
            return <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />;
        }
        return <Monitor className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-20 py-3 sm:py-0">
                        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 mb-3 sm:mb-0">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                            </button>
                            <div>
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-800">Profil Saya</h1>
                                <p className="text-xs sm:text-sm text-emerald-600">Kelola informasi akun Anda</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            {editing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            setFormData({
                                                full_name: user.full_name || '',
                                                username: user.username || '',
                                                current_password: '',
                                                new_password: '',
                                                confirm_password: ''
                                            });
                                            setError('');
                                        }}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm border border-transparent rounded-lg font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                    >
                                        <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                        Simpan
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm border border-transparent rounded-lg font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                >
                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Edit Profil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
                {/* Notifications */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 sm:mb-6"
                    >
                        <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <p className="text-xs sm:text-sm font-medium text-red-700">{error}</p>
                        </div>
                    </motion.div>
                )}
                
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 sm:mb-6"
                    >
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <p className="text-xs sm:text-sm font-medium text-emerald-700">{success}</p>
                        </div>
                    </motion.div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {/* Profile Card - Left Column */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden h-full"
                        >
                            {/* Header dengan foto profil */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 sm:p-6 md:p-8">
                                <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 sm:space-y-6 md:space-y-0 md:space-x-4 lg:space-x-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
                                            <UserCircle className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-100" />
                                        </div>
                                        {user?.is_active && (
                                            <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-emerald-500 text-white p-1 rounded-full">
                                                <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="text-white text-center md:text-left">
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{user?.full_name || 'User'}</h2>
                                        <p className="text-emerald-100 text-sm sm:text-base md:text-lg mb-2 sm:mb-3">{user?.position || 'Staff'}</p>
                                        <div className="flex items-center justify-center md:justify-start space-x-2 sm:space-x-3 md:space-x-4">
                                            <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                                                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                <span className="text-xs sm:text-sm font-medium">{user?.role || 'Admin'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="p-4 sm:p-6 md:p-8">
                                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                    {/* Informasi Pribadi */}
                                    <div className="space-y-3 sm:space-y-4">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                                            <User className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-emerald-500" />
                                            Informasi Pribadi
                                        </h3>
                                        
                                        {editing ? (
                                            // Tampilan saat edit mode
                                            <div className="space-y-3 sm:space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                                        Nama Lengkap
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="full_name"
                                                        value={formData.full_name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm sm:text-base"
                                                        placeholder="Masukkan nama lengkap"
                                                    />
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                                            Username
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="username"
                                                            value={formData.username}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm sm:text-base"
                                                            placeholder="Masukkan username"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                                            Employee ID
                                                        </label>
                                                        <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                            <p className="text-gray-900 font-mono font-medium text-sm sm:text-base">{user?.employee_id}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Tampilan normal (non-edit)
                                            <div className="space-y-3 sm:space-y-4">
                                                <div className="space-y-2 sm:space-y-3">
                                                    <div className="flex items-start space-x-2 sm:space-x-3">
                                                        <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg">
                                                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500">Nama Lengkap</p>
                                                            <p className="text-gray-900 font-medium mt-0.5 sm:mt-1 text-sm sm:text-base truncate">{user?.full_name}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-start space-x-2 sm:space-x-3">
                                                        <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg">
                                                            <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500">Username</p>
                                                            <p className="text-gray-900 font-medium mt-0.5 sm:mt-1 text-sm sm:text-base truncate">{user?.username}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-start space-x-2 sm:space-x-3">
                                                        <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg">
                                                            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500">Employee ID</p>
                                                            <p className="text-gray-900 font-mono font-medium mt-0.5 sm:mt-1 text-sm sm:text-base truncate">{user?.employee_id}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ubah Password (hanya saat edit) */}
                                    {editing && (
                                        <div className="pt-4 sm:pt-6 border-t border-gray-200">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                                                <Key className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-emerald-500" />
                                                Ubah Password
                                            </h3>
                                            
                                            <div className="space-y-3 sm:space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                                        Password Saat Ini
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="current_password"
                                                            value={formData.current_password}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm sm:text-base pr-10 sm:pr-12"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                                            Password Baru
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                name="new_password"
                                                                value={formData.new_password}
                                                                onChange={handleInputChange}
                                                                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm sm:text-base pr-10 sm:pr-12"
                                                                placeholder="••••••••"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 sm:mt-2">Minimal 6 karakter</p>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                                            Konfirmasi Password Baru
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                name="confirm_password"
                                                                value={formData.confirm_password}
                                                                onChange={handleInputChange}
                                                                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-sm sm:text-base pr-10 sm:pr-12"
                                                                placeholder="••••••••"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                                                * Biarkan kosong jika tidak ingin mengubah password
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Activity Log - Right Column */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl h-full"
                        >
                            <div className="p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                                            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-emerald-500" />
                                            Aktivitas Login
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Log aktivitas semua pengguna</p>
                                    </div>
                                    <button 
                                        onClick={loadActivityLogs}
                                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        disabled={loadingLogs}
                                    >
                                        <Clock className={`w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 ${loadingLogs ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {loadingLogs ? (
                                    <div className="text-center py-6 sm:py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                        <p className="mt-2 text-xs sm:text-sm text-gray-500">Memuat aktivitas...</p>
                                    </div>
                                ) : activityLogs.length > 0 ? (
                                    <div className="space-y-2 sm:space-y-3 md:space-y-4 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto pr-2">
                                        {activityLogs.map((log) => (
                                            <div 
                                                key={log.id} 
                                                className={`p-3 sm:p-4 rounded-lg border ${
                                                    log.username === user?.username 
                                                        ? 'bg-emerald-50 border-emerald-200' 
                                                        : 'bg-gray-50 border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center mb-1 gap-1 sm:gap-2">
                                                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 ${
                                                                log.action === 'login' ? 'bg-green-500' : 'bg-red-500'
                                                            }`}></div>
                                                            <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                                                {log.user_name}
                                                            </span>
                                                            {log.username === user?.username && (
                                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                                                    Anda
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                            @{log.username} • {log.action === 'login' ? 'Login' : 'Logout'}
                                                        </p>
                                                        <div className="flex items-center mt-1 sm:mt-2 text-xs text-gray-500">
                                                            {getDeviceIcon(log.device)}
                                                            <span className="ml-1 sm:ml-2 truncate text-[10px] sm:text-xs">{log.device}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-2 sm:ml-3">
                                                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                                                            {formatTime(log.timestamp)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5 sm:mt-1 whitespace-nowrap">
                                                            {getTimeAgo(log.timestamp)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 sm:py-8">
                                        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                                        <p className="text-xs sm:text-sm text-gray-500">Belum ada aktivitas login</p>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div className="text-center">
                                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600">
                                                {stats.todayLogins}
                                            </div>
                                            <p className="text-xs text-gray-500">Login Hari Ini</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">
                                                {stats.totalActivities}
                                            </div>
                                            <p className="text-xs text-gray-500">Total Aktivitas</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;