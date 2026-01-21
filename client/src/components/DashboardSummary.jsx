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
  Coins,
  CreditCard,
  Landmark,
  Building,
  AlertTriangle,
  RefreshCw,
  Wallet,
  Banknote
} from 'lucide-react';

const DashboardSummary = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [latestPeriod, setLatestPeriod] = useState('');
    
    // Data dari semua dashboard
    const [dpkData, setDpkData] = useState({ historical: [], targets: [] });
    const [pbyData, setPbyData] = useState({ historical: [], targets: [] });
    const [kol2Data, setKol2Data] = useState({ historical: [] });
    const [npfData, setNpfData] = useState({ historical: [] });

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

    // Format untuk performance card (M/Jt/Rb)
    const formatForPerformanceCard = (num) => {
        if (num === null || num === undefined) return '-';
        
        const numberValue = toNumber(num);
        if (isNaN(numberValue)) return '-';
        
        if (numberValue === 0) return '0';
        
        const isNegative = numberValue < 0;
        const absValue = Math.abs(numberValue);
        const inBillion = absValue / 1000; // Konversi Juta ke Miliar
        
        const hasSignificantDecimal = (value, threshold = 0.05) => {
            const decimal = Math.abs(value - Math.floor(value));
            return decimal >= threshold;
        };
        
        const isAlmostInteger = (value) => {
            const decimal = Math.abs(value - Math.round(value));
            return decimal < 0.001;
        };
        
        // ≥ 100 M
        if (inBillion >= 100) {
            if (isAlmostInteger(inBillion)) {
                return `${isNegative ? '-' : ''}${Math.round(inBillion)} M`;
            } else {
                return `${isNegative ? '-' : ''}${inBillion.toFixed(1).replace('.', ',')} M`;
            }
        }
        // 10-99,9 M
        else if (inBillion >= 10) {
            const roundedToOneDecimal = Math.round(inBillion * 10) / 10;
            
            if (Math.abs(roundedToOneDecimal - Math.round(roundedToOneDecimal)) < 0.001) {
                return `${isNegative ? '-' : ''}${Math.round(roundedToOneDecimal)} M`;
            }
            else if (hasSignificantDecimal(inBillion, 0.05)) {
                return `${isNegative ? '-' : ''}${roundedToOneDecimal.toFixed(1).replace('.', ',')} M`;
            } 
            else {
                return `${isNegative ? '-' : ''}${Math.round(inBillion)} M`;
            }
        }
        // 1-9,9 M
        else if (inBillion >= 1) {
            if (isAlmostInteger(inBillion)) {
                return `${isNegative ? '-' : ''}${Math.round(inBillion)} M`;
            } 
            else if (hasSignificantDecimal(inBillion, 0.05)) {
                return `${isNegative ? '-' : ''}${inBillion.toFixed(1).replace('.', ',')} M`;
            } 
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
            if (isAlmostInteger(inMillion)) {
                return `${isNegative ? '-' : ''}${Math.round(inMillion)} Jt`;
            } 
            else if (hasSignificantDecimal(inMillion, 0.5)) {
                return `${isNegative ? '-' : ''}${inMillion.toFixed(1).replace('.', ',')} Jt`;
            } 
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

    // Load semua data
    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);
                
                // Load DPK data
                const dpkResponse = await authService.getDPKData();
                if (dpkResponse.success) {
                    const sortedDpk = [...dpkResponse.data].sort((a, b) => {
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
                    
                    const historicalDpk = sortedDpk.map(item => ({
                        period: item.period,
                        dpk: toNumber(item.dpk),
                        tabungan: toNumber(item.tabungan),
                        giro: toNumber(item.giro),
                        deposito: toNumber(item.deposito),
                        casa: toNumber(item.casa),
                        casa_percentage: toNumber(item.casa_percentage),
                        target_dpk: toNumber(item.target_dpk),
                        target_tabungan: toNumber(item.target_tabungan),
                        target_giro: toNumber(item.target_giro),
                        target_deposito: toNumber(item.target_deposito),
                        target_casa: toNumber(item.target_casa)
                    }));

                    // ========== PERBAIKAN: Position = Oldest data + Target growth ==========
                    const targetsDpk = historicalDpk.length > 0 ? [
                        { 
                            name: 'DPK', 
                            position: (historicalDpk[0]?.dpk || 0) + (historicalDpk[historicalDpk.length - 1]?.target_dpk || 0)
                        },
                        { 
                            name: 'CASA', 
                            position: (historicalDpk[0]?.casa || 0) + (historicalDpk[historicalDpk.length - 1]?.target_casa || 0)
                        },
                        { 
                            name: 'Tabungan', 
                            position: (historicalDpk[0]?.tabungan || 0) + (historicalDpk[historicalDpk.length - 1]?.target_tabungan || 0)
                        },
                        { 
                            name: 'Giro', 
                            position: (historicalDpk[0]?.giro || 0) + (historicalDpk[historicalDpk.length - 1]?.target_giro || 0)
                        },
                        { 
                            name: 'Deposito', 
                            position: (historicalDpk[0]?.deposito || 0) + (historicalDpk[historicalDpk.length - 1]?.target_deposito || 0)
                        }
                    ] : [];

                    setDpkData({
                        historical: historicalDpk,
                        targets: targetsDpk
                    });

                    if (historicalDpk.length > 0 && !latestPeriod) {
                        setLatestPeriod(historicalDpk[historicalDpk.length - 1].period);
                    }
                }
                
                // Load PBY data
                const pbyResponse = await authService.getPBYData();
                if (pbyResponse.success) {
                    const sortedPby = [...pbyResponse.data].sort((a, b) => {
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

                    const historicalPby = sortedPby.map(item => ({
                        period: item.period,
                        pby: toNumber(item.pby),
                        cfg: toNumber(item.cfg),
                        pwg: toNumber(item.pwg),
                        griya: toNumber(item.griya),
                        oto: toNumber(item.oto),
                        mitraguna: toNumber(item.mitraguna),
                        pensiun: toNumber(item.pensiun),
                        cicil_emas: toNumber(item.cicil_emas),
                        target_pby: toNumber(item.target_pby),
                        target_cfg: toNumber(item.target_cfg),
                        target_pwg: toNumber(item.target_pwg),
                        target_griya: toNumber(item.target_griya),
                        target_oto: toNumber(item.target_oto),
                        target_mitraguna: toNumber(item.target_mitraguna),
                        target_pensiun: toNumber(item.target_pensiun),
                        target_cicil_emas: toNumber(item.target_cicil_emas)
                    }));

                    // ========== PERBAIKAN: Position = Oldest data + Target growth ==========
                    const targetsPby = historicalPby.length > 0 ? [
                        { 
                            name: 'PBY', 
                            position: (historicalPby[0]?.pby || 0) + (historicalPby[historicalPby.length - 1]?.target_pby || 0)
                        },
                        { 
                            name: 'CFG', 
                            position: (historicalPby[0]?.cfg || 0) + (historicalPby[historicalPby.length - 1]?.target_cfg || 0)
                        },
                        { 
                            name: 'PWG', 
                            position: (historicalPby[0]?.pwg || 0) + (historicalPby[historicalPby.length - 1]?.target_pwg || 0)
                        },
                        { 
                            name: 'Griya', 
                            position: (historicalPby[0]?.griya || 0) + (historicalPby[historicalPby.length - 1]?.target_griya || 0)
                        },
                        { 
                            name: 'Oto', 
                            position: (historicalPby[0]?.oto || 0) + (historicalPby[historicalPby.length - 1]?.target_oto || 0)
                        },
                        { 
                            name: 'Mitraguna', 
                            position: (historicalPby[0]?.mitraguna || 0) + (historicalPby[historicalPby.length - 1]?.target_mitraguna || 0)
                        },
                        { 
                            name: 'Pensiun', 
                            position: (historicalPby[0]?.pensiun || 0) + (historicalPby[historicalPby.length - 1]?.target_pensiun || 0)
                        },
                        { 
                            name: 'Cicil Emas', 
                            position: (historicalPby[0]?.cicil_emas || 0) + (historicalPby[historicalPby.length - 1]?.target_cicil_emas || 0)
                        }
                    ] : [];

                    setPbyData({
                        historical: historicalPby,
                        targets: targetsPby
                    });
                }
                
                // Load KOL2 data
                const kol2Response = await authService.getKol2Data();
                if (kol2Response.success) {
                    const sortedKol2 = [...kol2Response.data].sort((a, b) => {
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

                    const historicalKol2 = sortedKol2.map(item => ({
                        period: item.period,
                        kol2: toNumber(item.kol2),
                        cfg: toNumber(item.cfg),
                        pwg: toNumber(item.pwg),
                        griya: toNumber(item.griya),
                        oto: toNumber(item.oto),
                        mitraguna: toNumber(item.mitraguna),
                        pensiun: toNumber(item.pensiun),
                        cicil_emas: toNumber(item.cicil_emas)
                    }));

                    setKol2Data({ historical: historicalKol2 });
                }
                
                // Load NPF data
                const npfResponse = await authService.getNPFData();
                if (npfResponse.success) {
                    const sortedNpf = [...npfResponse.data].sort((a, b) => {
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

                    const historicalNpf = sortedNpf.map(item => ({
                        period: item.period,
                        npf: toNumber(item.npf),
                        cfg: toNumber(item.cfg),
                        pwg: toNumber(item.pwg),
                        griya: toNumber(item.griya),
                        oto: toNumber(item.oto),
                        mitraguna: toNumber(item.mitraguna),
                        pensiun: toNumber(item.pensiun),
                        cicil_emas: toNumber(item.cicil_emas)
                    }));

                    setNpfData({ historical: historicalNpf });
                }
                
            } catch (error) {
                console.error('Failed to load summary data:', error);
                setError('Gagal memuat data summary');
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, []);

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
            case 'DPK': return <Banknote className="w-5 h-5" />;
            case 'PBY': return <TrendingUp className="w-5 h-5" />;
            case 'Kol. 2': return <LineChart className="w-5 h-5" />;
            case 'NPF': return <AlertTriangle className="w-5 h-5" />;
            case 'CFG': return <BarChart3 className="w-5 h-5" />;
            case 'PWG': return <Gem className="w-5 h-5" />;
            case 'Griya': return <Home className="w-5 h-5" />;
            case 'Oto': return <Car className="w-5 h-5" />;
            case 'Mitraguna': return <Briefcase className="w-5 h-5" />;
            case 'Pensiun': return <Users className="w-5 h-5" />;
            case 'Cicil Emas': return <Gem className="w-5 h-5" />;
            case 'CASA': return <Wallet className="w-5 h-5" />;
            case 'Tabungan': return <Coins className="w-5 h-5" />;
            case 'Giro': return <CreditCard className="w-5 h-5" />;
            case 'Deposito': return <Landmark className="w-5 h-5" />;
            default: return <DollarSign className="w-5 h-5" />;
        }
    };

    // Get color for each segment
    const getSegmentColor = (segmentName) => {
        switch(segmentName) {
            case 'DPK': return 'from-blue-500 to-blue-600';
            case 'PBY': return 'from-blue-500 to-blue-600';
            case 'Kol. 2': return 'from-purple-500 to-purple-600';
            case 'NPF': return 'from-red-500 to-red-600';
            case 'CFG': return 'from-emerald-500 to-emerald-600';
            case 'PWG': return 'from-pink-500 to-pink-600';
            case 'Griya': return 'from-blue-500 to-blue-600';
            case 'Oto': return 'from-green-500 to-green-600';
            case 'Mitraguna': return 'from-purple-500 to-purple-600';
            case 'Pensiun': return 'from-amber-500 to-amber-600';
            case 'Cicil Emas': return 'from-pink-500 to-pink-600';
            case 'CASA': return 'from-emerald-500 to-emerald-600';
            case 'Tabungan': return 'from-violet-500 to-violet-600';
            case 'Giro': return 'from-amber-500 to-amber-600';
            case 'Deposito': return 'from-rose-500 to-rose-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    // Get latest data
    const getLatestData = (data) => {
        if (!data || data.historical.length === 0) return null;
        return data.historical[data.historical.length - 1];
    };

    // Get previous period data for MTD calculation
    const getPreviousPeriodData = (data) => {
        if (!data || data.historical.length < 2) return null;
        return data.historical[data.historical.length - 2];
    };

    // Calculate MTD growth (selisih nominal)
    const calculateMTD = (currentValue, previousValue) => {
        if (previousValue === null || previousValue === undefined) return 0;
        return currentValue - previousValue;
    };

    // Calculate YTD growth (selisih nominal dari awal)
    const calculateYTD = (currentValue, oldestValue) => {
        if (oldestValue === null || oldestValue === undefined) return 0;
        return currentValue - oldestValue;
    };

    // ========== PERBAIKAN: Achievement = Latest / Position × 100% ==========
    const calculateAchievement = (latest, position) => {
        if (position === 0) return '0.00%';
        const achievement = (latest / position) * 100;
        return `${achievement.toFixed(2)}%`;
    };

    // Get DPK performance cards (5 cards)
    const getDPKPerformanceCards = () => {
        const latestData = getLatestData(dpkData);
        const previousData = getPreviousPeriodData(dpkData);
        const oldestData = dpkData.historical.length > 0 ? dpkData.historical[0] : null;
        
        if (!latestData) return [];

        return [
            {
                name: 'DPK',
                value: formatForPerformanceCard(latestData.dpk),
                mtd: formatForPerformanceCard(calculateMTD(latestData.dpk, previousData?.dpk || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.dpk, oldestData?.dpk || 0)),
                mtdTrend: (latestData.dpk - (previousData?.dpk || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.dpk - (oldestData?.dpk || 0)) >= 0 ? 'up' : 'down',
                // ========== PERBAIKAN: Parameter order dan rumus ==========
                achievement: calculateAchievement(
                    latestData.dpk, // Parameter 1: latest/actual
                    dpkData.targets.find(t => t.name === 'DPK')?.position || 0 // Parameter 2: position
                ),
                icon: getSegmentIcon('DPK'),
                color: getSegmentColor('DPK'),
                type: 'dpk'
            },
            {
                name: 'CASA',
                value: formatForPerformanceCard(latestData.casa),
                mtd: formatForPerformanceCard(calculateMTD(latestData.casa, previousData?.casa || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.casa, oldestData?.casa || 0)),
                mtdTrend: (latestData.casa - (previousData?.casa || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.casa - (oldestData?.casa || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.casa,
                    dpkData.targets.find(t => t.name === 'CASA')?.position || 0
                ),
                icon: getSegmentIcon('CASA'),
                color: getSegmentColor('CASA'),
                type: 'dpk'
            },
            {
                name: 'Tabungan',
                value: formatForPerformanceCard(latestData.tabungan),
                mtd: formatForPerformanceCard(calculateMTD(latestData.tabungan, previousData?.tabungan || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.tabungan, oldestData?.tabungan || 0)),
                mtdTrend: (latestData.tabungan - (previousData?.tabungan || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.tabungan - (oldestData?.tabungan || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.tabungan,
                    dpkData.targets.find(t => t.name === 'Tabungan')?.position || 0
                ),
                icon: getSegmentIcon('Tabungan'),
                color: getSegmentColor('Tabungan'),
                type: 'dpk'
            },
            {
                name: 'Giro',
                value: formatForPerformanceCard(latestData.giro),
                mtd: formatForPerformanceCard(calculateMTD(latestData.giro, previousData?.giro || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.giro, oldestData?.giro || 0)),
                mtdTrend: (latestData.giro - (previousData?.giro || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.giro - (oldestData?.giro || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.giro,
                    dpkData.targets.find(t => t.name === 'Giro')?.position || 0
                ),
                icon: getSegmentIcon('Giro'),
                color: getSegmentColor('Giro'),
                type: 'dpk'
            },
            {
                name: 'Deposito',
                value: formatForPerformanceCard(latestData.deposito),
                mtd: formatForPerformanceCard(calculateMTD(latestData.deposito, previousData?.deposito || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.deposito, oldestData?.deposito || 0)),
                mtdTrend: (latestData.deposito - (previousData?.deposito || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.deposito - (oldestData?.deposito || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.deposito,
                    dpkData.targets.find(t => t.name === 'Deposito')?.position || 0
                ),
                icon: getSegmentIcon('Deposito'),
                color: getSegmentColor('Deposito'),
                type: 'dpk'
            }
        ];
    };

    // Get PBY performance cards (8 cards)
    const getPBYPerformanceCards = () => {
        const latestData = getLatestData(pbyData);
        const previousData = getPreviousPeriodData(pbyData);
        const oldestData = pbyData.historical.length > 0 ? pbyData.historical[0] : null;
        
        if (!latestData) return [];

        return [
            {
                name: 'PBY',
                value: formatForPerformanceCard(latestData.pby),
                mtd: formatForPerformanceCard(calculateMTD(latestData.pby, previousData?.pby || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.pby, oldestData?.pby || 0)),
                mtdTrend: (latestData.pby - (previousData?.pby || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.pby - (oldestData?.pby || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.pby,
                    pbyData.targets.find(t => t.name === 'PBY')?.position || 0
                ),
                icon: getSegmentIcon('PBY'),
                color: getSegmentColor('PBY'),
                type: 'pby'
            },
            {
                name: 'CFG',
                value: formatForPerformanceCard(latestData.cfg),
                mtd: formatForPerformanceCard(calculateMTD(latestData.cfg, previousData?.cfg || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.cfg, oldestData?.cfg || 0)),
                mtdTrend: (latestData.cfg - (previousData?.cfg || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.cfg - (oldestData?.cfg || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.cfg,
                    pbyData.targets.find(t => t.name === 'CFG')?.position || 0
                ),
                icon: getSegmentIcon('CFG'),
                color: getSegmentColor('CFG'),
                type: 'pby'
            },
            {
                name: 'Griya',
                value: formatForPerformanceCard(latestData.griya),
                mtd: formatForPerformanceCard(calculateMTD(latestData.griya, previousData?.griya || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.griya, oldestData?.griya || 0)),
                mtdTrend: (latestData.griya - (previousData?.griya || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.griya - (oldestData?.griya || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.griya,
                    pbyData.targets.find(t => t.name === 'Griya')?.position || 0
                ),
                icon: getSegmentIcon('Griya'),
                color: getSegmentColor('Griya'),
                type: 'pby'
            },
            {
                name: 'Oto',
                value: formatForPerformanceCard(latestData.oto),
                mtd: formatForPerformanceCard(calculateMTD(latestData.oto, previousData?.oto || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.oto, oldestData?.oto || 0)),
                mtdTrend: (latestData.oto - (previousData?.oto || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.oto - (oldestData?.oto || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.oto,
                    pbyData.targets.find(t => t.name === 'Oto')?.position || 0
                ),
                icon: getSegmentIcon('Oto'),
                color: getSegmentColor('Oto'),
                type: 'pby'
            },
            {
                name: 'Mitraguna',
                value: formatForPerformanceCard(latestData.mitraguna),
                mtd: formatForPerformanceCard(calculateMTD(latestData.mitraguna, previousData?.mitraguna || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.mitraguna, oldestData?.mitraguna || 0)),
                mtdTrend: (latestData.mitraguna - (previousData?.mitraguna || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.mitraguna - (oldestData?.mitraguna || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.mitraguna,
                    pbyData.targets.find(t => t.name === 'Mitraguna')?.position || 0
                ),
                icon: getSegmentIcon('Mitraguna'),
                color: getSegmentColor('Mitraguna'),
                type: 'pby'
            },
            {
                name: 'Pensiun',
                value: formatForPerformanceCard(latestData.pensiun),
                mtd: formatForPerformanceCard(calculateMTD(latestData.pensiun, previousData?.pensiun || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.pensiun, oldestData?.pensiun || 0)),
                mtdTrend: (latestData.pensiun - (previousData?.pensiun || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.pensiun - (oldestData?.pensiun || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.pensiun,
                    pbyData.targets.find(t => t.name === 'Pensiun')?.position || 0
                ),
                icon: getSegmentIcon('Pensiun'),
                color: getSegmentColor('Pensiun'),
                type: 'pby'
            },
            {
                name: 'PWG',
                value: formatForPerformanceCard(latestData.pwg),
                mtd: formatForPerformanceCard(calculateMTD(latestData.pwg, previousData?.pwg || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.pwg, oldestData?.pwg || 0)),
                mtdTrend: (latestData.pwg - (previousData?.pwg || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.pwg - (oldestData?.pwg || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.pwg,
                    pbyData.targets.find(t => t.name === 'PWG')?.position || 0
                ),
                icon: getSegmentIcon('PWG'),
                color: getSegmentColor('PWG'),
                type: 'pby'
            },
            {
                name: 'Cicil Emas',
                value: formatForPerformanceCard(latestData.cicil_emas),
                mtd: formatForPerformanceCard(calculateMTD(latestData.cicil_emas, previousData?.cicil_emas || 0)),
                ytd: formatForPerformanceCard(calculateYTD(latestData.cicil_emas, oldestData?.cicil_emas || 0)),
                mtdTrend: (latestData.cicil_emas - (previousData?.cicil_emas || 0)) >= 0 ? 'up' : 'down',
                ytdTrend: (latestData.cicil_emas - (oldestData?.cicil_emas || 0)) >= 0 ? 'up' : 'down',
                achievement: calculateAchievement(
                    latestData.cicil_emas,
                    pbyData.targets.find(t => t.name === 'Cicil Emas')?.position || 0
                ),
                icon: getSegmentIcon('Cicil Emas'),
                color: getSegmentColor('Cicil Emas'),
                type: 'pby'
            }
        ];
    };

    // Get Kol.2 performance card (1 card)
    const getKOL2PerformanceCard = () => {
        const latestData = getLatestData(kol2Data);
        const previousData = getPreviousPeriodData(kol2Data);
        const oldestData = kol2Data.historical.length > 0 ? kol2Data.historical[0] : null;
        
        if (!latestData) return null;

        return {
            name: 'Kol. 2',
            value: formatForPerformanceCard(latestData.kol2),
            mtd: formatForPerformanceCard(calculateMTD(latestData.kol2, previousData?.kol2 || 0)),
            ytd: formatForPerformanceCard(calculateYTD(latestData.kol2, oldestData?.kol2 || 0)),
            mtdTrend: (latestData.kol2 - (previousData?.kol2 || 0)) >= 0 ? 'up' : 'down',
            ytdTrend: (latestData.kol2 - (oldestData?.kol2 || 0)) >= 0 ? 'up' : 'down',
            achievement: '-',
            icon: getSegmentIcon('Kol. 2'),
            color: getSegmentColor('Kol. 2'),
            type: 'kol2'
        };
    };

    // Get NPF performance card (1 card)
    const getNPFPerformanceCard = () => {
        const latestData = getLatestData(npfData);
        const previousData = getPreviousPeriodData(npfData);
        const oldestData = npfData.historical.length > 0 ? npfData.historical[0] : null;
        
        if (!latestData) return null;

        return {
            name: 'NPF',
            value: formatForPerformanceCard(latestData.npf),
            mtd: formatForPerformanceCard(calculateMTD(latestData.npf, previousData?.npf || 0)),
            ytd: formatForPerformanceCard(calculateYTD(latestData.npf, oldestData?.npf || 0)),
            mtdTrend: (latestData.npf - (previousData?.npf || 0)) >= 0 ? 'up' : 'down',
            ytdTrend: (latestData.npf - (oldestData?.npf || 0)) >= 0 ? 'up' : 'down',
            achievement: '-',
            icon: getSegmentIcon('NPF'),
            color: getSegmentColor('NPF'),
            type: 'npf'
        };
    };

    const dpkCards = getDPKPerformanceCards();
    const pbyCards = getPBYPerformanceCards();
    const kol2Card = getKOL2PerformanceCard();
    const npfCard = getNPFPerformanceCard();

    // Combine all cards in correct order
    const allPerformanceCards = [
        ...dpkCards,
        ...pbyCards,
        ...(kol2Card ? [kol2Card] : []),
        ...(npfCard ? [npfCard] : [])
    ];

    // Get pie chart data
    const getPieChartData = () => {
        const latestDpk = getLatestData(dpkData);
        const latestPby = getLatestData(pbyData);
        const latestKol2 = getLatestData(kol2Data);
        const latestNpf = getLatestData(npfData);

        return [
            {
                title: 'Komposisi DPK',
                color: 'from-green-500 to-green-600',
                iconColor: 'text-green-500',
                data: latestDpk,
                segments: latestDpk ? [
                    { name: 'Tabungan', value: latestDpk.tabungan || 0, color: '#8b5cf6' },
                    { name: 'Giro', value: latestDpk.giro || 0, color: '#f59e0b' },
                    { name: 'Deposito', value: latestDpk.deposito || 0, color: '#f43f5e' }
                ] : [],
                totalValue: latestDpk?.dpk || 0,
                formatValue: (val) => formatForPerformanceCard(val)
            },
            {
                title: 'Komposisi PBY',
                color: 'from-blue-500 to-blue-600',
                iconColor: 'text-blue-500',
                data: latestPby,
                segments: latestPby ? [
                    { name: 'Griya', value: latestPby.griya || 0, color: '#3b82f6' },
                    { name: 'Oto', value: latestPby.oto || 0, color: '#10b981' },
                    { name: 'Mitraguna', value: latestPby.mitraguna || 0, color: '#8b5cf6' },
                    { name: 'Pensiun', value: latestPby.pensiun || 0, color: '#f59e0b' },
                    { name: 'Cicil Emas', value: latestPby.cicil_emas || 0, color: '#ec4899' }
                ] : [],
                totalValue: latestPby?.pby || 0,
                formatValue: (val) => formatForPerformanceCard(val)
            },
            {
                title: 'Komposisi Kol. 2',
                color: 'from-purple-500 to-purple-600',
                iconColor: 'text-purple-500',
                data: latestKol2,
                segments: latestKol2 ? [
                    { name: 'Griya', value: latestKol2.griya || 0, color: '#3b82f6' },
                    { name: 'Oto', value: latestKol2.oto || 0, color: '#10b981' },
                    { name: 'Mitraguna', value: latestKol2.mitraguna || 0, color: '#8b5cf6' },
                    { name: 'Pensiun', value: latestKol2.pensiun || 0, color: '#f59e0b' },
                    { name: 'Cicil Emas', value: latestKol2.cicil_emas || 0, color: '#ec4899' }
                ] : [],
                totalValue: latestKol2?.kol2 || 0,
                formatValue: (val) => formatForPerformanceCard(val)
            },
            {
                title: 'Komposisi NPF',
                color: 'from-red-500 to-red-600',
                iconColor: 'text-red-500',
                data: latestNpf,
                segments: latestNpf ? [
                    { name: 'Griya', value: latestNpf.griya || 0, color: '#3b82f6' },
                    { name: 'Oto', value: latestNpf.oto || 0, color: '#10b981' },
                    { name: 'Mitraguna', value: latestNpf.mitraguna || 0, color: '#8b5cf6' },
                    { name: 'Pensiun', value: latestNpf.pensiun || 0, color: '#f59e0b' },
                    { name: 'Cicil Emas', value: latestNpf.cicil_emas || 0, color: '#ec4899' }
                ] : [],
                totalValue: latestNpf?.npf || 0,
                formatValue: (val) => formatForPerformanceCard(val)
            }
        ];
    };

    const pieChartsData = getPieChartData();

    return (
        <>

            {/* All Performance Cards (15 cards total) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-emerald-500" />
                    Ringkasan Kinerja Terkini
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {allPerformanceCards.map((item, index) => (
                        <div 
                            key={index} 
                            className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                        >
                            <div className={`h-2 bg-gradient-to-r ${item.color}`}></div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-lg bg-gray-100 mr-2">
                                            <div className={item.type === 'npf' ? 'text-red-500' : 'text-emerald-500'}>
                                                {item.icon}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                                    </div>
                                    {item.achievement !== '-' && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            getAchievementColor(item.achievement)
                                        }`}>
                                            {item.achievement}
                                        </span>
                                    )}
                                </div>
                                
                                <p className="text-2xl font-bold text-gray-900 mb-3">{item.value}</p>
                                
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">MTD:</span>
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-900">{item.mtd}</span>
                                            <span className={`ml-1 ${getTrendColor(item.mtdTrend === 'up' ? 1 : -1)}`}>
                                                {getTrendIcon(item.mtdTrend === 'up' ? 1 : -1)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">YTD:</span>
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-900">{item.ytd}</span>
                                            <span className={`ml-1 ${getTrendColor(item.ytdTrend === 'up' ? 1 : -1)}`}>
                                                {getTrendIcon(item.ytdTrend === 'up' ? 1 : -1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* All Pie Charts (4 pie charts) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
            >
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <PieChart className="w-6 h-6 mr-3 text-emerald-500" />
                    Ringkasan Komposisi Terkini
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pieChartsData.map((chart, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100">
                            <div className={`h-2 bg-gradient-to-r ${chart.color}`}></div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <PieChart className={`w-5 h-5 mr-2 ${chart.iconColor}`} />
                                    {chart.title}
                                </h3>
                                
                                <div className="flex flex-col items-center">
                                    <div className="relative w-24 h-24 mb-4">
                                        {chart.data && chart.totalValue > 0 ? (
                                            <>
                                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                                    {(() => {
                                                        let accumulatedOffset = 0;
                                                        return chart.segments.map((seg, idx) => {
                                                            const percent = chart.totalValue > 0 ? (seg.value / chart.totalValue) * 100 : 0;
                                                            const strokeLength = (percent / 100) * 251.2;
                                                            const segment = (
                                                                <circle
                                                                    key={idx}
                                                                    cx="50"
                                                                    cy="50"
                                                                    r="40"
                                                                    fill="transparent"
                                                                    stroke={seg.color}
                                                                    strokeWidth="20"
                                                                    strokeDasharray={`${strokeLength} 251.2`}
                                                                    strokeDashoffset={`${-accumulatedOffset}`}
                                                                    transform="rotate(-90 50 50)"
                                                                />
                                                            );
                                                            accumulatedOffset += strokeLength;
                                                            return segment;
                                                        });
                                                    })()}
                                                    <circle cx="50" cy="50" r="30" fill="white" />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {chart.formatValue(chart.totalValue)}
                                                        </p>
                                                        <p className="text-xs text-gray-600">Total</p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-gray-900">0</p>
                                                    <p className="text-xs text-gray-600">Total</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Legend */}
                                    <div className="w-full">
                                        <div className="space-y-2">
                                            {chart.segments.map((seg, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center">
                                                        <div 
                                                            className="w-2 h-2 rounded-full mr-2" 
                                                            style={{ backgroundColor: seg.color }}
                                                        ></div>
                                                        <span className="text-xs text-gray-700">{seg.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-medium text-gray-900">
                                                            {chart.formatValue(seg.value)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {chart.totalValue > 0 
                                                                ? `${((seg.value / chart.totalValue) * 100).toFixed(1)}%`
                                                                : '0.0%'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-gray-100 w-full">
                                        <p className="text-xs text-gray-500 text-center">
                                            Data periode terkini
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Error Display */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 mt-8"
                >
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-1 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
};

export default DashboardSummary;