import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import authService from '../services/auth';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Home,
  Car,
  Briefcase,
  Users,
  Gem,
  Target,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const DashboardPBY = ({ user, dashboardData }) => {
    const [pbyLoading, setPbyLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [pbyData, setPbyData] = useState({
        historical: [],
        targets: []
    });
    const [error, setError] = useState('');

    // Fungsi konversi ke number
    const toNumber = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return Math.round(value * 100) / 100;
        if (typeof value === 'string') {
            const cleaned = value.replace(/[^\d.-]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : Math.round(num * 100) / 100;
        }
        return 0;
    };

    // Load PBY data
    useEffect(() => {
        const loadPBYData = async () => {
            try {
                const pbyResponse = await authService.getPBYData();
                if (pbyResponse.success) {
                    processPBYData(pbyResponse.data);
                } else {
                    setError(pbyResponse.error);
                }
            } catch (error) {
                console.error('Failed to load PBY data:', error);
                setError('Gagal memuat data PBY');
            }
        };

        loadPBYData();
    }, []);

    // Update data ketika selectedPeriod berubah
    useEffect(() => {
        if (pbyData.historical.length > 0) {
            processPBYData(pbyData.historical);
        }
    }, [selectedPeriod]);

    // Process PBY data
    const processPBYData = (dataFromBackend) => {
        // Sort by date (period)
        const sortedData = [...dataFromBackend].sort((a, b) => {
            // Convert period to Date for sorting
            const parseDate = (period) => {
                try {
                    const parts = period.split('-');
                    if (parts.length === 3) {
                        const months = {
                            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                        };
                        const day = parts[0];
                        const month = months[parts[1]] || '01';
                        const year = parts[2];
                        return new Date(`${year}-${month}-${day}`);
                    }
                } catch (e) {
                    return new Date(0);
                }
                return new Date(0);
            };
            
            return parseDate(a.period) - parseDate(b.period);
        });

        const historicalData = sortedData.map(item => ({
            period: item.period,
            // Main values
            pby: toNumber(item.pby),
            cfg: toNumber(item.cfg),
            pwg: toNumber(item.pwg),
            // Segment values
            griya: toNumber(item.griya),
            oto: toNumber(item.oto),
            mitraguna: toNumber(item.mitraguna),
            pensiun: toNumber(item.pensiun),
            cicil_emas: toNumber(item.cicil_emas),
            // Cair values
            griya_cair: toNumber(item.griya_cair),
            oto_cair: toNumber(item.oto_cair),
            mitraguna_cair: toNumber(item.mitraguna_cair),
            pensiun_cair: toNumber(item.pensiun_cair),
            cicil_emas_cair: toNumber(item.cicil_emas_cair),
            cfg_cair: toNumber(item.cfg_cair),
            pwg_cair: toNumber(item.pwg_cair),
            pby_cair: toNumber(item.pby_cair),
            // Run Off values
            griya_runoff: toNumber(item.griya_runoff),
            oto_runoff: toNumber(item.oto_runoff),
            mitraguna_runoff: toNumber(item.mitraguna_runoff),
            pensiun_runoff: toNumber(item.pensiun_runoff),
            cicil_emas_runoff: toNumber(item.cicil_emas_runoff),
            cfg_runoff: toNumber(item.cfg_runoff),
            pwg_runoff: toNumber(item.pwg_runoff),
            pby_runoff: toNumber(item.pby_runoff),
            // Target values
            target_pby: toNumber(item.target_pby),
            target_cfg: toNumber(item.target_cfg),
            target_pwg: toNumber(item.target_pwg),
            target_griya: toNumber(item.target_griya),
            target_oto: toNumber(item.target_oto),
            target_mitraguna: toNumber(item.target_mitraguna),
            target_pensiun: toNumber(item.target_pensiun),
            target_cicil_emas: toNumber(item.target_cicil_emas)
        }));

        const selectedPeriodData = historicalData.find(item => item.period === selectedPeriod);
        const oldestPeriodData = historicalData[0];
        
        let targetData = [];
        
        if (selectedPeriodData && oldestPeriodData) {
            // URUTAN SESUAI PERMINTAAN: PBY → CFG → Griya → Oto → Mitraguna → Pensiun → PWG → Cicil Emas
            targetData = [
                { 
                    name: 'PBY', 
                    target: selectedPeriodData.target_pby, 
                    position: oldestPeriodData.pby + selectedPeriodData.target_pby,
                    achievement: 100,
                    gap: selectedPeriodData.target_pby,
                    type: 'main'
                },
                { 
                    name: 'CFG', 
                    target: selectedPeriodData.target_cfg, 
                    position: oldestPeriodData.cfg + selectedPeriodData.target_cfg,
                    achievement: 100,
                    gap: selectedPeriodData.target_cfg,
                    type: 'sub'
                },
                { 
                    name: 'Griya', 
                    target: selectedPeriodData.target_griya, 
                    position: oldestPeriodData.griya + selectedPeriodData.target_griya,
                    achievement: 100,
                    gap: selectedPeriodData.target_griya,
                    type: 'segment'
                },
                { 
                    name: 'Oto', 
                    target: selectedPeriodData.target_oto, 
                    position: oldestPeriodData.oto + selectedPeriodData.target_oto,
                    achievement: 100,
                    gap: selectedPeriodData.target_oto,
                    type: 'segment'
                },
                { 
                    name: 'Mitraguna', 
                    target: selectedPeriodData.target_mitraguna, 
                    position: oldestPeriodData.mitraguna + selectedPeriodData.target_mitraguna,
                    achievement: 100,
                    gap: selectedPeriodData.target_mitraguna,
                    type: 'segment'
                },
                { 
                    name: 'Pensiun', 
                    target: selectedPeriodData.target_pensiun, 
                    position: oldestPeriodData.pensiun + selectedPeriodData.target_pensiun,
                    achievement: 100,
                    gap: selectedPeriodData.target_pensiun,
                    type: 'segment'
                },
                { 
                    name: 'PWG', 
                    target: selectedPeriodData.target_pwg, 
                    position: oldestPeriodData.pwg + selectedPeriodData.target_pwg,
                    achievement: 100,
                    gap: selectedPeriodData.target_pwg,
                    type: 'sub'
                },
                { 
                    name: 'Cicil Emas', 
                    target: selectedPeriodData.target_cicil_emas, 
                    position: oldestPeriodData.cicil_emas + selectedPeriodData.target_cicil_emas,
                    achievement: 100,
                    gap: selectedPeriodData.target_cicil_emas,
                    type: 'segment'
                }
            ];
        }

        setPbyData({
            historical: historicalData,
            targets: targetData
        });

        // Set selected period to latest if not set
        if (historicalData.length > 0 && !selectedPeriod) {
            setSelectedPeriod(historicalData[historicalData.length - 1].period);
        }
    };

    // Hitung MTD
    const calculateMTD = () => {
        if (pbyData.historical.length < 2) return {
            pby: 0, cfg: 0, pwg: 0,
            griya: 0, oto: 0, mitraguna: 0, pensiun: 0, cicil_emas: 0
        };
        
        const currentIndex = pbyData.historical.findIndex(item => item.period === selectedPeriod);
        if (currentIndex <= 0) return {
            pby: 0, cfg: 0, pwg: 0,
            griya: 0, oto: 0, mitraguna: 0, pensiun: 0, cicil_emas: 0
        };
        
        const currentData = pbyData.historical[currentIndex];
        const previousData = pbyData.historical[currentIndex - 1];
        
        return {
            pby: currentData.pby - previousData.pby,
            cfg: currentData.cfg - previousData.cfg,
            pwg: currentData.pwg - previousData.pwg,
            griya: currentData.griya - previousData.griya,
            oto: currentData.oto - previousData.oto,
            mitraguna: currentData.mitraguna - previousData.mitraguna,
            pensiun: currentData.pensiun - previousData.pensiun,
            cicil_emas: currentData.cicil_emas - previousData.cicil_emas
        };
    };

    // Hitung YTD
    const calculateYTD = () => {
        if (pbyData.historical.length === 0) return {
            pby: 0, cfg: 0, pwg: 0,
            griya: 0, oto: 0, mitraguna: 0, pensiun: 0, cicil_emas: 0
        };
        
        const currentData = pbyData.historical.find(item => item.period === selectedPeriod);
        const oldestData = pbyData.historical[0];
        
        if (!currentData || !oldestData) return {
            pby: 0, cfg: 0, pwg: 0,
            griya: 0, oto: 0, mitraguna: 0, pensiun: 0, cicil_emas: 0
        };
        
        return {
            pby: currentData.pby - oldestData.pby,
            cfg: currentData.cfg - oldestData.cfg,
            pwg: currentData.pwg - oldestData.pwg,
            griya: currentData.griya - oldestData.griya,
            oto: currentData.oto - oldestData.oto,
            mitraguna: currentData.mitraguna - oldestData.mitraguna,
            pensiun: currentData.pensiun - oldestData.pensiun,
            cicil_emas: currentData.cicil_emas - oldestData.cicil_emas
        };
    };

    // Refresh PBY data
    const handleRefreshPBY = async () => {
        setPbyLoading(true);
        try {
            const pbyResponse = await authService.getPBYData();
            if (pbyResponse.success) {
                processPBYData(pbyResponse.data);
            } else {
                setError(pbyResponse.error);
            }
        } catch (error) {
            console.error('Failed to refresh data:', error);
            setError('Gagal merefresh data');
        } finally {
            setPbyLoading(false);
        }
    };

    // Format number
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '-';
        
        const numberValue = toNumber(num);
        if (isNaN(numberValue)) return '-';
        
        if (numberValue % 1 === 0) {
            return new Intl.NumberFormat('id-ID').format(numberValue);
        }
        
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(numberValue);
    };

   const formatForPerformanceCard = (num) => {
    if (num === null || num === undefined) return '-';
    
    const numberValue = toNumber(num);
    if (isNaN(numberValue)) return '-';
    
    if (numberValue === 0) return '0';
    
    const isNegative = numberValue < 0;
    const absValue = Math.abs(numberValue);
    const inBillion = absValue / 1000; // Konversi Juta ke Miliar
    
    // CEK APAKAH ADA DESIMAL SIGNIFIKAN (≥ 0,05 untuk M, ≥ 0,5 untuk Jt)
    const hasSignificantDecimal = (value, threshold = 0.05) => {
        const decimal = Math.abs(value - Math.floor(value));
        return decimal >= threshold;
    };
    
    // CEK APAKAH BILANGAN BULAT (desimal < 0,001)
    const isAlmostInteger = (value) => {
        const decimal = Math.abs(value - Math.round(value));
        return decimal < 0.001;
    };
    
    // ≥ 100 M (100.000 Juta)
    if (inBillion >= 100) {
        // Cek apakah bilangan bulat (contoh: 230.000)
        if (isAlmostInteger(inBillion)) {
            return `${isNegative ? '-' : ''}${Math.round(inBillion)} M`;
        } else {
            return `${isNegative ? '-' : ''}${inBillion.toFixed(1).replace('.', ',')} M`;
        }
    }
    // Di bagian 10-99,9 M:
else if (inBillion >= 10) {
    // Bulatkan dulu ke 1 desimal
    const roundedToOneDecimal = Math.round(inBillion * 10) / 10;
    
    // Cek apakah setelah dibulatkan jadi bilangan bulat
    if (Math.abs(roundedToOneDecimal - Math.round(roundedToOneDecimal)) < 0.001) {
        // Contoh: 21,968 → 22,0 → 22 M
        return `${isNegative ? '-' : ''}${Math.round(roundedToOneDecimal)} M`;
    }
    // Cek apakah ada desimal signifikan (≥ 0,05)
    else if (hasSignificantDecimal(inBillion, 0.05)) {
        // Contoh: 42,098 → 42,1 M
        return `${isNegative ? '-' : ''}${roundedToOneDecimal.toFixed(1).replace('.', ',')} M`;
    } 
    // Desimal kecil (< 50 juta), bulatkan ke integer
    else {
        // Contoh: 24,022 → 24 M
        return `${isNegative ? '-' : ''}${Math.round(inBillion)} M`;
    }
}
    // 1-9,9 M (1.000-9.999 Juta)
    else if (inBillion >= 1) {
        // Cek apakah bilangan bulat (contoh: 6.000 → 6 M)
        if (isAlmostInteger(inBillion)) {
            return `${isNegative ? '-' : ''}${Math.round(inBillion)} M`;
        } 
        // Cek apakah ada desimal signifikan (≥ 0,05 = 50 juta)
        else if (hasSignificantDecimal(inBillion, 0.05)) {
            return `${isNegative ? '-' : ''}${inBillion.toFixed(1).replace('.', ',')} M`;
        } 
        // Desimal kecil (< 50 juta), bulatkan
        else {
            return `${isNegative ? '-' : ''}${Math.round(inBillion)} M`;
        }
    }
    // 100-999 Jt
    else if (inBillion >= 0.1) {
        const inMillion = inBillion * 1000;
        return `${isNegative ? '-' : ''}${Math.round(inMillion)} Jt`;
    }
    // 10-99 Jt
    else if (inBillion >= 0.01) {
        const inMillion = inBillion * 1000;
        return `${isNegative ? '-' : ''}${Math.round(inMillion)} Jt`;
    }
    // 1-9,9 Jt
    else if (inBillion >= 0.001) {
        const inMillion = inBillion * 1000;
        // Cek apakah bilangan bulat (contoh: 2.000.000 → 2 Jt)
        if (isAlmostInteger(inMillion)) {
            return `${isNegative ? '-' : ''}${Math.round(inMillion)} Jt`;
        } 
        // Cek apakah ada desimal signifikan (≥ 0,5 = 500 ribu)
        else if (hasSignificantDecimal(inMillion, 0.5)) {
            return `${isNegative ? '-' : ''}${inMillion.toFixed(1).replace('.', ',')} Jt`;
        } 
        // Desimal kecil (< 500 ribu), bulatkan
        else {
            return `${isNegative ? '-' : ''}${Math.round(inMillion)} Jt`;
        }
    }
    // < 1 Jt
    else {
        const inThousand = inBillion * 1000000;
        return `${isNegative ? '-' : ''}${Math.round(inThousand)} Rb`;
    }
};

    // Helper functions
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
        if (num >= 95.5) return 'bg-amber-100 text-amber-800';
        return 'bg-red-100 text-red-800';
    };

    // Get icon for each segment
    const getSegmentIcon = (segmentName) => {
        switch(segmentName) {
            case 'PBY': return <DollarSign className="w-5 h-5" />;
            case 'CFG': return <BarChart3 className="w-5 h-5" />;
            case 'PWG': return <Gem className="w-5 h-5" />;
            case 'Griya': return <Home className="w-5 h-5" />;
            case 'Oto': return <Car className="w-5 h-5" />;
            case 'Mitraguna': return <Briefcase className="w-5 h-5" />;
            case 'Pensiun': return <Users className="w-5 h-5" />;
            case 'Cicil Emas': return <Gem className="w-5 h-5" />;
            default: return <DollarSign className="w-5 h-5" />;
        }
    };

    // Get color for each segment
    const getSegmentColor = (segmentName) => {
        switch(segmentName) {
            case 'PBY': return 'from-blue-500 to-blue-600';
            case 'CFG': return 'from-emerald-500 to-emerald-600';
            case 'PWG': return 'from-pink-500 to-pink-600';
            case 'Griya': return 'from-blue-500 to-blue-600';
            case 'Oto': return 'from-green-500 to-green-600';
            case 'Mitraguna': return 'from-purple-500 to-purple-600';
            case 'Pensiun': return 'from-amber-500 to-amber-600';
            case 'Cicil Emas': return 'from-pink-500 to-pink-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

   // Get performance cards - URUTAN: PBY → CFG → Griya → Oto → Mitraguna → Pensiun → PWG → Cicil Emas
const getPerformanceCards = () => {
    const latestData = pbyData.historical.find(item => item.period === selectedPeriod);
    if (!latestData) return [];

    const mtdData = calculateMTD();
    const ytdData = calculateYTD();

    return [
        {
            name: 'PBY',
            value: formatForPerformanceCard(latestData.pby),
            icon: getSegmentIcon('PBY'),
            mtd: formatForPerformanceCard(mtdData.pby),
            ytd: formatForPerformanceCard(ytdData.pby),
            achievement: '100%',
            mtdTrend: mtdData.pby >= 0 ? 'up' : 'down',
            ytdTrend: ytdData.pby >= 0 ? 'up' : 'down',
            color: getSegmentColor('PBY'),
            type: 'main'
        },
        {
            name: 'CFG',
            value: formatForPerformanceCard(latestData.cfg),
            icon: getSegmentIcon('CFG'),
            mtd: formatForPerformanceCard(mtdData.cfg),
            ytd: formatForPerformanceCard(ytdData.cfg),
            achievement: '100%',
            mtdTrend: mtdData.cfg >= 0 ? 'up' : 'down',
            ytdTrend: ytdData.cfg >= 0 ? 'up' : 'down',
            color: getSegmentColor('CFG'),
            type: 'sub'
        },
        {
            name: 'Griya',
            value: formatForPerformanceCard(latestData.griya),
            icon: getSegmentIcon('Griya'),
            mtd: formatForPerformanceCard(mtdData.griya),
            ytd: formatForPerformanceCard(ytdData.griya),
            achievement: '100%',
            mtdTrend: mtdData.griya >= 0 ? 'up' : 'down',
            ytdTrend: ytdData.griya >= 0 ? 'up' : 'down',
            color: getSegmentColor('Griya'),
            type: 'segment'
        },
        {
            name: 'Oto',
            value: formatForPerformanceCard(latestData.oto),
            icon: getSegmentIcon('Oto'),
            mtd: formatForPerformanceCard(mtdData.oto),
            ytd: formatForPerformanceCard(ytdData.oto),
            achievement: '100%',
            mtdTrend: mtdData.oto >= 0 ? 'up' : 'down',
            ytdTrend: ytdData.oto >= 0 ? 'up' : 'down',
            color: getSegmentColor('Oto'),
            type: 'segment'
        },
        {
            name: 'Mitraguna',
            value: formatForPerformanceCard(latestData.mitraguna),
            icon: getSegmentIcon('Mitraguna'),
            mtd: formatForPerformanceCard(mtdData.mitraguna),
            ytd: formatForPerformanceCard(ytdData.mitraguna),
            achievement: '100%',
            mtdTrend: mtdData.mitraguna >= 0 ? 'up' : 'down',
            ytdTrend: ytdData.mitraguna >= 0 ? 'up' : 'down',
            color: getSegmentColor('Mitraguna'),
            type: 'segment'
        },
        {
            name: 'Pensiun',
            value: formatForPerformanceCard(latestData.pensiun),
            icon: getSegmentIcon('Pensiun'),
            mtd: formatForPerformanceCard(mtdData.pensiun),
            ytd: formatForPerformanceCard(ytdData.pensiun),
            achievement: '100%',
            mtdTrend: mtdData.pensiun >= 0 ? 'up' : 'down',
            ytdTrend: ytdData.pensiun >= 0 ? 'up' : 'down',
            color: getSegmentColor('Pensiun'),
            type: 'segment'
        },
        {
            name: 'PWG',
            value: formatForPerformanceCard(latestData.pwg),
            icon: getSegmentIcon('PWG'),
            mtd: formatForPerformanceCard(mtdData.pwg),
            ytd: formatForPerformanceCard(ytdData.pwg),
            achievement: '100%',
            mtdTrend: mtdData.pwg >= 0 ? 'up' : 'down',
            ytdTrend: ytdData.pwg >= 0 ? 'up' : 'down',
            color: getSegmentColor('PWG'),
            type: 'sub'
        },
        {
            name: 'Cicil Emas',
            value: formatForPerformanceCard(latestData.cicil_emas),
            icon: getSegmentIcon('Cicil Emas'),
            mtd: formatForPerformanceCard(mtdData.cicil_emas),
            ytd: formatForPerformanceCard(ytdData.cicil_emas),
            achievement: '100%',
            mtdTrend: mtdData.cicil_emas >= 0 ? 'up' : 'down',
            ytdTrend: ytdData.cicil_emas >= 0 ? 'up' : 'down',
            color: getSegmentColor('Cicil Emas'),
            type: 'segment'
        }
    ];
};

    const performanceCards = getPerformanceCards();

    // Get Cair value for table
    const getCairValue = (segmentName, periodData) => {
        switch(segmentName) {
            case 'PBY': return periodData.pby_cair;
            case 'CFG': return periodData.cfg_cair;
            case 'PWG': return periodData.pwg_cair;
            case 'Griya': return periodData.griya_cair;
            case 'Oto': return periodData.oto_cair;
            case 'Mitraguna': return periodData.mitraguna_cair;
            case 'Pensiun': return periodData.pensiun_cair;
            case 'Cicil Emas': return periodData.cicil_emas_cair;
            default: return 0;
        }
    };

    // Get Run Off value for table
    const getRunOffValue = (segmentName, periodData) => {
        switch(segmentName) {
            case 'PBY': return periodData.pby_runoff;
            case 'CFG': return periodData.cfg_runoff;
            case 'PWG': return periodData.pwg_runoff;
            case 'Griya': return periodData.griya_runoff;
            case 'Oto': return periodData.oto_runoff;
            case 'Mitraguna': return periodData.mitraguna_runoff;
            case 'Pensiun': return periodData.pensiun_runoff;
            case 'Cicil Emas': return periodData.cicil_emas_runoff;
            default: return 0;
        }
    };

    // Get Actual value for table
    const getActualValue = (segmentName, periodData) => {
        switch(segmentName) {
            case 'PBY': return periodData.pby;
            case 'CFG': return periodData.cfg;
            case 'PWG': return periodData.pwg;
            case 'Griya': return periodData.griya;
            case 'Oto': return periodData.oto;
            case 'Mitraguna': return periodData.mitraguna;
            case 'Pensiun': return periodData.pensiun;
            case 'Cicil Emas': return periodData.cicil_emas;
            default: return 0;
        }
    };

    return (
        <>
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
                            Dashboard Period PBY
                        </h2>
                        <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500">
                                Pilih periode untuk melihat data
                            </div>
                            <button
                                onClick={handleRefreshPBY}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                disabled={pbyLoading}
                            >
                                <RefreshCw className={`w-4 h-4 ${pbyLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {pbyData.historical.map((item) => (
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

           {/* Performance Cards - URUTAN: PBY → CFG → Griya → Oto → Mitraguna → Pensiun → PWG → Cicil Emas */}
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="mb-8"
>
    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <LineChart className="w-6 h-6 mr-3 text-emerald-500" />
        Kinerja PBY {selectedPeriod}
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceCards.map((item, index) => {
                // Calculate achievement percentage
                let achievementPercentage = item.achievement;
                
                const targetItem = pbyData.targets?.find(target => target.name === item.name);
                
                if (targetItem) {
                    const actualData = pbyData.historical.find(hist => hist.period === selectedPeriod);
                    const actualValue = getActualValue(item.name, actualData || {});
                    const positionValue = targetItem.position;
                    const achievementValue = positionValue !== 0 
                        ? (actualValue / positionValue) * 100 
                        : 0;
                    achievementPercentage = `${achievementValue.toFixed(1)}%`;
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
                                        <span className={`ml-2 ${getTrendColor(item.mtdTrend === 'up' ? 1 : -1)}`}>
                                            {getTrendIcon(item.mtdTrend === 'up' ? 1 : -1)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">YTD:</span>
                                    <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{item.ytd}</span>
                                        <span className={`ml-2 ${getTrendColor(item.ytdTrend === 'up' ? 1 : -1)}`}>
                                            {getTrendIcon(item.ytdTrend === 'up' ? 1 : -1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
                    
                    {/* Pie Chart - Komposisi PBY per Segment */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <PieChart className="w-5 h-5 mr-2 text-blue-500" />
                                Komposisi PBY
                            </h3>
                            
                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 mb-4">
                                    {(() => {
                                        const periodData = pbyData.historical.find(hist => hist.period === selectedPeriod);
                                        
                                        if (periodData) {
                                            const pbyValue = periodData.pby || 1;
                                            const segments = [
                                                { name: 'Griya', value: periodData.griya || 0, color: '#3b82f6' },
                                                { name: 'Oto', value: periodData.oto || 0, color: '#10b981' },
                                                { name: 'Mitraguna', value: periodData.mitraguna || 0, color: '#8b5cf6' },
                                                { name: 'Pensiun', value: periodData.pensiun || 0, color: '#f59e0b' },
                                                { name: 'Cicil Emas', value: periodData.cicil_emas || 0, color: '#ec4899' }
                                            ];
                                            
                                            // Calculate percentages
                                            const percentages = segments.map(seg => ({
                                                ...seg,
                                                percent: (seg.value / pbyValue) * 100
                                            }));
                                            
                                            // Calculate stroke dasharray
                                            let accumulatedOffset = 0;
                                            const strokeSegments = percentages.map(seg => {
                                                const strokeLength = (seg.percent / 100) * 251.2; // 2 * π * 40
                                                const segment = {
                                                    ...seg,
                                                    strokeLength,
                                                    dashOffset: accumulatedOffset
                                                };
                                                accumulatedOffset += strokeLength;
                                                return segment;
                                            });
                                            
                                            return (
                                                <>
                                                    <svg className="w-full h-full" viewBox="0 0 100 100">
                                                        {strokeSegments.map((seg, index) => (
                                                            <circle
                                                                key={index}
                                                                cx="50"
                                                                cy="50"
                                                                r="40"
                                                                fill="transparent"
                                                                stroke={seg.color}
                                                                strokeWidth="20"
                                                                strokeDasharray={`${seg.strokeLength} 251.2`}
                                                                strokeDashoffset={`${-seg.dashOffset}`}
                                                                transform="rotate(-90 50 50)"
                                                            />
                                                        ))}
                                                        <circle cx="50" cy="50" r="30" fill="white" />
                                                    </svg>
                                                    
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <p className="text-lg font-bold text-gray-900">
                                                                {formatForPerformanceCard(pbyValue)}
                                                            </p>
                                                            <p className="text-xs text-gray-600">Total PBY</p>
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
                                
                                <div className="w-full">
                                    <div className="space-y-2">
                                        {(() => {
                                            const periodData = pbyData.historical.find(hist => hist.period === selectedPeriod);
                                            
                                            if (!periodData) {
                                                return <p className="text-gray-500 text-xs">No data available</p>;
                                            }
                                            
                                            const pbyValue = periodData.pby || 1;
                                            const segments = [
                                                { 
                                                    name: 'Griya', 
                                                    value: periodData.griya || 0, 
                                                    color: 'bg-blue-500',
                                                    icon: <Home className="w-3 h-3" />
                                                },
                                                { 
                                                    name: 'Oto', 
                                                    value: periodData.oto || 0, 
                                                    color: 'bg-green-500',
                                                    icon: <Car className="w-3 h-3" />
                                                },
                                                { 
                                                    name: 'Mitraguna', 
                                                    value: periodData.mitraguna || 0, 
                                                    color: 'bg-purple-500',
                                                    icon: <Briefcase className="w-3 h-3" />
                                                },
                                                { 
                                                    name: 'Pensiun', 
                                                    value: periodData.pensiun || 0, 
                                                    color: 'bg-amber-500',
                                                    icon: <Users className="w-3 h-3" />
                                                },
                                                { 
                                                    name: 'Cicil Emas', 
                                                    value: periodData.cicil_emas || 0, 
                                                    color: 'bg-pink-500',
                                                    icon: <Gem className="w-3 h-3" />
                                                }
                                            ];
                                            
                                            return segments.map((item, index) => (
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
                                                            {pbyValue !== 0 ? ((item.value / pbyValue) * 100).toFixed(1) : '0.0'}%
                                                        </p>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                                
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

            {/* Tabel Data Historis - URUTAN: PBY → CFG → Griya → Oto → Mitraguna → Pensiun → PWG → Cicil Emas */}
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
                                Data Historis PBY {selectedPeriod}
                            </h2>
                            <div className="text-sm text-gray-500">
                                {pbyData.historical.length} periode data
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
                                    {pbyData.historical.map((item, index) => (
                                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {item.period}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cair
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Run Off
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
                                    { key: 'pby', label: 'PBY', type: 'main' },
                                    { key: 'cfg', label: 'CFG', type: 'sub' },
                                    { key: 'griya', label: 'Griya', type: 'segment' },
                                    { key: 'oto', label: 'Oto', type: 'segment' },
                                    { key: 'mitraguna', label: 'Mitraguna', type: 'segment' },
                                    { key: 'pensiun', label: 'Pensiun', type: 'segment' },
                                    { key: 'pwg', label: 'PWG', type: 'sub' },
                                    { key: 'cicil_emas', label: 'Cicil Emas', type: 'segment' },
                                ].map((row) => {
                                    const currentIndex = pbyData.historical.findIndex(item => item.period === selectedPeriod);
                                    
                                    if (currentIndex === -1) return null;
                                    
                                    const currentData = pbyData.historical[currentIndex];
                                    const firstData = pbyData.historical[0];
                                    const previousData = currentIndex > 0 ? pbyData.historical[currentIndex - 1] : null;
                                    
                                    const currentValue = getActualValue(row.label, currentData);
                                    const firstValue = firstData ? getActualValue(row.label, firstData) : 0;
                                    const previousValue = previousData ? getActualValue(row.label, previousData) : 0;
                                    
                                    const mtdDelta = previousData ? currentValue - previousValue : 0;
                                    const ytdDelta = currentValue - firstValue;

                                    return (
                                        <tr key={row.key} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {row.label}
                                            </td>
                                            {pbyData.historical.map((item, index) => (
                                                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatNumber(getActualValue(row.label, item))}
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatNumber(getCairValue(row.label, currentData))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatNumber(getRunOffValue(row.label, currentData))}
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
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>

            {/* Tabel Target - URUTAN: PBY → CFG → Griya → Oto → Mitraguna → Pensiun → PWG → Cicil Emas */}
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
                                TARGET PBY
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
                                {pbyData.targets.map((item, index) => {
                                    const actualData = pbyData.historical.find(hist => hist.period === selectedPeriod);
                                    const actualValue = getActualValue(item.name, actualData || {});
                                    const targetValue = item.target;
                                    const positionValue = item.position;
                                    
                                    const achievementValue = positionValue !== 0 
                                        ? (actualValue / positionValue) * 100 
                                        : 0;
                                    
                                    const gapValue = actualValue - positionValue;
                                    
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
        </>
    );
};

export default DashboardPBY;