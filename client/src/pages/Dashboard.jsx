import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { 
  DollarSign, 
  Wallet, 
  PiggyBank, 
  CreditCard, 
  Landmark,
  TrendingUp, 
  TrendingDown,
  BarChart3,
  LineChart,
  Target,
  Calculator,
  PlusCircle,
  RefreshCw,
  FileText,
  ChevronRight,
  LogOut,
  Building,
  PieChart,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dpkLoading, setDpkLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [dpkData, setDpkData] = useState({
        historical: [],
        targets: []
    });
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fungsi konversi ke number - DIPERBAIKI
    const toNumber = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return Math.round(value * 100) / 100; // Round ke 2 decimal
        if (typeof value === 'string') {
            // Hapus karakter non-numerik kecuali titik dan minus
            const cleaned = value.replace(/[^\d.-]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : Math.round(num * 100) / 100; // Round ke 2 decimal
        }
        return 0;
    };

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

                // Load DPK data
                const dpkResponse = await authService.getDPKData();
                if (dpkResponse.success) {
                    processDPKData(dpkResponse.data);
                } else {
                    setError(dpkResponse.error);
                }

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

    // Update data ketika selectedPeriod berubah
    useEffect(() => {
        if (dpkData.historical.length > 0) {
            processDPKData(dpkData.historical);
        }
    }, [selectedPeriod]);

   // Di processDPKData function:
const processDPKData = (dataFromBackend) => {
    console.log('DPK Data from backend:', dataFromBackend);
    
    // Urutkan data berdasarkan periode
    const sortedData = [...dataFromBackend].sort((a, b) => {
        const periods = { 'Dec-24': 1, 'Oct-25': 2, 'Nov-25': 3, '31-Dec': 4 };
        return (periods[a.period] || 5) - (periods[b.period] || 5);
    });

    // Format data historis - INI SUDAH TERMASUK DATA TARGET!
    const historicalData = sortedData.map(item => {
        return {
            period: item.period,
            dpk: toNumber(item.dpk),
            tabungan: toNumber(item.tabungan),
            giro: toNumber(item.giro),
            deposito: toNumber(item.deposito),
            casa: toNumber(item.casa),
            casaPercentage: toNumber(item.casa_percentage),
            // DATA TARGET DARI DATABASE:
            target_dpk: toNumber(item.target_dpk),
            target_tabungan: toNumber(item.target_tabungan),
            target_giro: toNumber(item.target_giro),
            target_deposito: toNumber(item.target_deposito),
            target_casa: toNumber(item.target_casa),
            target_casa_percentage: toNumber(item.target_casa_percentage)
        };
    });

    // Sekarang hitung targetData dengan benar
    const selectedPeriodData = historicalData.find(item => item.period === selectedPeriod);
    const oldestPeriodData = historicalData[0];
    
    let targetData = [];
    
    if (selectedPeriodData && oldestPeriodData) {
        targetData = [
            { 
                name: 'DPK', 
                target: selectedPeriodData.target_dpk, 
                position: oldestPeriodData.dpk + selectedPeriodData.target_dpk,
                achievement: 100,
                gap: selectedPeriodData.target_dpk
            },
            { 
                name: 'Tabungan', 
                target: selectedPeriodData.target_tabungan, 
                position: oldestPeriodData.tabungan + selectedPeriodData.target_tabungan,
                achievement: 100,
                gap: selectedPeriodData.target_tabungan
            },
            { 
                name: 'Giro', 
                target: selectedPeriodData.target_giro, 
                position: oldestPeriodData.giro + selectedPeriodData.target_giro,
                achievement: 100,
                gap: selectedPeriodData.target_giro
            },
            { 
                name: 'Deposito', 
                target: selectedPeriodData.target_deposito, 
                position: oldestPeriodData.deposito + selectedPeriodData.target_deposito,
                achievement: 100,
                gap: selectedPeriodData.target_deposito
            },
            { 
                name: 'CASA', 
                target: selectedPeriodData.target_casa, 
                position: oldestPeriodData.casa + selectedPeriodData.target_casa,
                achievement: 100,
                gap: selectedPeriodData.target_casa
            }
        ];
    }

    setDpkData({
        historical: historicalData,
        targets: targetData
    });
};

    // Hitung MTD dari data historis
    const calculateMTD = () => {
        if (dpkData.historical.length < 2) return { dpk: 0, tabungan: 0, giro: 0, deposito: 0, casa: 0 };
        
        const currentIndex = dpkData.historical.findIndex(item => item.period === selectedPeriod);
        if (currentIndex <= 0) return { dpk: 0, tabungan: 0, giro: 0, deposito: 0, casa: 0 };
        
        const currentData = dpkData.historical[currentIndex];
        const previousData = dpkData.historical[currentIndex - 1];
        
        return {
            dpk: currentData.dpk - previousData.dpk,
            tabungan: currentData.tabungan - previousData.tabungan,
            giro: currentData.giro - previousData.giro,
            deposito: currentData.deposito - previousData.deposito,
            casa: currentData.casa - previousData.casa
        };
    };

    // Hitung YTD dari data historis
    const calculateYTD = () => {
        if (dpkData.historical.length === 0) return { dpk: 0, tabungan: 0, giro: 0, deposito: 0, casa: 0 };
        
        const currentData = dpkData.historical.find(item => item.period === selectedPeriod);
        const oldestData = dpkData.historical[0];
        
        if (!currentData || !oldestData) return { dpk: 0, tabungan: 0, giro: 0, deposito: 0, casa: 0 };
        
        return {
            dpk: currentData.dpk - oldestData.dpk,
            tabungan: currentData.tabungan - oldestData.tabungan,
            giro: currentData.giro - oldestData.giro,
            deposito: currentData.deposito - oldestData.deposito,
            casa: currentData.casa - oldestData.casa
        };
    };

    const handleRefreshDPK = async () => {
        setDpkLoading(true);
        try {
            const dpkResponse = await authService.getDPKData();
            if (dpkResponse.success) {
                processDPKData(dpkResponse.data);
            } else {
                setError(dpkResponse.error);
            }

            const dashboardResponse = await authService.getDashboardData();
            if (dashboardResponse.success) {
                setDashboardData(dashboardResponse.data);
            } else {
                setError(dashboardResponse.error);
            }
        } catch (error) {
            console.error('Failed to refresh data:', error);
            setError('Gagal merefresh data');
        } finally {
            setDpkLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleInputDPK = () => {
        navigate('/input');
    };

    // FORMAT NUMBER DIPERBAIKI - HILANGKAN ROUNDING ERROR
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '-';
        
        const numberValue = toNumber(num);
        if (isNaN(numberValue)) return '-';
        
        // Format tanpa desimal untuk angka bulat
        if (numberValue % 1 === 0) {
            return new Intl.NumberFormat('id-ID').format(numberValue);
        }
        
        // Format dengan 2 desimal untuk angka pecahan
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(numberValue);
    };

    const formatToBillionWithUnit = (num) => {
        if (num === null || num === undefined) return '-';
        
        const numberValue = toNumber(num);
        if (isNaN(numberValue)) return '-';
        
        const inBillion = numberValue / 1000;
        const formatted = new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        }).format(inBillion);
        
        return `${formatted} M`;
    };

    const getTrendIcon = (value) => {
        return value >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
    };

    const getTrendColor = (value) => {
        return value >= 0 ? 'text-emerald-500' : 'text-red-500';
    };

    const getAchievementColor = (value) => {
        const num = typeof value === 'string' 
            ? parseFloat(value.replace('%', '')) 
            : typeof value === 'number' ? value : 0;
        
        if (num >= 100) return 'bg-emerald-100 text-emerald-800';
        if (num >= 95) return 'bg-amber-100 text-amber-800';
        return 'bg-red-100 text-red-800';
    };

    const getPerformanceCards = () => {
        const latestData = dpkData.historical.find(item => item.period === selectedPeriod);
        if (!latestData) return [];

        const mtdData = calculateMTD();
        const ytdData = calculateYTD();

        return [
            {
                name: 'DPK',
                value: formatToBillionWithUnit(latestData.dpk),
                icon: <DollarSign className="w-6 h-6" />,
                mtd: formatToBillionWithUnit(mtdData.dpk),
                ytd: formatToBillionWithUnit(ytdData.dpk),
                achievement: '100%',
                trend: mtdData.dpk >= 0 ? 'up' : 'down',
                color: 'from-blue-500 to-blue-600'
            },
            {
                name: 'CASA',
                value: formatToBillionWithUnit(latestData.casa),
                icon: <Wallet className="w-6 h-6" />,
                mtd: formatToBillionWithUnit(mtdData.casa),
                ytd: formatToBillionWithUnit(ytdData.casa),
                achievement: '100%',
                trend: mtdData.casa >= 0 ? 'up' : 'down',
                color: 'from-emerald-500 to-emerald-600'
            },
            {
                name: 'Tabungan',
                value: formatToBillionWithUnit(latestData.tabungan),
                icon: <PiggyBank className="w-6 h-6" />,
                mtd: formatToBillionWithUnit(mtdData.tabungan),
                ytd: formatToBillionWithUnit(ytdData.tabungan),
                achievement: '100%',
                trend: mtdData.tabungan >= 0 ? 'up' : 'down',
                color: 'from-violet-500 to-violet-600'
            },
            {
                name: 'Giro',
                value: formatToBillionWithUnit(latestData.giro),
                icon: <CreditCard className="w-6 h-6" />,
                mtd: formatToBillionWithUnit(mtdData.giro),
                ytd: formatToBillionWithUnit(ytdData.giro),
                achievement: '100%',
                trend: mtdData.giro >= 0 ? 'up' : 'down',
                color: 'from-amber-500 to-amber-600'
            },
            {
                name: 'Deposito',
                value: formatToBillionWithUnit(latestData.deposito),
                icon: <Landmark className="w-6 h-6" />,
                mtd: formatToBillionWithUnit(mtdData.deposito),
                ytd: formatToBillionWithUnit(ytdData.deposito),
                achievement: '100%',
                trend: mtdData.deposito >= 0 ? 'up' : 'down',
                color: 'from-rose-500 to-rose-600'
            }
        ];
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

    const performanceCards = getPerformanceCards();
    const selectedPeriodData = dpkData.historical.find(item => item.period === selectedPeriod);

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
                                    Dashboard
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
                            
                            <button
                                onClick={handleRefreshDPK}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                disabled={dpkLoading}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${dpkLoading ? 'animate-spin' : ''}`} />
                                Refresh
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
                                    <div className="flex items-center space-x-2">
                                        <Target className="w-4 h-4" />
                                        <span>Periode: {selectedPeriod}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <BarChart3 className="w-4 h-4" />
                                        <span>Data Period: {dpkData.historical.length}</span>
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

                {/* Period Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <BarChart3 className="w-6 h-6 mr-3 text-emerald-500" />
                                Dashboard Period DPK
                            </h2>
                            <div className="text-sm text-gray-500">
                                Pilih periode untuk melihat data
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {dpkData.historical.map((item) => (
                                <button
                                    key={item.period}
                                    onClick={() => setSelectedPeriod(item.period)}
                                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                        selectedPeriod === item.period
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                    }`}
                                >
                                    {item.period}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Performance Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <LineChart className="w-6 h-6 mr-3 text-emerald-500" />
                        Kinerja DPK {selectedPeriod}
                    </h2>
                    
                    {/* Grid untuk semua cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Performance Cards - semua termasuk DPK */}
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {performanceCards.map((item, index) => {
                                // Achievement khusus untuk DPK saja ambil dari tabel TARGET
                                let achievementPercentage = item.achievement;
                                
                                if (item.name === 'DPK') {
                                    const targetItem = dpkData.targets.find(target => target.name === 'DPK');
                                    if (targetItem) {
                                        // Cari data aktual dari periode yang dipilih
                                        const actualData = dpkData.historical.find(hist => hist.period === selectedPeriod);
                                        const actualValue = actualData ? actualData.dpk : 0;
                                        
                                        // Hitung achievement: (Actual / Posisi) × 100%
                                        const positionValue = targetItem.position;
                                        const achievementValue = positionValue !== 0 
                                            ? (actualValue / positionValue) * 100 
                                            : 0;
                                        
                                        achievementPercentage = `${achievementValue.toFixed(1)}%`;
                                    }
                                } else {
                                    // Untuk card selain DPK, hitung achievement seperti sebelumnya
                                    const targetItem = dpkData.targets.find(target => target.name === item.name);
                                    
                                    if (targetItem) {
                                        // Cari data aktual dari periode yang dipilih
                                        const actualData = dpkData.historical.find(hist => hist.period === selectedPeriod);
                                        let actualValue = 0;
                                        
                                        switch(item.name) {
                                            case 'CASA':
                                                actualValue = actualData ? actualData.casa : 0;
                                                break;
                                            case 'Tabungan':
                                                actualValue = actualData ? actualData.tabungan : 0;
                                                break;
                                            case 'Giro':
                                                actualValue = actualData ? actualData.giro : 0;
                                                break;
                                            case 'Deposito':
                                                actualValue = actualData ? actualData.deposito : 0;
                                                break;
                                        }
                                        
                                        // Hitung achievement: (Actual / Posisi) × 100%
                                        const positionValue = targetItem.position;
                                        const achievementValue = positionValue !== 0 
                                            ? (actualValue / positionValue) * 100 
                                            : 0;
                                        
                                        achievementPercentage = `${achievementValue.toFixed(1)}%`;
                                    }
                                }
                                
                                return (
                                    <div 
                                        key={index} 
                                        className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div className={`h-2 bg-gradient-to-r ${item.color}`}></div>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center">
                                                    <div className="p-2 rounded-lg bg-gray-100 mr-3">
                                                        <div className="text-emerald-500">
                                                            {item.icon}
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    getAchievementColor(achievementPercentage)
                                                }`}>
                                                    {achievementPercentage}
                                                </span>
                                            </div>
                                            
                                            <p className="text-2xl font-bold text-gray-900 mb-4">{item.value}</p>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">MTD:</span>
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-900">{item.mtd}</span>
                                                        <span className={`ml-2 ${getTrendColor(item.trend === 'up' ? 1 : -1)}`}>
                                                            {getTrendIcon(item.trend === 'up' ? 1 : -1)}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">YTD:</span>
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-900">{item.ytd}</span>
                                                        <span className={`ml-2 ${getTrendColor(item.trend === 'up' ? 1 : -1)}`}>
                                                            {getTrendIcon(item.trend === 'up' ? 1 : -1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Pie Chart untuk Komposisi DPK */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <PieChart className="w-5 h-5 mr-2 text-blue-500" />
                                    Komposisi DPK
                                </h3>
                                
                                {/* Pie chart dan legend vertikal */}
                                <div className="flex flex-col items-center">
                                    {/* Pie Chart KECIL */}
                                    <div className="relative w-32 h-32 mb-4">
                                        {(() => {
                                            const periodData = dpkData.historical.find(hist => hist.period === selectedPeriod);
                                            
                                            if (periodData) {
                                                const dpk = periodData.dpk || 1;
                                                const tabungan = periodData.tabungan || 0;
                                                const giro = periodData.giro || 0;
                                                const deposito = periodData.deposito || 0;
                                                
                                                const tabunganPercent = (tabungan / dpk) * 100;
                                                const giroPercent = (giro / dpk) * 100;
                                                const depositoPercent = (deposito / dpk) * 100;
                                                
                                                return (
                                                    <>
                                                        <svg className="w-full h-full" viewBox="0 0 100 100">
                                                            <circle
                                                                cx="50"
                                                                cy="50"
                                                                r="40"
                                                                fill="transparent"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="20"
                                                                strokeDasharray={`${(tabunganPercent / 100) * 251.2} 251.2`}
                                                                strokeDashoffset="0"
                                                                transform="rotate(-90 50 50)"
                                                            />
                                                            
                                                            <circle
                                                                cx="50"
                                                                cy="50"
                                                                r="40"
                                                                fill="transparent"
                                                                stroke="#f59e0b"
                                                                strokeWidth="20"
                                                                strokeDasharray={`${(giroPercent / 100) * 251.2} 251.2`}
                                                                strokeDashoffset={`${-((tabunganPercent / 100) * 251.2)}`}
                                                                transform="rotate(-90 50 50)"
                                                            />
                                                            
                                                            <circle
                                                                cx="50"
                                                                cy="50"
                                                                r="40"
                                                                fill="transparent"
                                                                stroke="#f43f5e"
                                                                strokeWidth="20"
                                                                strokeDasharray={`${(depositoPercent / 100) * 251.2} 251.2`}
                                                                strokeDashoffset={`${-(((tabunganPercent + giroPercent) / 100) * 251.2)}`}
                                                                transform="rotate(-90 50 50)"
                                                            />
                                                            
                                                            <circle cx="50" cy="50" r="30" fill="white" />
                                                        </svg>
                                                        
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="text-center">
                                                                <p className="text-lg font-bold text-gray-900">
                                                                    {formatToBillionWithUnit(dpk)}
                                                                </p>
                                                                <p className="text-xs text-gray-600">Total DPK</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            }
                                            
                                            return (
                                                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                                                    <p className="text-gray-500 text-xs">No data</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    
                                    {/* Legend KECIL di bawah pie chart */}
                                    <div className="w-full">
                                        <div className="space-y-2">
                                            {(() => {
                                                const periodData = dpkData.historical.find(hist => hist.period === selectedPeriod);
                                                
                                                if (!periodData) {
                                                    return <p className="text-gray-500 text-xs">No data available</p>;
                                                }
                                                
                                                const dpk = periodData.dpk || 1;
                                                const tabungan = periodData.tabungan || 0;
                                                const giro = periodData.giro || 0;
                                                const deposito = periodData.deposito || 0;
                                                
                                                const items = [
                                                    { 
                                                        name: 'Tabungan', 
                                                        value: tabungan, 
                                                        percent: (tabungan / dpk) * 100,
                                                        color: 'bg-violet-500',
                                                        icon: <PiggyBank className="w-3 h-3" />
                                                    },
                                                    { 
                                                        name: 'Giro', 
                                                        value: giro, 
                                                        percent: (giro / dpk) * 100,
                                                        color: 'bg-amber-500',
                                                        icon: <CreditCard className="w-3 h-3" />
                                                    },
                                                    { 
                                                        name: 'Deposito', 
                                                        value: deposito, 
                                                        percent: (deposito / dpk) * 100,
                                                        color: 'bg-rose-500',
                                                        icon: <Landmark className="w-3 h-3" />
                                                    }
                                                ];
                                                
                                                return items.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center">
                                                            <div className={`w-2 h-2 rounded-full ${item.color} mr-2`}></div>
                                                            <div className="flex items-center text-xs text-gray-700">
                                                                {item.icon}
                                                                <span className="ml-1">{item.name}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-medium text-gray-900">
                                                                {formatNumber(item.value)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {item.percent.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                    
                                    {/* Info tambahan */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 w-full">
                                        <div className="text-xs text-gray-600">
                                            <p className="text-xs text-gray-500">
                                                Data periode: {selectedPeriod}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

               {/* Tabel Data DPK Historis - FIX PERHITUNGAN MTD & YTD */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                    <DollarSign className="w-6 h-6 mr-3 text-emerald-500" />
                                    Data Historis DPK {selectedPeriod}
                                </h2>
                                <div className="text-sm text-gray-500">
                                    {dpkData.historical.length} periode data
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Item
                                        </th>
                                        {dpkData.historical.map((item, index) => (
                                            <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {item.period}
                                            </th>
                                        ))}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Growth
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Δ MTD
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Δ YTD
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {[
                                        { key: 'dpk', label: 'DPK' },
                                        { key: 'tabungan', label: 'Tabungan' },
                                        { key: 'giro', label: 'Giro' },
                                        { key: 'deposito', label: 'Deposito' },
                                        { key: 'casa', label: 'CASA' },
                                    ].map((row) => {
                                        // Cari indeks periode yang dipilih
                                        const currentIndex = dpkData.historical.findIndex(item => item.period === selectedPeriod);
                                        
                                        if (currentIndex === -1) return null;
                                        
                                        const currentData = dpkData.historical[currentIndex];
                                        const firstData = dpkData.historical[0];
                                        const previousData = currentIndex > 0 ? dpkData.historical[currentIndex - 1] : null;
                                        
                                        const currentValue = currentData[row.key];
                                        const firstValue = firstData?.[row.key] || 0;
                                        const previousValue = previousData?.[row.key] || 0;
                                        
                                        // Growth dari pertama ke periode terpilih
                                        const totalGrowth = firstValue !== 0 ? ((currentValue - firstValue) / firstValue) * 100 : 0;
                                        
                                        // MTD: Current - Previous (jika ada previous) - DIPERBAIKI
                                        const mtdDelta = previousData ? currentValue - previousValue : 0;
                                        
                                        // YTD: Current - First - DIPERBAIKI
                                        const ytdDelta = currentValue - firstValue;

                                        return (
                                            <tr key={row.key} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {row.label}
                                                </td>
                                                {dpkData.historical.map((item, index) => (
                                                    <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatNumber(item[row.key])}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center text-sm ${getTrendColor(totalGrowth)}`}>
                                                        {getTrendIcon(totalGrowth)}
                                                        {`${totalGrowth.toFixed(2)}%`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatNumber(mtdDelta)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatNumber(ytdDelta)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Baris % CASA */}
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            % CASA
                                        </td>
                                        {dpkData.historical.map((item, index) => {
                                            const casaValue = item.casa || 0;
                                            const dpkValue = item.dpk || 0;
                                            const casaPercentage = dpkValue !== 0 ? (casaValue / dpkValue) * 100 : 0;
                                            
                                            return (
                                                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {casaPercentage.toFixed(2)}%
                                                </td>
                                            );
                                        })}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* Tabel Target dengan GAP yang DIPERBAIKI */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                    <PieChart className="w-6 h-6 mr-3 text-emerald-500" />
                                    TARGET DPK
                                </h2>
                                <div className="text-sm text-gray-500">
                                    Periode: {selectedPeriod}
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Growth
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Posisi
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ach Posisi
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            GAP
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dpkData.targets.map((item, index) => {
                                        const actualData = dpkData.historical.find(hist => hist.period === selectedPeriod);
                                        let actualValue = 0;
                                        
                                        switch(item.name) {
                                            case 'DPK': actualValue = actualData ? actualData.dpk : 0; break;
                                            case 'Tabungan': actualValue = actualData ? actualData.tabungan : 0; break;
                                            case 'Giro': actualValue = actualData ? actualData.giro : 0; break;
                                            case 'Deposito': actualValue = actualData ? actualData.deposito : 0; break;
                                            case 'CASA': actualValue = actualData ? actualData.casa : 0; break;
                                        }
                                        
                                        const targetValue = item.target;
                                        const positionValue = item.position;
                                        const actualValueNum = actualValue;
                                        
                                        // Achievement: (Actual / Posisi) × 100%
                                        const achievementValue = positionValue !== 0 
                                            ? (actualValueNum / positionValue) * 100 
                                            : 0;
                                        
                                        // GAP: Actual - Posisi
                                        const gapValue = actualValueNum - positionValue;
                                        
                                        return (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {targetValue > 0 ? formatNumber(targetValue) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatNumber(positionValue)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAchievementColor(achievementValue)}`}>
                                                        {achievementValue.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                                    gapValue < 0 ? 'text-red-600' : 'text-emerald-600'
                                                }`}>
                                                    {gapValue < 0 
                                                        ? `(${formatNumber(Math.abs(gapValue))})`
                                                        : gapValue === 0 
                                                            ? '0' 
                                                            : formatNumber(gapValue)
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Baris % CASA */}
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            % CASA
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {(() => {
                                                const dpkItem = dpkData.targets.find(item => item.name === 'DPK');
                                                const casaItem = dpkData.targets.find(item => item.name === 'CASA');
                                                
                                                if (dpkItem && casaItem && dpkItem.position !== 0) {
                                                    const casaPercentage = (casaItem.position / dpkItem.position) * 100;
                                                    return `${casaPercentage.toFixed(2)}%`;
                                                }
                                                return '-';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="px-6 py-3 bg-emerald-50 text-xs text-gray-600 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span>Posisi = Data periode Terlama + Target periode {selectedPeriod}</span>
                                <span className="text-emerald-700 font-medium">
                                    {selectedPeriod === '31-Dec' ? 'Target Akhir Tahun' : 'Target Periode'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
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
                            })} • Data diperbarui hari ini • {dpkData.historical.length} periode data
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;