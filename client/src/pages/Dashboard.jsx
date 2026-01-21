import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { 
  LogOut,
  Building,
  AlertCircle,
  PlusCircle,
  Banknote,
  TrendingUp,
  LineChart,
  AlertTriangle,
  LayoutDashboard
} from 'lucide-react';
import DashboardDPK from '../components/DashboardDPK';
import DashboardPBY from '../components/DashboardPBY';
import DashboardKol2 from '../components/DashboardKol2';
import DashboardNPF from '../components/DashboardNPF';
import DashboardSummary from '../components/DashboardSummary';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('summary');
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                const authStatus = await authService.checkAuthStatus();
                if (!authStatus.authenticated) {
                    navigate('/login');
                    return;
                }
                
                setUser(authStatus.user);

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

    const tabs = [
        { 
            id: 'summary', 
            label: 'Summary', 
            icon: LayoutDashboard, 
            color: 'amber', 
            description: 'Ringkasan Semua Data',
            items: '4 Dashboard'
        },
        { 
            id: 'dpk', 
            label: 'DPK', 
            icon: Banknote, 
            color: 'emerald', 
            description: 'Dana Pihak Ketiga',
            items: '5 Items'
        },
        { 
            id: 'pby', 
            label: 'PBY', 
            icon: TrendingUp, 
            color: 'blue', 
            description: 'Pembiayaan',
            items: '8 Items'
        },
        { 
            id: 'kol2', 
            label: 'Kol. 2', 
            icon: LineChart, 
            color: 'purple', 
            description: 'Kolektibilitas 2',
            items: '8 Items'
        },
        { 
            id: 'npf', 
            label: 'NPF', 
            icon: AlertTriangle, 
            color: 'red', 
            description: 'Non-Performing Financing',
            items: '8 Items'
        },
    ];

   const getTabContent = (tabId) => {
    return tabId === 'summary' ? 'DPK, PBY, Kol.2, NPF' : 
           tabId === 'dpk' ? 'Tabungan, Giro, Deposito' : 
           tabId === 'pby' ? 'Griya, Oto, Mitraguna' : 
           // Kol.2 dan NPF dikosongin
           '';
};

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
            
            {/* Navbar */}
            <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
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
                            
                            <div className="relative">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
                                    title="Profil Saya"
                                >
                                    {user?.profile_picture ? (
                                        <img 
                                            src={user.profile_picture} 
                                            alt={user.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {user?.full_name?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                    )}
                                </button>
                                {dashboardData?.unread_notifications > 0 && (
                                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </div>
                            
                            <div>
                                <h1 className="text-2xl font-bold text-emerald-800">
                                    Dashboard {
                                        activeTab === 'summary' ? 'Summary' : 
                                        activeTab === 'dpk' ? 'DPK' : 
                                        activeTab === 'pby' ? 'PBY' : 
                                        activeTab === 'kol2' ? 'Kol. 2' : 
                                        'NPF'
                                    }
                                </h1>
                                <p className="text-sm text-emerald-600">
                                    {dashboardData?.branch_info?.name || 'KCP Jakarta Tempo Pavillion 2'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/input')}
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

                {/* Smooth Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            
                            return (
                                <motion.div
                                    key={tab.id}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                        cursor-pointer rounded-xl overflow-hidden transition-all duration-300 
                                        ${isActive 
                                            ? `border-2 border-${tab.color}-500 bg-gradient-to-br from-white to-gray-50 shadow-lg` 
                                            : 'border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                        }
                                    `}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center mb-3">
                                            <div className={`
                                                p-2 rounded-lg mr-3 transition-all duration-300 
                                                ${isActive 
                                                    ? `bg-${tab.color}-100 border border-${tab.color}-200` 
                                                    : 'bg-gray-100'
                                                }
                                            `}>
                                                <Icon className={`
                                                    w-5 h-5 transition-all duration-300 
                                                    ${isActive 
                                                        ? `text-${tab.color}-600` 
                                                        : 'text-gray-500'
                                                    }
                                                `} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`
                                                    text-base font-bold transition-all duration-300 truncate
                                                    ${isActive 
                                                        ? `text-${tab.color}-700` 
                                                        : 'text-gray-900'
                                                    }
                                                `}>
                                                    {tab.label}
                                                </h3>
                                                <p className={`
                                                    text-xs mt-0.5 transition-all duration-300 truncate
                                                    ${isActive 
                                                        ? `text-${tab.color}-600` 
                                                        : 'text-gray-500'
                                                    }
                                                `}>
                                                    {tab.description}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <motion.span 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className={`ml-2 w-2 h-2 rounded-full bg-${tab.color}-500`}
                                                />
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className={`
                                                    truncate max-w-[70%]
                                                    ${isActive 
                                                        ? `text-${tab.color}-600` 
                                                        : 'text-gray-500'
                                                    }
                                                `}>
                                                    {getTabContent(tab.id)}
                                                </span>
                                                <span className={`
                                                    font-medium px-1.5 py-0.5 rounded text-xs
                                                    ${isActive 
                                                        ? `bg-${tab.color}-100 text-${tab.color}-700` 
                                                        : 'bg-gray-100 text-gray-700'
                                                    }
                                                `}>
                                                    {tab.items}
                                                </span>
                                            </div>
                                            
                                            {isActive && (
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '100%' }}
                                                    className={`h-0.5 bg-gradient-to-r from-${tab.color}-400 to-${tab.color}-500 rounded-full`}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Dashboard Component dengan smooth transition */}
                <div className="mt-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'summary' && <DashboardSummary />}
                            {activeTab === 'dpk' && <DashboardDPK user={user} dashboardData={dashboardData} />}
                            {activeTab === 'pby' && <DashboardPBY user={user} dashboardData={dashboardData} />}
                            {activeTab === 'kol2' && <DashboardKol2 user={user} dashboardData={dashboardData} />}
                            {activeTab === 'npf' && <DashboardNPF user={user} dashboardData={dashboardData} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

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