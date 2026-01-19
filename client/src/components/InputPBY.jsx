import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  RefreshCw, 
  Calendar,
  DollarSign,
  TrendingUp,
  Home,
  Car,
  Briefcase,
  Users,
  Gem,
  TrendingDown,
  Droplet,
  AlertCircle,
  Info,
  Target,
  Trash2,
  Edit
} from 'lucide-react';
import authService from '../services/auth';

const InputPBY = ({ onError }) => {
  // State untuk periode custom dengan TAHUN
  const [customDate, setCustomDate] = useState({
    day: '01',
    month: '01',
    year: '2026'
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('custom');
  
  // Data dari backend
  const [allPeriodsData, setAllPeriodsData] = useState({});
  
  // Data input saat ini - untuk PBY
  const [currentData, setCurrentData] = useState({
    // Segment Griya
    Griya: '',
    Griya_Cair: '',
    Griya_RunOff: '',
    
    // Segment Oto
    Oto: '',
    Oto_Cair: '',
    Oto_RunOff: '',
    
    // Segment Mitraguna
    Mitraguna: '',
    Mitraguna_Cair: '',
    Mitraguna_RunOff: '',
    
    // Segment Pensiun
    Pensiun: '',
    Pensiun_Cair: '',
    Pensiun_RunOff: '',
    
    // Segment Cicil Emas (PWG)
    CicilEmas: '',
    CicilEmas_Cair: '',
    CicilEmas_RunOff: ''
  });
  
  // Growth targets untuk periode saat ini - untuk PBY
  const [currentGrowthTargets, setCurrentGrowthTargets] = useState({
    Griya: '',
    Oto: '',
    Mitraguna: '',
    Pensiun: '',
    CicilEmas: ''
  });
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [periodsList, setPeriodsList] = useState([]);
  const [activeTab, setActiveTab] = useState('input');

  // Load data saat komponen mount
  useEffect(() => {
    loadAllPBYData();
  }, []);

  // Update current data berdasarkan periode yang dipilih
  useEffect(() => {
    if (selectedPeriod === 'custom') {
      resetForm();
    } else {
      loadPeriodData(selectedPeriod);
    }
  }, [selectedPeriod]);

  // Reset form
  const resetForm = () => {
    setCurrentData({
      Griya: '',
      Griya_Cair: '',
      Griya_RunOff: '',
      Oto: '',
      Oto_Cair: '',
      Oto_RunOff: '',
      Mitraguna: '',
      Mitraguna_Cair: '',
      Mitraguna_RunOff: '',
      Pensiun: '',
      Pensiun_Cair: '',
      Pensiun_RunOff: '',
      CicilEmas: '',
      CicilEmas_Cair: '',
      CicilEmas_RunOff: ''
    });
    setCurrentGrowthTargets({
      Griya: '',
      Oto: '',
      Mitraguna: '',
      Pensiun: '',
      CicilEmas: ''
    });
    setNotes('');
    setCustomDate({
      day: '01',
      month: '01',
      year: new Date().getFullYear().toString()
    });
  };

  // Helper untuk parse periode dari string (misal: "31-Dec-2024")
  const parsePeriodString = (periodStr) => {
    const parts = periodStr.split('-');
    if (parts.length === 3) {
      return {
        day: parts[0],
        month: parts[1],
        year: parts[2]
      };
    }
    return {
      day: '01',
      month: periodStr.slice(3, 6) || 'Jan',
      year: periodStr.slice(7) || '2024'
    };
  };

  // Helper untuk format periode ke string (misal: "31-Dec-2024")
  const formatPeriodString = (day, month, year) => {
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNum = parseInt(month, 10);
    const monthName = monthsShort[monthNum - 1] || 'Jan';
    return `${day}-${monthName}-${year}`;
  };

  // Fungsi untuk mengurutkan periode dari terlama ke terbaru
  const sortPeriods = (periods) => {
    return periods.sort((a, b) => {
      const dateA = parsePeriodString(a);
      const dateB = parsePeriodString(b);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndexA = months.indexOf(dateA.month);
      const monthIndexB = months.indexOf(dateB.month);
      
      const dateObjA = new Date(parseInt(dateA.year), monthIndexA, parseInt(dateA.day));
      const dateObjB = new Date(parseInt(dateB.year), monthIndexB, parseInt(dateB.day));
      
      return dateObjA - dateObjB;
    });
  };

  const loadAllPBYData = async () => {
    try {
      console.log('Loading PBY data...');
      const response = await authService.getPBYData();
      console.log('PBY data response:', response);
      
      if (response.success && response.data) {
        const formattedData = {};
        const periods = [];
        
        // Handle jika response.data adalah array
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        
        dataArray.forEach(item => {
          if (!item || !item.period) return;
          
          formattedData[item.period] = {
            // Data aktual
            Griya: item.griya?.toString() || '',
            Griya_Cair: item.griya_cair?.toString() || '',
            Griya_RunOff: item.griya_runoff?.toString() || '',
            
            Oto: item.oto?.toString() || '',
            Oto_Cair: item.oto_cair?.toString() || '',
            Oto_RunOff: item.oto_runoff?.toString() || '',
            
            Mitraguna: item.mitraguna?.toString() || '',
            Mitraguna_Cair: item.mitraguna_cair?.toString() || '',
            Mitraguna_RunOff: item.mitraguna_runoff?.toString() || '',
            
            Pensiun: item.pensiun?.toString() || '',
            Pensiun_Cair: item.pensiun_cair?.toString() || '',
            Pensiun_RunOff: item.pensiun_runoff?.toString() || '',
            
            CicilEmas: item.cicil_emas?.toString() || '',
            CicilEmas_Cair: item.cicil_emas_cair?.toString() || '',
            CicilEmas_RunOff: item.cicil_emas_runoff?.toString() || '',
            
            // Auto calculated
            CFG: item.cfg?.toString() || '',
            PWG: item.pwg?.toString() || '',
            PBY: item.pby?.toString() || '',
            
            // Growth targets
            growthTargets: {
              Griya: item.target_griya ? item.target_griya.toString() : '',
              Oto: item.target_oto ? item.target_oto.toString() : '',
              Mitraguna: item.target_mitraguna ? item.target_mitraguna.toString() : '',
              Pensiun: item.target_pensiun ? item.target_pensiun.toString() : '',
              CicilEmas: item.target_cicil_emas ? item.target_cicil_emas.toString() : '',
              CFG: item.target_cfg ? item.target_cfg.toString() : '',
              PWG: item.target_pwg ? item.target_pwg.toString() : '',
              PBY: item.target_pby ? item.target_pby.toString() : ''
            },
            notes: item.notes || '',
            date: item.date || null
          };
          
          periods.push(item.period);
        });
        
        const sortedPeriods = sortPeriods(periods);
        setAllPeriodsData(formattedData);
        setPeriodsList(sortedPeriods);
        
        console.log('Formatted PBY data:', formattedData);
      } else {
        console.log('No PBY data found or empty response');
        setDebugInfo(response.error || 'Tidak ada data PBY');
      }
    } catch (error) {
      console.error('Error loading PBY data:', error);
      setDebugInfo(`Catch error: ${error.message}`);
      onError(`Gagal memuat data: ${error.message}`);
    }
  };

  const loadPeriodData = async (period) => {
    try {
      console.log(`Loading PBY period data for: ${period}`);
      const response = await authService.getPBYPeriodData(period);
      console.log('PBY Period data response:', response);
      
      if (response.success && response.data) {
        const data = response.data;
        setCurrentData({
          Griya: data.griya?.toString() || '',
          Griya_Cair: data.griya_cair?.toString() || '',
          Griya_RunOff: data.griya_runoff?.toString() || '',
          
          Oto: data.oto?.toString() || '',
          Oto_Cair: data.oto_cair?.toString() || '',
          Oto_RunOff: data.oto_runoff?.toString() || '',
          
          Mitraguna: data.mitraguna?.toString() || '',
          Mitraguna_Cair: data.mitraguna_cair?.toString() || '',
          Mitraguna_RunOff: data.mitraguna_runoff?.toString() || '',
          
          Pensiun: data.pensiun?.toString() || '',
          Pensiun_Cair: data.pensiun_cair?.toString() || '',
          Pensiun_RunOff: data.pensiun_runoff?.toString() || '',
          
          CicilEmas: data.cicil_emas?.toString() || '',
          CicilEmas_Cair: data.cicil_emas_cair?.toString() || '',
          CicilEmas_RunOff: data.cicil_emas_runoff?.toString() || ''
        });
        
        setCurrentGrowthTargets({
          Griya: data.target_griya ? data.target_griya.toString() : '',
          Oto: data.target_oto ? data.target_oto.toString() : '',
          Mitraguna: data.target_mitraguna ? data.target_mitraguna.toString() : '',
          Pensiun: data.target_pensiun ? data.target_pensiun.toString() : '',
          CicilEmas: data.target_cicil_emas ? data.target_cicil_emas.toString() : ''
        });
        
        setNotes(data.notes || '');
        
        const parsedDate = parsePeriodString(period);
        setCustomDate(parsedDate);
      } else {
        console.log('No PBY data found for period:', period);
        resetForm();
        
        const parsedDate = parsePeriodString(period);
        setCustomDate(parsedDate);
        
        onError(`Data untuk periode ${period} tidak ditemukan`);
      }
    } catch (error) {
      console.error('Error loading PBY period data:', error);
      setDebugInfo(`PBY Period data error: ${error.message}`);
      onError(`Gagal memuat data periode: ${error.message}`);
    }
  };

  const handleDeletePeriod = async (period) => {
    if (!window.confirm(`Yakin ingin menghapus data PBY untuk periode ${period}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Deleting PBY period: ${period}`);
      
      const response = await authService.deletePBYData(period);
      console.log('Delete PBY response:', response);
      
      if (response.success) {
        const updatedData = { ...allPeriodsData };
        delete updatedData[period];
        setAllPeriodsData(updatedData);
        
        const updatedPeriods = periodsList.filter(p => p !== period);
        setPeriodsList(updatedPeriods);
        
        if (selectedPeriod === period) {
          setSelectedPeriod('custom');
          resetForm();
        }
        
        setDebugInfo(`✅ Data PBY periode ${period} berhasil dihapus`);
        onError('');
      } else {
        onError(`❌ Gagal menghapus data PBY: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete PBY error:', error);
      onError('❌ Gagal menghapus data PBY. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value, isTarget = false) => {
    const cleanedValue = value.replace(/[^0-9.,]/g, '');
    
    if (isTarget) {
      setCurrentGrowthTargets(prev => ({
        ...prev,
        [field]: cleanedValue
      }));
    } else {
      setCurrentData(prev => ({
        ...prev,
        [field]: cleanedValue
      }));
    }
  };

  // ========== AUTO-CALCULATED FUNCTIONS untuk PBY ==========
  
  // Helper untuk parse angka
  const parseNumber = (value) => {
    if (!value && value !== '0') return 0;
    const cleaned = value.toString().replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // 1. CFG = Griya + Oto + Mitraguna + Pensiun (AUTO-CALCULATED)
  const calculateCFG = () => {
    const griya = parseNumber(currentData.Griya);
    const oto = parseNumber(currentData.Oto);
    const mitraguna = parseNumber(currentData.Mitraguna);
    const pensiun = parseNumber(currentData.Pensiun);
    return griya + oto + mitraguna + pensiun;
  };

  // 2. PWG = Cicil Emas (AUTO-CALCULATED)
  const calculatePWG = () => {
    return parseNumber(currentData.CicilEmas);
  };

  // 3. PBY = CFG + PWG (AUTO-CALCULATED)
  const calculatePBY = () => {
    return calculateCFG() + calculatePWG();
  };

  // 4. Target CFG = Target Griya + Target Oto + Target Mitraguna + Target Pensiun (AUTO-CALCULATED)
  const calculateTargetCFG = () => {
    const targetGriya = parseNumber(currentGrowthTargets.Griya);
    const targetOto = parseNumber(currentGrowthTargets.Oto);
    const targetMitraguna = parseNumber(currentGrowthTargets.Mitraguna);
    const targetPensiun = parseNumber(currentGrowthTargets.Pensiun);
    return targetGriya + targetOto + targetMitraguna + targetPensiun;
  };

  // 5. Target PWG = Target Cicil Emas (AUTO-CALCULATED)
  const calculateTargetPWG = () => {
    return parseNumber(currentGrowthTargets.CicilEmas);
  };

  // 6. Target PBY = Target CFG + Target PWG (AUTO-CALCULATED)
  const calculateTargetPBY = () => {
    return calculateTargetCFG() + calculateTargetPWG();
  };

  // 7. Cair Total = Σ Semua Cair (AUTO-CALCULATED)
  const calculateCairTotal = () => {
    const griyaCair = parseNumber(currentData.Griya_Cair);
    const otoCair = parseNumber(currentData.Oto_Cair);
    const mitragunaCair = parseNumber(currentData.Mitraguna_Cair);
    const pensiunCair = parseNumber(currentData.Pensiun_Cair);
    const cicilEmasCair = parseNumber(currentData.CicilEmas_Cair);
    return griyaCair + otoCair + mitragunaCair + pensiunCair + cicilEmasCair;
  };

  // 8. Run Off Total = Σ Semua Run Off (AUTO-CALCULATED)
  const calculateRunOffTotal = () => {
    const griyaRunOff = parseNumber(currentData.Griya_RunOff);
    const otoRunOff = parseNumber(currentData.Oto_RunOff);
    const mitragunaRunOff = parseNumber(currentData.Mitraguna_RunOff);
    const pensiunRunOff = parseNumber(currentData.Pensiun_RunOff);
    const cicilEmasRunOff = parseNumber(currentData.CicilEmas_RunOff);
    return griyaRunOff + otoRunOff + mitragunaRunOff + pensiunRunOff + cicilEmasRunOff;
  };

  const handleCustomDateChange = (field, value) => {
    setCustomDate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCustomPeriodLabel = () => {
    const months = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    };
    return formatPeriodString(customDate.day, customDate.month, customDate.year);
  };

  const validateCustomDate = () => {
    const day = parseInt(customDate.day);
    const month = parseInt(customDate.month);
    const year = parseInt(customDate.year);
    
    if (day < 1 || day > 31) {
      return 'Hari harus antara 1-31';
    }
    if (month < 1 || month > 12) {
      return 'Bulan harus antara 1-12';
    }
    if (year < 2000 || year > 2100) {
      return 'Tahun harus antara 2000-2100';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError('');
    setDebugInfo('');
    setLoading(true);

    if (selectedPeriod === 'custom') {
      const dateError = validateCustomDate();
      if (dateError) {
        onError(dateError);
        setLoading(false);
        return;
      }
    }

    // Validasi data aktual
    const requiredFields = ['Griya', 'Oto', 'Mitraguna', 'Pensiun', 'CicilEmas'];
    const isEmpty = requiredFields.some(field => !currentData[field] && currentData[field] !== '0');
    
    if (isEmpty) {
      onError('Harap isi semua field data aktual utama (Griya, Oto, Mitraguna, Pensiun, Cicil Emas)!');
      setLoading(false);
      return;
    }

    try {
      const periodKey = selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod;
      
      const parseNumber = (value) => {
        if (!value && value !== '0') return 0;
        const cleaned = value.toString().replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };

      const parseNullableNumber = (value) => {
        if (!value && value !== '0') return null;
        const cleaned = value.toString().replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      };

      // Data aktual
      const griyaValue = parseNumber(currentData.Griya);
      const griyaCairValue = parseNumber(currentData.Griya_Cair);
      const griyaRunOffValue = parseNumber(currentData.Griya_RunOff);
      
      const otoValue = parseNumber(currentData.Oto);
      const otoCairValue = parseNumber(currentData.Oto_Cair);
      const otoRunOffValue = parseNumber(currentData.Oto_RunOff);
      
      const mitragunaValue = parseNumber(currentData.Mitraguna);
      const mitragunaCairValue = parseNumber(currentData.Mitraguna_Cair);
      const mitragunaRunOffValue = parseNumber(currentData.Mitraguna_RunOff);
      
      const pensiunValue = parseNumber(currentData.Pensiun);
      const pensiunCairValue = parseNumber(currentData.Pensiun_Cair);
      const pensiunRunOffValue = parseNumber(currentData.Pensiun_RunOff);
      
      const cicilEmasValue = parseNumber(currentData.CicilEmas);
      const cicilEmasCairValue = parseNumber(currentData.CicilEmas_Cair);
      const cicilEmasRunOffValue = parseNumber(currentData.CicilEmas_RunOff);
      
      // AUTO-CALCULATED
      const cfgValue = griyaValue + otoValue + mitragunaValue + pensiunValue;
      const pwgValue = cicilEmasValue;
      const pbyValue = cfgValue + pwgValue;

      // Data target
      const targetGriyaValue = parseNullableNumber(currentGrowthTargets.Griya);
      const targetOtoValue = parseNullableNumber(currentGrowthTargets.Oto);
      const targetMitragunaValue = parseNullableNumber(currentGrowthTargets.Mitraguna);
      const targetPensiunValue = parseNullableNumber(currentGrowthTargets.Pensiun);
      const targetCicilEmasValue = parseNullableNumber(currentGrowthTargets.CicilEmas);
      
      // AUTO-CALCULATED TARGET
      const targetCFGValue = targetGriyaValue + targetOtoValue + targetMitragunaValue + targetPensiunValue;
      const targetPWGValue = targetCicilEmasValue;
      const targetPBYValue = targetCFGValue + targetPWGValue;

      let formattedDate = null;
      if (selectedPeriod === 'custom') {
        formattedDate = `${customDate.year}-${customDate.month}-${customDate.day}`;
      }

      const dataToSave = {
        period: periodKey,
        date: formattedDate,
        
        // Data aktual
        griya: griyaValue,
        griya_cair: griyaCairValue,
        griya_runoff: griyaRunOffValue,
        
        oto: otoValue,
        oto_cair: otoCairValue,
        oto_runoff: otoRunOffValue,
        
        mitraguna: mitragunaValue,
        mitraguna_cair: mitragunaCairValue,
        mitraguna_runoff: mitragunaRunOffValue,
        
        pensiun: pensiunValue,
        pensiun_cair: pensiunCairValue,
        pensiun_runoff: pensiunRunOffValue,
        
        cicil_emas: cicilEmasValue,
        cicil_emas_cair: cicilEmasCairValue,
        cicil_emas_runoff: cicilEmasRunOffValue,
        
        // Auto calculated
        cfg: cfgValue,
        pwg: pwgValue,
        pby: pbyValue,
        
        // Growth targets
        target_griya: targetGriyaValue,
        target_oto: targetOtoValue,
        target_mitraguna: targetMitragunaValue,
        target_pensiun: targetPensiunValue,
        target_cicil_emas: targetCicilEmasValue,
        target_cfg: targetCFGValue,
        target_pwg: targetPWGValue,
        target_pby: targetPBYValue,
        
        notes: notes || null
      };

      console.log('=== PBY DATA TO SAVE ===', dataToSave);

      const response = await authService.savePBYData(dataToSave);
      
      if (response.success) {
        console.log('✅ Data PBY berhasil disimpan');
        setDebugInfo(`✅ Data PBY untuk periode ${periodKey} berhasil disimpan!`);
        
        // Update local state
        if (selectedPeriod === 'custom' && !periodsList.includes(periodKey)) {
          const newPeriodsList = sortPeriods([...periodsList, periodKey]);
          setPeriodsList(newPeriodsList);
        }
        
        // Update allPeriodsData
        const updatedData = { ...allPeriodsData };
        updatedData[periodKey] = {
          ...currentData,
          CFG: cfgValue.toString(),
          PWG: pwgValue.toString(),
          PBY: pbyValue.toString(),
          growthTargets: {
            Griya: currentGrowthTargets.Griya,
            Oto: currentGrowthTargets.Oto,
            Mitraguna: currentGrowthTargets.Mitraguna,
            Pensiun: currentGrowthTargets.Pensiun,
            CicilEmas: currentGrowthTargets.CicilEmas,
            CFG: targetCFGValue?.toString() || '',
            PWG: targetPWGValue?.toString() || '',
            PBY: targetPBYValue?.toString() || ''
          },
          notes: notes,
          date: formattedDate
        };
        setAllPeriodsData(updatedData);
        
        setSelectedPeriod(periodKey);
        
        // Redirect setelah 2 detik
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        console.error('❌ Save PBY failed:', response);
        const errorMsg = response.error || response.message || 'Gagal menyimpan data PBY';
        onError(`❌ Error: ${errorMsg}`);
        setDebugInfo(`❌ Server error: ${JSON.stringify(response, null, 2)}`);
      }

    } catch (err) {
      console.error('❌ Catch error:', err);
      let errorMsg = 'Gagal menyimpan data PBY. Silakan coba lagi.';
      
      if (err.response) {
        errorMsg = `Server error: ${err.response.status}`;
        if (err.response.data) {
          errorMsg += ` - ${JSON.stringify(err.response.data)}`;
        }
      } else if (err.request) {
        errorMsg = 'Tidak ada response dari server. Periksa koneksi backend.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      onError(`❌ ${errorMsg}`);
      setDebugInfo(`❌ Error details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetForm();
    onError('');
    setDebugInfo('');
  };

  // Format untuk display
  const formatDisplayNumber = (value) => {
    if (!value && value !== 0) return '0';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getPlaceholderValue = (field) => {
    const examples = {
      'Griya': '85000',
      'Oto': '65000',
      'Mitraguna': '45000',
      'Pensiun': '25000',
      'CicilEmas': '15000',
      'Griya_Cair': '5000',
      'Oto_Cair': '3000',
      'Mitraguna_Cair': '2000',
      'Pensiun_Cair': '1000',
      'CicilEmas_Cair': '500'
    };
    return examples[field] || '0';
  };

  const renderInputTab = () => {
    const segments = [
      {
        field: 'Griya',
        label: 'Griya',
        icon: <Home className="w-5 h-5" />,
        subFields: [
          { field: 'Griya', label: 'Griya (Rp. Juta)' },
        ]
      },
      {
        field: 'Oto',
        label: 'Oto',
        icon: <Car className="w-5 h-5" />,
        subFields: [
          { field: 'Oto', label: 'Oto (Rp. Juta)' },
        ]
      },
      {
        field: 'Mitraguna',
        label: 'Mitraguna',
        icon: <Briefcase className="w-5 h-5" />,
        subFields: [
          { field: 'Mitraguna', label: 'Mitraguna (Rp. Juta)' },
        ]
      },
      {
        field: 'Pensiun',
        label: 'Pensiun',
        icon: <Users className="w-5 h-5" />,
        subFields: [
          { field: 'Pensiun', label: 'Pensiun (Rp. Juta)' },
        ]
      },
      {
        field: 'CicilEmas',
        label: 'Cicil Emas (PWG)',
        icon: <Gem className="w-5 h-5" />,
        subFields: [
          { field: 'CicilEmas', label: 'Cicil Emas (Rp. Juta)' },
        ]
      }
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Input Data Aktual PBY untuk Periode: {selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod}
        </h3>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Cara Input:</p>
              <p className="text-xs text-emerald-700 mt-1">
                Masukkan angka tanpa titik/koma. Contoh: 350000 (untuk Rp 350 Juta)
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                <strong>Note:</strong> Data Cair dan Run Off dimasukkan di tab Growth Target
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment, index) => (
            <div key={segment.field} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg mr-3 ${
                  index === 0 ? 'bg-blue-50' :
                  index === 1 ? 'bg-green-50' :
                  index === 2 ? 'bg-purple-50' :
                  index === 3 ? 'bg-amber-50' :
                  'bg-pink-50'
                }`}>
                  <div className={`${
                    index === 0 ? 'text-blue-600' :
                    index === 1 ? 'text-green-600' :
                    index === 2 ? 'text-purple-600' :
                    index === 3 ? 'text-amber-600' :
                    'text-pink-600'
                  }`}>
                    {segment.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{segment.label}</h4>
                  <p className="text-xs text-gray-500">Segment Pembiayaan</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {segment.subFields.map((subField) => (
                  <div key={subField.field} className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">
                      {subField.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={currentData[subField.field] || ''}
                        onChange={(e) => handleInputChange(subField.field, e.target.value)}
                        placeholder={`Contoh: ${getPlaceholderValue(subField.field)}`}
                        className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AUTO-CALCULATED RESULTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* CFG */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              <span className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                CFG (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateCFG())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-blue-300 rounded-lg text-blue-700 font-medium"
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              CFG = Σ(Griya, Oto, Mitraguna, Pensiun)
            </p>
          </div>

          {/* PWG */}
          <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
            <label className="block text-sm font-medium text-pink-800 mb-2">
              <span className="flex items-center">
                <Gem className="w-5 h-5 mr-2" />
                PWG (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculatePWG())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-pink-300 rounded-lg text-pink-700 font-medium"
              />
            </div>
            <p className="text-xs text-pink-600 mt-2">
              PWG = Cicil Emas
            </p>
          </div>

          {/* PBY */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <label className="block text-sm font-medium text-emerald-800 mb-2">
              <span className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                PBY (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculatePBY())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-emerald-300 rounded-lg text-emerald-700 font-medium"
              />
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              PBY = CFG + PWG
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderGrowthTargetsTab = () => {
    const targetSegments = [
      { 
        field: 'Griya', 
        label: 'Griya', 
        icon: <Home className="w-5 h-5" />,
        subFields: [
          { field: 'Griya', label: 'Target Griya (Rp. Juta)' },
          { field: 'Griya_Cair', label: 'Cair Griya', icon: <Droplet className="w-4 h-4" /> },
          { field: 'Griya_RunOff', label: 'Run Off Griya', icon: <TrendingDown className="w-4 h-4" /> }
        ]
      },
      { 
        field: 'Oto', 
        label: 'Oto', 
        icon: <Car className="w-5 h-5" />,
        subFields: [
          { field: 'Oto', label: 'Target Oto (Rp. Juta)' },
          { field: 'Oto_Cair', label: 'Cair Oto', icon: <Droplet className="w-4 h-4" /> },
          { field: 'Oto_RunOff', label: 'Run Off Oto', icon: <TrendingDown className="w-4 h-4" /> }
        ]
      },
      { 
        field: 'Mitraguna', 
        label: 'Mitraguna', 
        icon: <Briefcase className="w-5 h-5" />,
        subFields: [
          { field: 'Mitraguna', label: 'Target Mitraguna (Rp. Juta)' },
          { field: 'Mitraguna_Cair', label: 'Cair Mitraguna', icon: <Droplet className="w-4 h-4" /> },
          { field: 'Mitraguna_RunOff', label: 'Run Off Mitraguna', icon: <TrendingDown className="w-4 h-4" /> }
        ]
      },
      { 
        field: 'Pensiun', 
        label: 'Pensiun', 
        icon: <Users className="w-5 h-5" />,
        subFields: [
          { field: 'Pensiun', label: 'Target Pensiun (Rp. Juta)' },
          { field: 'Pensiun_Cair', label: 'Cair Pensiun', icon: <Droplet className="w-4 h-4" /> },
          { field: 'Pensiun_RunOff', label: 'Run Off Pensiun', icon: <TrendingDown className="w-4 h-4" /> }
        ]
      },
      { 
        field: 'CicilEmas', 
        label: 'Cicil Emas', 
        icon: <Gem className="w-5 h-5" />,
        subFields: [
          { field: 'CicilEmas', label: 'Target Cicil Emas (Rp. Juta)' },
          { field: 'CicilEmas_Cair', label: 'Cair Cicil Emas', icon: <Droplet className="w-4 h-4" /> },
          { field: 'CicilEmas_RunOff', label: 'Run Off Cicil Emas', icon: <TrendingDown className="w-4 h-4" /> }
        ]
      }
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Input Target Growth, Cair & Run Off untuk Periode: {selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod}
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Informasi Input:</p>
              <p className="text-xs text-blue-700 mt-1">
                Masukkan data Cair/Run Off pada data yang paling baru saja.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {targetSegments.map((segment, index) => (
            <div key={segment.field} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg mr-3 ${
                  index === 0 ? 'bg-blue-50' :
                  index === 1 ? 'bg-green-50' :
                  index === 2 ? 'bg-purple-50' :
                  index === 3 ? 'bg-amber-50' :
                  'bg-pink-50'
                }`}>
                  <div className={`${
                    index === 0 ? 'text-blue-600' :
                    index === 1 ? 'text-green-600' :
                    index === 2 ? 'text-purple-600' :
                    index === 3 ? 'text-amber-600' :
                    'text-pink-600'
                  }`}>
                    {segment.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{segment.label}</h4>
                  <p className="text-xs text-gray-500">Target & Data Pendukung</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {segment.subFields.map((subField) => (
                  <div key={subField.field} className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600 flex items-center">
                      {subField.icon && <span className="mr-2">{subField.icon}</span>}
                      {subField.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={
                          subField.field.includes('_') 
                            ? currentData[subField.field] || ''
                            : currentGrowthTargets[subField.field] || ''
                        }
                        onChange={(e) => handleInputChange(
                          subField.field, 
                          e.target.value, 
                          !subField.field.includes('_')
                        )}
                        placeholder={`Contoh: ${getPlaceholderValue(subField.field)}`}
                        className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AUTO-CALCULATED TARGET RESULTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Target CFG */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              <span className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Target CFG (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateTargetCFG())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-blue-300 rounded-lg text-blue-700 font-medium"
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Target CFG = Σ Target Griya, Oto, Mitraguna, Pensiun
            </p>
          </div>

          {/* Target PWG */}
          <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
            <label className="block text-sm font-medium text-pink-800 mb-2">
              <span className="flex items-center">
                <Gem className="w-5 h-5 mr-2" />
                Target PWG (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateTargetPWG())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-pink-300 rounded-lg text-pink-700 font-medium"
              />
            </div>
            <p className="text-xs text-pink-600 mt-2">
              Target PWG = Target Cicil Emas
            </p>
          </div>

          {/* Target PBY */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <label className="block text-sm font-medium text-emerald-800 mb-2">
              <span className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Target PBY (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateTargetPBY())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-emerald-300 rounded-lg text-emerald-700 font-medium"
              />
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              Target PBY = Target CFG + Target PWG
            </p>
          </div>
        </div>

        {/* TOTAL CAIR & RUN OFF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Total Cair */}
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <label className="block text-sm font-medium text-purple-800 mb-2">
              <span className="flex items-center">
                <Droplet className="w-5 h-5 mr-2" />
                Total Cair (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateCairTotal())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-purple-300 rounded-lg text-purple-700 font-medium"
              />
            </div>
            <p className="text-xs text-purple-600 mt-2">
              Σ semua segment cair
            </p>
          </div>

          {/* Total Run Off */}
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <label className="block text-sm font-medium text-red-800 mb-2">
              <span className="flex items-center">
                <TrendingDown className="w-5 h-5 mr-2" />
                Total Run Off (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateRunOffTotal())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-red-300 rounded-lg text-red-700 font-medium"
              />
            </div>
            <p className="text-xs text-red-600 mt-2">
              Σ semua segment run off
            </p>
          </div>
        </div>

        {/* Notes Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan / Keterangan (Opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan catatan atau keterangan jika diperlukan..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            rows="3"
            disabled={loading}
          />
        </div>
      </div>
    );
  };

  const renderTabs = () => {
    switch(activeTab) {
      case 'input': return renderInputTab();
      case 'target': return renderGrowthTargetsTab();
      default: return renderInputTab();
    }
  };

  return (
    <>
      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-6"
      >
        {/* Periode Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-emerald-500" />
              <h2 className="text-xl font-semibold text-gray-900">Pilih Periode PBY</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex space-x-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
                  disabled={loading}
                >
                  <option value="custom">Custom Period</option>
                  {periodsList.map((period) => (
                    <option key={period} value={period}>
                      {period} {allPeriodsData[period] ? '✓' : ''}
                    </option>
                  ))}
                </select>
                
                {selectedPeriod === 'custom' && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customDate.day}
                      onChange={(e) => handleCustomDateChange('day', e.target.value)}
                      placeholder="DD"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={loading}
                    />
                    <select
                      value={customDate.month}
                      onChange={(e) => handleCustomDateChange('month', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[100px]"
                      disabled={loading}
                    >
                      {Array.from({length: 12}, (_, i) => {
                        const monthNum = (i + 1).toString().padStart(2, '0');
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return (
                          <option key={monthNum} value={monthNum}>
                            {months[i]} ({monthNum})
                          </option>
                        );
                      })}
                    </select>
                    <input
                      type="text"
                      value={customDate.year}
                      onChange={(e) => handleCustomDateChange('year', e.target.value)}
                      placeholder="YYYY"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={loading}
                    />
                  </div>
                )}
                
                {selectedPeriod !== 'custom' && allPeriodsData[selectedPeriod] && (
                  <button
                    type="button"
                    onClick={() => handleDeletePeriod(selectedPeriod)}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'input'
                  ? 'border-b-2 border-emerald-500 text-emerald-600 bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <div className="flex items-center justify-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Data Aktual
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('target')}
              className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'target'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <div className="flex items-center justify-center">
                <Target className="w-4 h-4 mr-2" />
                Growth & Cair/Run Off
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {renderTabs()}

            {/* Debug Info */}
            {debugInfo && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{debugInfo}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.button
                type="button"
                onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-300"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Reset All
              </motion.button>
              
              <motion.button
                type="submit"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="animate-spin w-5 h-5 mr-2" />
                    {selectedPeriod !== 'custom' && allPeriodsData[selectedPeriod] 
                      ? 'Mengupdate Data...' 
                      : 'Menyimpan Data...'}
                  </span>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {selectedPeriod !== 'custom' && allPeriodsData[selectedPeriod] 
                      ? `Update Data ${selectedPeriod}` 
                      : `Simpan Data ${getCustomPeriodLabel()}`}
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default InputPBY;