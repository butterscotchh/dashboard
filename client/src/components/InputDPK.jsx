import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  RefreshCw, 
  Calendar,
  DollarSign,
  Wallet,
  Coins,
  CreditCard,
  Landmark,
  AlertCircle,
  Info,
  Target,
  Trash2,
  Edit,
  Gem,
  Building2,
} from 'lucide-react';
import authService from '../services/auth';

const InputDPK = ({ onError }) => {
  // State untuk periode custom dengan TAHUN
  const [customDate, setCustomDate] = useState({
    day: '01',
    month: '01',
    year: '2026'
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('custom');
  
  // Data dari backend
  const [allPeriodsData, setAllPeriodsData] = useState({});
  
  // Data input saat ini
  const [currentData, setCurrentData] = useState({
    Tabungan: '',
    Giro: '',
    Deposito: ''
  });
  
  // Growth targets untuk periode saat ini
  const [currentGrowthTargets, setCurrentGrowthTargets] = useState({
    Tabungan: '',
    Giro: '',
    Deposito: ''
  });
  
  // Data tabungan khusus
  const [tabunganData, setTabunganData] = useState({
    tabungan_haji: '',
    tabungan_bisnis: '',
    tabungan_emas: ''
  });
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [periodsList, setPeriodsList] = useState([]);
  const [activeTab, setActiveTab] = useState('input');

  // Load data saat komponen mount
  useEffect(() => {
    loadAllDPKData();
  }, []);

  // Update current data berdasarkan periode yang dipilih
  useEffect(() => {
    if (selectedPeriod === 'custom') {
      setCurrentData({
        Tabungan: '',
        Giro: '',
        Deposito: ''
      });
      setCurrentGrowthTargets({
        Tabungan: '',
        Giro: '',
        Deposito: ''
      });
      setTabunganData({
        tabungan_haji: '',
        tabungan_bisnis: '',
        tabungan_emas: ''
      });
      setNotes('');
    } else {
      loadPeriodData(selectedPeriod);
    }
  }, [selectedPeriod]);

  // Helper untuk parse periode dari string
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

  // Helper untuk format periode ke string
  const formatPeriodString = (day, month, year) => {
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNum = parseInt(month, 10);
    const monthName = monthsShort[monthNum - 1] || 'Jan';
    return `${day}-${monthName}-${year}`;
  };

  // Fungsi untuk mengurutkan periode
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

  const loadAllDPKData = async () => {
    try {
      const response = await authService.getDPKData();
      
      if (response.success) {
        const formattedData = {};
        const periods = [];
        
        response.data.forEach(item => {
          formattedData[item.period] = {
            Tabungan: item.tabungan?.toString() || '',
            Giro: item.giro?.toString() || '',
            Deposito: item.deposito?.toString() || '',
            DPK: item.dpk?.toString() || '',
            growthTargets: {
              Tabungan: item.target_tabungan ? item.target_tabungan.toString() : '',
              Giro: item.target_giro ? item.target_giro.toString() : '',
              Deposito: item.target_deposito ? item.target_deposito.toString() : '',
              DPK: item.target_dpk ? item.target_dpk.toString() : '',
              CASA: item.target_casa ? item.target_casa.toString() : ''
            },
            tabungan_haji: item.tabungan_haji?.toString() || '',
            tabungan_bisnis: item.tabungan_bisnis?.toString() || '',
            tabungan_emas: item.tabungan_emas?.toString() || '',
            notes: item.notes || '',
            date: item.date || null
          };
          
          periods.push(item.period);
        });
        
        const sortedPeriods = sortPeriods(periods);
        setAllPeriodsData(formattedData);
        setPeriodsList(sortedPeriods);
      } else {
        console.error('Error loading DPK data:', response.error);
      }
    } catch (error) {
      console.error('Error loading DPK data:', error);
    }
  };

  const loadPeriodData = async (period) => {
    try {
      const response = await authService.getDPKPeriodData(period);
      
      if (response.success && response.data) {
        const data = response.data;
        setCurrentData({
          Tabungan: data.tabungan?.toString() || '',
          Giro: data.giro?.toString() || '',
          Deposito: data.deposito?.toString() || ''
        });
        setCurrentGrowthTargets({
          Tabungan: data.target_tabungan ? data.target_tabungan.toString() : '',
          Giro: data.target_giro ? data.target_giro.toString() : '',
          Deposito: data.target_deposito ? data.target_deposito.toString() : '',
          DPK: data.target_dpk ? data.target_dpk.toString() : '',
          CASA: data.target_casa ? data.target_casa.toString() : ''
        });
        setTabunganData({
          tabungan_haji: data.tabungan_haji ? data.tabungan_haji.toString() : '',
          tabungan_bisnis: data.tabungan_bisnis ? data.tabungan_bisnis.toString() : '',
          tabungan_emas: data.tabungan_emas ? data.tabungan_emas.toString() : ''
        });
        setNotes(data.notes || '');
        
        const parsedDate = parsePeriodString(period);
        setCustomDate(parsedDate);
      } else {
        setCurrentData({ Tabungan: '', Giro: '', Deposito: '' });
        setCurrentGrowthTargets({ Tabungan: '', Giro: '', Deposito: '', DPK: '', CASA: '' });
        setTabunganData({ tabungan_haji: '', tabungan_bisnis: '', tabungan_emas: '' });
        setNotes('');
        
        const parsedDate = parsePeriodString(period);
        setCustomDate(parsedDate);
      }
    } catch (error) {
      console.error('Error loading period data:', error);
    }
  };

  const handleDeletePeriod = async (period) => {
    if (!window.confirm(`Yakin ingin menghapus data untuk periode ${period}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await authService.deleteDPKData(period);
      
      if (response.success) {
        const updatedData = { ...allPeriodsData };
        delete updatedData[period];
        setAllPeriodsData(updatedData);
        
        const updatedPeriods = periodsList.filter(p => p !== period);
        setPeriodsList(updatedPeriods);
        
        if (selectedPeriod === period) {
          setSelectedPeriod('custom');
          setCurrentData({ Tabungan: '', Giro: '', Deposito: '' });
          setCurrentGrowthTargets({ Tabungan: '', Giro: '', Deposito: '', DPK: '', CASA: '' });
          setTabunganData({ tabungan_haji: '', tabungan_bisnis: '', tabungan_emas: '' });
          setNotes('');
        }
        
        setDebugInfo(`✅ Data periode ${period} berhasil dihapus`);
      } else {
        onError(`❌ Gagal menghapus data: ${response.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      onError('❌ Gagal menghapus data. Silakan coba lagi.');
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

  const handleTabunganChange = (field, value) => {
    const cleanedValue = value.replace(/[^0-9.,]/g, '');
    setTabunganData(prev => ({
      ...prev,
      [field]: cleanedValue
    }));
  };

  // Helper untuk parse angka
  const parseNumber = (value) => {
    if (!value && value !== '0') return 0;
    const cleaned = value.toString().replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // AUTO-CALCULATED FUNCTIONS
  const calculateDPK = () => {
    const tabungan = parseNumber(currentData.Tabungan);
    const giro = parseNumber(currentData.Giro);
    const deposito = parseNumber(currentData.Deposito);
    return tabungan + giro + deposito;
  };

  const calculateCASA = () => {
    const tabungan = parseNumber(currentData.Tabungan);
    const giro = parseNumber(currentData.Giro);
    return tabungan + giro;
  };

  const calculateCASAPercentage = () => {
    const casa = calculateCASA();
    const dpk = calculateDPK();
    if (dpk === 0) return '0.00';
    return ((casa / dpk) * 100).toFixed(2);
  };

  const calculateTargetDPK = () => {
    const targetTabungan = parseNumber(currentGrowthTargets.Tabungan);
    const targetGiro = parseNumber(currentGrowthTargets.Giro);
    const targetDeposito = parseNumber(currentGrowthTargets.Deposito);
    return targetTabungan + targetGiro + targetDeposito;
  };

  const calculateTargetCASA = () => {
    const targetTabungan = parseNumber(currentGrowthTargets.Tabungan);
    const targetGiro = parseNumber(currentGrowthTargets.Giro);
    return targetTabungan + targetGiro;
  };

  const calculateTargetCASAPercentage = () => {
    const targetCASA = calculateTargetCASA();
    const targetDPK = calculateTargetDPK();
    if (targetDPK === 0) return '0.00';
    return ((targetCASA / targetDPK) * 100).toFixed(2);
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
    
    if (day < 1 || day > 31) return 'Hari harus antara 1-31';
    if (month < 1 || month > 12) return 'Bulan harus antara 1-12';
    if (year < 2000 || year > 2100) return 'Tahun harus antara 2000-2100';
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

    const requiredFields = ['Tabungan', 'Giro', 'Deposito'];
    const isEmpty = requiredFields.some(field => !currentData[field]);
    
    if (isEmpty) {
      onError('Harap isi semua field data aktual (Tabungan, Giro, Deposito)!');
      setLoading(false);
      return;
    }

    try {
      const periodKey = selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod;
      
      const parseNullableNumber = (value) => {
        if (!value && value !== '0') return null;
        const cleaned = value.toString().replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      };

      // Data aktual
      const tabunganValue = parseNumber(currentData.Tabungan);
      const giroValue = parseNumber(currentData.Giro);
      const depositoValue = parseNumber(currentData.Deposito);
      
      // AUTO-CALCULATED
      const dpkValue = tabunganValue + giroValue + depositoValue;
      const casaValue = tabunganValue + giroValue;
      const casaPercentageValue = dpkValue > 0 ? (casaValue / dpkValue) * 100 : 0;

      // Data target
      const targetTabunganValue = parseNullableNumber(currentGrowthTargets.Tabungan);
      const targetGiroValue = parseNullableNumber(currentGrowthTargets.Giro);
      const targetDepositoValue = parseNullableNumber(currentGrowthTargets.Deposito);
      
      const targetDPKValue = targetTabunganValue + targetGiroValue + targetDepositoValue;
      const targetCASAValue = targetTabunganValue + targetGiroValue;

      // Data tabungan khusus
      const tabunganHajiValue = parseNullableNumber(tabunganData.tabungan_haji);
      const tabunganBisnisValue = parseNullableNumber(tabunganData.tabungan_bisnis);
      const tabunganEmasValue = parseNullableNumber(tabunganData.tabungan_emas);

      // Format date
      let formattedDate = null;
      if (selectedPeriod === 'custom') {
        formattedDate = `${customDate.year}-${customDate.month}-${customDate.day}`;
      }

      const dataToSave = {
        period: periodKey,
        date: formattedDate,
        dpk: dpkValue,
        tabungan: tabunganValue,
        giro: giroValue,
        deposito: depositoValue,
        casa: casaValue,
        casa_percentage: parseFloat(casaPercentageValue.toFixed(2)),
        target_dpk: targetDPKValue,
        target_tabungan: targetTabunganValue,
        target_giro: targetGiroValue,
        target_deposito: targetDepositoValue,
        target_casa: targetCASAValue,
        tabungan_haji: tabunganHajiValue,
        tabungan_bisnis: tabunganBisnisValue,
        tabungan_emas: tabunganEmasValue,
        notes: notes || null
      };

      const response = await authService.saveDPKData(dataToSave);
      
      if (response.success) {
        setDebugInfo(`✅ Data untuk periode ${periodKey} berhasil disimpan! Redirecting to dashboard...`);
        
        if (selectedPeriod === 'custom' && !periodsList.includes(periodKey)) {
          const newPeriodsList = sortPeriods([...periodsList, periodKey]);
          setPeriodsList(newPeriodsList);
        }
        
        const updatedData = { ...allPeriodsData };
        updatedData[periodKey] = {
          Tabungan: currentData.Tabungan,
          Giro: currentData.Giro,
          Deposito: currentData.Deposito,
          DPK: dpkValue.toString(),
          growthTargets: {
            Tabungan: currentGrowthTargets.Tabungan,
            Giro: currentGrowthTargets.Giro,
            Deposito: currentGrowthTargets.Deposito,
            DPK: targetDPKValue.toString(),
            CASA: targetCASAValue.toString()
          },
          tabungan_haji: tabunganData.tabungan_haji,
          tabungan_bisnis: tabunganData.tabungan_bisnis,
          tabungan_emas: tabunganData.tabungan_emas,
          notes: notes,
          date: formattedDate
        };
        setAllPeriodsData(updatedData);
        
        setSelectedPeriod(periodKey);
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        const errorMsg = response.error || response.message || 'Gagal menyimpan data';
        onError(`❌ Error: ${errorMsg}`);
      }

    } catch (err) {
      let errorMsg = 'Gagal menyimpan data. Silakan coba lagi.';
      if (err.response) {
        errorMsg = `Server error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        errorMsg = 'Tidak ada response dari server. Periksa koneksi backend.';
      }
      
      onError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentData({ Tabungan: '', Giro: '', Deposito: '' });
    setCurrentGrowthTargets({ Tabungan: '', Giro: '', Deposito: '', DPK: '', CASA: '' });
    setTabunganData({ tabungan_haji: '', tabungan_bisnis: '', tabungan_emas: '' });
    setNotes('');
    onError('');
    setDebugInfo('');
    setCustomDate({ day: '31', month: '12', year: '2024' });
  };

  // Format untuk display
  const formatDisplayNumber = (value) => {
    if (!value && value !== 0) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getPlaceholderValue = (field) => {
    const examples = {
      'Tabungan': '168107',
      'Giro': '107073',
      'Deposito': '113945',
      'targetTabungan': '180000',
      'targetGiro': '120000',
      'targetDeposito': '130000',
      'tabungan_haji': '50000',
      'tabungan_bisnis': '75000',
      'tabungan_emas': '25000'
    };
    return examples[field] || '0';
  };

  const renderInputTab = () => {
    const categories = [
      { field: 'Tabungan', label: 'Tabungan', icon: <Coins className="w-5 h-5" /> },
      { field: 'Giro', label: 'Giro', icon: <CreditCard className="w-5 h-5" /> },
      { field: 'Deposito', label: 'Deposito', icon: <Landmark className="w-5 h-5" /> }
    ];

    const tabunganCategories = [
      { field: 'tabungan_haji', label: 'Tabungan Haji', icon: <Landmark className="w-5 h-5" />, color: 'purple' },
      { field: 'tabungan_bisnis', label: 'Tabungan Bisnis', icon: <Building2 className="w-5 h-5" />, color: 'blue' },
      { field: 'tabungan_emas', label: 'Tabungan Emas', icon: <Gem className="w-5 h-5" />, color: 'amber' }
    ];

    return (
      <div className="space-y-6 md:space-y-8">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
          Input Data Aktual DPK untuk Periode: {selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod}
        </h3>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg md:rounded-xl p-3 md:p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm font-medium text-emerald-800">Cara Input:</p>
              <p className="text-xs text-emerald-700 mt-1">
                Masukkan angka langsung tanpa tanda titik atau koma. Contoh: 350000 (untuk Rp 350 Juta)
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: DPK DATA */}
        <div>
          <h4 className="text-sm md:text-md font-semibold text-gray-700 mb-3 md:mb-4 pb-2 border-b border-gray-200">
            Data DPK Utama
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {categories.map(({ field, label, icon }) => (
              <div key={field} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-emerald-50 mr-2 md:mr-3">
                    <div className="text-emerald-600">
                      {icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-medium text-gray-900">{label}</h4>
                    <p className="text-xs text-gray-500">Data Aktual (Rp. Juta)</p>
                  </div>
                </div>
                
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nilai (Rp. Juta)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs md:text-sm">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={currentData[field] || ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        placeholder={`Contoh: ${getPlaceholderValue(field)}`}
                        className="pl-8 md:pl-10 pr-3 py-2 text-sm w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Format Display:</p>
                    <p className="text-xs md:text-sm font-semibold text-gray-900">
                      Rp {formatDisplayNumber(currentData[field] || '0')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: TABUNGAN DETAIL */}
        <div>
          <h4 className="text-sm md:text-md font-semibold text-gray-700 mb-3 md:mb-4 pb-2 border-b border-gray-200">
            Detail Tabungan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {tabunganCategories.map(({ field, label, icon, color }) => (
              <div key={field} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center mb-2 md:mb-3">
                  <div className={`p-1.5 md:p-2 rounded-lg ${color}-50 mr-2 md:mr-3`}>
                    <div className={`text-${color}-600`}>
                      {icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-medium text-gray-900">{label}</h4>
                    <p className="text-xs text-gray-500">Data Aktual (Rp. Juta)</p>
                  </div>
                </div>
                
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nilai (Rp. Juta)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs md:text-sm">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={tabunganData[field] || ''}
                        onChange={(e) => handleTabunganChange(field, e.target.value)}
                        placeholder={`Contoh: ${getPlaceholderValue(field)}`}
                        className={`pl-8 md:pl-10 pr-3 py-2 text-sm w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-${color}-500 transition duration-200`}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Format Display:</p>
                    <p className="text-xs md:text-sm font-semibold text-gray-900">
                      Rp {formatDisplayNumber(tabunganData[field] || '0')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: AUTO-CALCULATED RESULTS */}
        <div>
          <h4 className="text-sm md:text-md font-semibold text-gray-700 mb-3 md:mb-4 pb-2 border-b border-gray-200">
            Hasil Perhitungan Otomatis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* DPK */}
            <div className="bg-emerald-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-emerald-200">
              <label className="block text-xs md:text-sm font-medium text-emerald-800 mb-2">
                <span className="flex items-center">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  DPK (Auto-calculated)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 text-xs md:text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatDisplayNumber(calculateDPK())}
                  readOnly
                  className="pl-8 md:pl-10 pr-3 py-2 md:py-3 text-sm w-full bg-white border border-emerald-300 rounded-lg text-emerald-700 font-medium"
                />
              </div>
              <p className="text-xs text-emerald-600 mt-2">
                DPK = Tabungan + Giro + Deposito
              </p>
            </div>

            {/* CASA */}
            <div className="bg-emerald-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-emerald-200">
              <label className="block text-xs md:text-sm font-medium text-emerald-800 mb-2">
                <span className="flex items-center">
                  <Wallet className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  CASA (Auto-calculated)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 text-xs md:text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatDisplayNumber(calculateCASA())}
                  readOnly
                  className="pl-8 md:pl-10 pr-3 py-2 md:py-3 text-sm w-full bg-white border border-emerald-300 rounded-lg text-emerald-700 font-medium"
                />
              </div>
              <p className="text-xs text-emerald-600 mt-2">
                CASA = Tabungan + Giro
              </p>
            </div>

            {/* % CASA */}
            <div className="bg-emerald-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-emerald-200">
              <label className="block text-xs md:text-sm font-medium text-emerald-800 mb-2">
                <span className="flex items-center">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  % CASA (Auto-calculated)
                </span>
              </label>
              <input
                type="text"
                value={`${calculateCASAPercentage()}%`}
                readOnly
                className="px-3 py-2 md:py-3 text-sm w-full bg-white border border-emerald-300 rounded-lg text-emerald-700 font-medium text-center"
              />
              <p className="text-xs text-emerald-600 mt-2">
                % CASA = (CASA ÷ DPK) × 100%
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGrowthTargetsTab = () => {
    const categories = [
      { field: 'Tabungan', label: 'Target Tabungan', icon: <Coins className="w-5 h-5" /> },
      { field: 'Giro', label: 'Target Giro', icon: <CreditCard className="w-5 h-5" /> },
      { field: 'Deposito', label: 'Target Deposito', icon: <Landmark className="w-5 h-5" /> }
    ];

    return (
      <div className="space-y-4 md:space-y-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Input Target Growth DPK untuk Periode: {selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod}
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm font-medium text-blue-800">Informasi Target</p>
              <p className="text-xs text-blue-700 mt-1">
                Masukkan Growth Target pada data yang paling baru saja.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {categories.map(({ field, label, icon }) => (
            <div key={field} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center mb-2 md:mb-3">
                <div className="p-1.5 md:p-2 rounded-lg bg-blue-50 mr-2 md:mr-3">
                  <div className="text-blue-600">
                    {icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-medium text-gray-900">{label}</h4>
                  <p className="text-xs text-gray-500">Target Growth (Rp. Juta)</p>
                </div>
              </div>
              
              <div className="space-y-2 md:space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Target (Rp. Juta)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs md:text-sm">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={currentGrowthTargets[field] || ''}
                      onChange={(e) => handleInputChange(field, e.target.value, true)}
                      placeholder="Contoh: 45000"
                      className="pl-8 md:pl-10 pr-3 py-2 text-sm w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Aktual:</p>
                  <p className="text-xs md:text-sm font-semibold text-gray-900">
                    Rp {formatDisplayNumber(currentData[field] || '0')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AUTO-CALCULATED TARGET RESULTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
          {/* Target DPK */}
          <div className="bg-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
            <label className="block text-xs md:text-sm font-medium text-blue-800 mb-2">
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Target DPK (Auto-calculated)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 text-xs md:text-sm">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateTargetDPK())}
                readOnly
                className="pl-8 md:pl-10 pr-3 py-2 md:py-3 text-sm w-full bg-white border border-blue-300 rounded-lg text-blue-700 font-medium"
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Target DPK = Target Tabungan + Target Giro + Target Deposito
            </p>
          </div>

          {/* Target CASA */}
          <div className="bg-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
            <label className="block text-xs md:text-sm font-medium text-blue-800 mb-2">
              <span className="flex items-center">
                <Wallet className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Target CASA (Auto-calculated)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 text-xs md:text-sm">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateTargetCASA())}
                readOnly
                className="pl-8 md:pl-10 pr-3 py-2 md:py-3 text-sm w-full bg-white border border-blue-300 rounded-lg text-blue-700 font-medium"
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Target CASA = Target Tabungan + Target Giro
            </p>
          </div>

          {/* Target % CASA */}
          <div className="bg-blue-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-blue-200">
            <label className="block text-xs md:text-sm font-medium text-blue-800 mb-2">
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Target % CASA (Auto-calculated)
              </span>
            </label>
            <input
              type="text"
              value={`${calculateTargetCASAPercentage()}%`}
              readOnly
              className="px-3 py-2 md:py-3 text-sm w-full bg-white border border-blue-300 rounded-lg text-blue-700 font-medium text-center"
            />
            <p className="text-xs text-blue-600 mt-2">
              Target % CASA = (Target CASA ÷ Target DPK) × 100%
            </p>
          </div>
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
        className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl border border-white/20 mb-4 md:mb-6"
      >
        {/* Periode Selection */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center mb-3 md:mb-0">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-emerald-500" />
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Pilih Periode DPK</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px] md:min-w-[200px]"
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
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={customDate.day}
                      onChange={(e) => handleCustomDateChange('day', e.target.value)}
                      placeholder="DD"
                      className="w-16 md:w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={loading}
                    />
                    <select
                      value={customDate.month}
                      onChange={(e) => handleCustomDateChange('month', e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[90px] md:min-w-[100px]"
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
                      className="w-20 md:w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={loading}
                    />
                  </div>
                )}
                
                {/* Delete Button */}
                {selectedPeriod !== 'custom' && allPeriodsData[selectedPeriod] && (
                  <button
                    type="button"
                    onClick={() => handleDeletePeriod(selectedPeriod)}
                    className="inline-flex items-center px-3 md:px-4 py-2 text-sm border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                    disabled={loading}
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Info */}
          <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600">
            <p className="font-medium text-blue-900">Jika terdapat 2 tabel duplikat pada bulan dan tahunnya, bedakan di tanggalnya agar tidak terjadi salah kalkulasi.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`flex-1 min-w-[100px] md:min-w-[120px] px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium transition-colors duration-200 ${
                activeTab === 'input'
                  ? 'border-b-2 border-emerald-500 text-emerald-600 bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <div className="flex items-center justify-center">
                <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Data Aktual
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('target')}
              className={`flex-1 min-w-[100px] md:min-w-[120px] px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-medium transition-colors duration-200 ${
                activeTab === 'target'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <div className="flex items-center justify-center">
                <Target className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Growth Target
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">
          <form onSubmit={handleSubmit}>
            {renderTabs()}

            {/* Notes Section */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2 md:mb-3">
                <span className="flex items-center">
                  <Edit className="w-4 h-4 md:w-5 md:h-5 mr-2 text-gray-500" />
                  Catatan (Opsional)
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan atau keterangan..."
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                rows="2"
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4">
              <motion.button
                type="button"
                onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center px-4 md:px-6 py-3 border-2 border-gray-300 rounded-lg md:rounded-xl text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-300"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                Reset All
              </motion.button>
              
              <motion.button
                type="submit"
                className="flex-1 inline-flex items-center justify-center px-4 md:px-6 py-3 border border-transparent rounded-lg md:rounded-xl text-xs md:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="animate-spin w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                    {selectedPeriod !== 'custom' && allPeriodsData[selectedPeriod] 
                      ? 'Mengupdate...' 
                      : 'Menyimpan...'}
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                    {selectedPeriod !== 'custom' && allPeriodsData[selectedPeriod] 
                      ? `Update ${selectedPeriod}` 
                      : `Simpan ${getCustomPeriodLabel()}`}
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

export default InputDPK;