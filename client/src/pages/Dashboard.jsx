import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { 
  LogOut,
  Building,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Banknote,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import DashboardDPK from '../components/DashboardDPK';
import DashboardPBY from '../components/DashboardPBY';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('dpk'); // 'dpk' atau 'pby'
    const navigate = useNavigate();

    // Load data saat komponen mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                // Cek status autentikasi
                const authStatus = await authService.checkAuthStatus();
                if (!authStatus.authenticated) {
                    navigate('/login');
                    return;
                }
                
                setUser(authStatus.user);

                // Load dashboard data
                const dashboardResponse = await authService.getDashboardData();
                if (dashboardResponse.success) {
                    setDashboardData(dashboardResponse.data);
                } else {
                    setError(dashboardResponse.error);
                }

            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                setError('Gagal memuat data dashboard');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleInputDPK = () => {
        navigate('/input');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
            {/* Navbar */}
            <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 flex items-center justify-center">
                                <img 
                                    src="/pic/logo3.png" 
                                    alt="BSI Logo" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-emerald-800">
                                    Dashboard {activeTab === 'dpk' ? 'DPK' : 'PBY'}
                                </h1>
                                <p className="text-sm text-emerald-600">
                                    {dashboardData?.branch_info?.name || 'KCP Jakarta Tempo Pavillion 2'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleInputDPK}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Input Data
                            </button>

                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
                                <p className="text-xs text-emerald-600">{user?.position}</p>
                            </div>
                            
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                                <p className="text-sm font-medium text-red-700">{error}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Welcome Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-8 text-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">
                                    Selamat Datang, {user?.full_name}!
                                </h2>
                                <p className="text-emerald-100">
                                    Dashboard dan Data Kinerja Cabang
                                </p>
                                <div className="mt-4 flex items-center space-x-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <Building className="w-4 h-4" />
                                        <span>{dashboardData?.branch_info?.name || 'KCP Jakarta Tempo Pavillion 2'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <div className="text-right">
                                    <p className="text-sm opacity-90">Login Terakhir</p>
                                    <p className="text-lg font-semibold">
                                        {new Date().toLocaleDateString('id-ID', { 
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tab Navigation untuk DPK/PBY */}
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="mb-8"
>
    <div className="flex flex-col md:flex-row gap-4">
        {/* DPK Card */}
        <div 
            className={`flex-1 cursor-pointer transition-all duration-300 ${
                activeTab === 'dpk' 
                    ? 'border-2 border-emerald-500 shadow-lg' 
                    : 'border border-gray-200 hover:border-emerald-300 hover:shadow-md'
            } bg-white rounded-2xl overflow-hidden`}
            onClick={() => setActiveTab('dpk')}
        >
            <div className="p-6">
                <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg mr-4 ${
                        activeTab === 'dpk' ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                        <Banknote className={`w-6 h-6 ${
                            activeTab === 'dpk' ? 'text-emerald-600' : 'text-gray-600'
                        }`} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${
                            activeTab === 'dpk' ? 'text-emerald-700' : 'text-gray-900'
                        }`}>
                            Dashboard DPK
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Dana Pihak Ketiga</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tabungan, Giro, Deposito</span>
                        <span className={`font-medium ${
                            activeTab === 'dpk' ? 'text-emerald-600' : 'text-gray-600'
                        }`}>
                            5 Items
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        {activeTab === 'dpk' && (
                            <span className="px-2 py-1 bg-emerald-500 text-white text-xs rounded-lg">
                                Aktif
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* PBY Card */}
        <div 
            className={`flex-1 cursor-pointer transition-all duration-300 ${
                activeTab === 'pby' 
                    ? 'border-2 border-blue-500 shadow-lg' 
                    : 'border border-gray-200 hover:border-blue-300 hover:shadow-md'
            } bg-white rounded-2xl overflow-hidden`}
            onClick={() => setActiveTab('pby')}
        >
            <div className="p-6">
                <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg mr-4 ${
                        activeTab === 'pby' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                        <TrendingUp className={`w-6 h-6 ${
                            activeTab === 'pby' ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${
                            activeTab === 'pby' ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                            Dashboard PBY
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Pembiayaan</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Griya, Oto, Mitraguna, Pensiun</span>
                        <span className={`font-medium ${
                            activeTab === 'pby' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                            8 Items
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        {activeTab === 'pby' && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-lg">
                                Aktif
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
</motion.div>

                {/* Dashboard Component berdasarkan Tab */}
                {activeTab === 'dpk' ? (
                    <motion.div
                        key="dpk"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <DashboardDPK user={user} dashboardData={dashboardData} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="pby"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <DashboardPBY user={user} dashboardData={dashboardData} />
                    </motion.div>
                )}

            </main>

            {/* Footer */}
            <footer className="mt-12 border-t border-gray-200 bg-white/50 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
                            <p className="text-sm text-gray-600">© 2026 PT Bank Syariah Indonesia Tbk</p>
                            <span className="hidden md:inline text-gray-300">•</span>
                            <p className="text-sm text-emerald-600 font-medium">Dashboard System</p>
                            <span className="hidden md:inline text-gray-300">•</span>
                            <p className="text-sm text-gray-500">{dashboardData?.branch_info?.name || 'KCP Jakarta Tempo Pavillion 2'}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            {new Date().toLocaleDateString('id-ID', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;