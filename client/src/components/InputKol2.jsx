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
  AlertCircle,
  Info,
  Trash2
} from 'lucide-react';
import authService from '../services/auth';

const InputKol2 = ({ onError }) => {
  // State untuk periode custom dengan TAHUN
  const [customDate, setCustomDate] = useState({
    day: '01',
    month: '01',
    year: '2026'
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('custom');
  
  // Data dari backend
  const [allPeriodsData, setAllPeriodsData] = useState({});
  
  // Data input saat ini - HANYA DATA AKTUAL UTAMA (tanpa cair & runoff)
  const [currentData, setCurrentData] = useState({
    // Segment Griya
    Griya: '',
    
    // Segment Oto
    Oto: '',
    
    // Segment Mitraguna
    Mitraguna: '',
    
    // Segment Pensiun
    Pensiun: '',
    
    // Segment Cicil Emas (PWG)
    CicilEmas: ''
  });
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [periodsList, setPeriodsList] = useState([]);

  // Load data saat komponen mount
  useEffect(() => {
    loadAllKol2Data();
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

  const loadAllKol2Data = async () => {
    try {
      console.log('Loading Kol2 data...');
      const response = await authService.getKol2Data();
      console.log('Kol2 data response:', response);
      
      if (response.success && response.data) {
        const formattedData = {};
        const periods = [];
        
        // Handle jika response.data adalah array
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        
        dataArray.forEach(item => {
          if (!item || !item.period) return;
          
          formattedData[item.period] = {
            // Data aktual utama saja
            Griya: item.griya?.toString() || '',
            Oto: item.oto?.toString() || '',
            Mitraguna: item.mitraguna?.toString() || '',
            Pensiun: item.pensiun?.toString() || '',
            CicilEmas: item.cicil_emas?.toString() || '',
            
            // Auto calculated
            CFG: item.cfg?.toString() || '',
            PWG: item.pwg?.toString() || '',
            kol2: item.kol2?.toString() || '',
            
            notes: item.notes || '',
            date: item.date || null
          };
          
          periods.push(item.period);
        });
        
        const sortedPeriods = sortPeriods(periods);
        setAllPeriodsData(formattedData);
        setPeriodsList(sortedPeriods);
        
        console.log('Formatted Kol2 data:', formattedData);
      } else {
        console.log('No Kol2 data found or empty response');
        setDebugInfo(response.error || 'Tidak ada data Kol2');
      }
    } catch (error) {
      console.error('Error loading Kol2 data:', error);
      setDebugInfo(`Catch error: ${error.message}`);
      onError(`Gagal memuat data: ${error.message}`);
    }
  };

  const loadPeriodData = async (period) => {
    try {
      console.log(`Loading Kol2 period data for: ${period}`);
      const response = await authService.getKol2PeriodData(period);
      console.log('Kol2 Period data response:', response);
      
      if (response.success && response.data) {
        const data = response.data;
        setCurrentData({
          Griya: data.griya?.toString() || '',
          Oto: data.oto?.toString() || '',
          Mitraguna: data.mitraguna?.toString() || '',
          Pensiun: data.pensiun?.toString() || '',
          CicilEmas: data.cicil_emas?.toString() || ''
        });
        
        setNotes(data.notes || '');
        
        const parsedDate = parsePeriodString(period);
        setCustomDate(parsedDate);
      } else {
        console.log('No Kol2 data found for period:', period);
        resetForm();
        
        const parsedDate = parsePeriodString(period);
        setCustomDate(parsedDate);
        
        onError(`Data untuk periode ${period} tidak ditemukan`);
      }
    } catch (error) {
      console.error('Error loading Kol2 period data:', error);
      setDebugInfo(`Kol2 Period data error: ${error.message}`);
      onError(`Gagal memuat data periode: ${error.message}`);
    }
  };

  const handleDeletePeriod = async (period) => {
    if (!window.confirm(`Yakin ingin menghapus data Kol2 untuk periode ${period}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Deleting Kol2 period: ${period}`);
      
      const response = await authService.deleteKol2Data(period);
      console.log('Delete Kol2 response:', response);
      
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
        
        setDebugInfo(`✅ Data Kol2 periode ${period} berhasil dihapus`);
        onError('');
      } else {
        onError(`❌ Gagal menghapus data Kol2: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete Kol2 error:', error);
      onError('❌ Gagal menghapus data Kol2. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    const cleanedValue = value.replace(/[^0-9.,]/g, '');
    
    setCurrentData(prev => ({
      ...prev,
      [field]: cleanedValue
    }));
  };

  // ========== AUTO-CALCULATED FUNCTIONS ==========
  
  // Helper untuk parse angka
 const parseNumber = (value) => {
  if (!value && value !== '0') return 0; // Sudah mengembalikan 0 untuk null/undefined
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

  // 3. KOL2 = CFG + PWG (AUTO-CALCULATED)
  const calculateKOL2 = () => {
    return calculateCFG() + calculatePWG();
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

    try {
      const periodKey = selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod;
      
      const parseNumber = (value) => {
        if (!value && value !== '0') return 0;
        const cleaned = value.toString().replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Data aktual
      const griyaValue = parseNumber(currentData.Griya);
      const otoValue = parseNumber(currentData.Oto);
      const mitragunaValue = parseNumber(currentData.Mitraguna);
      const pensiunValue = parseNumber(currentData.Pensiun);
      const cicilEmasValue = parseNumber(currentData.CicilEmas);
      
      // AUTO-CALCULATED
      const cfgValue = griyaValue + otoValue + mitragunaValue + pensiunValue;
      const pwgValue = cicilEmasValue;
      const kol2Value = cfgValue + pwgValue;

      let formattedDate = null;
      if (selectedPeriod === 'custom') {
        formattedDate = `${customDate.year}-${customDate.month}-${customDate.day}`;
      }

      const dataToSave = {
        period: periodKey,
        date: formattedDate,
        
        // Data aktual utama saja
        griya: griyaValue,
        oto: otoValue,
        mitraguna: mitragunaValue,
        pensiun: pensiunValue,
        cicil_emas: cicilEmasValue,
        
        // Auto calculated
        cfg: cfgValue,
        pwg: pwgValue,
        kol2: kol2Value,
        
        notes: notes || null
      };

      console.log('=== KOL2 DATA TO SAVE ===', dataToSave);

      const response = await authService.saveKol2Data(dataToSave);
      
      if (response.success) {
        console.log('✅ Data Kol2 berhasil disimpan');
        setDebugInfo(`✅ Data Kol2 untuk periode ${periodKey} berhasil disimpan!`);
        
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
          KOL2: kol2Value.toString(),
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
        console.error('❌ Save Kol2 failed:', response);
        const errorMsg = response.error || response.message || 'Gagal menyimpan data Kol2';
        onError(`❌ Error: ${errorMsg}`);
        setDebugInfo(`❌ Server error: ${JSON.stringify(response, null, 2)}`);
      }

    } catch (err) {
      console.error('❌ Catch error:', err);
      let errorMsg = 'Gagal menyimpan data Kol2. Silakan coba lagi.';
      
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
      'CicilEmas': '15000'
    };
    return examples[field] || '0';
  };

  const renderInputForm = () => {
    const segments = [
      {
        field: 'Griya',
        label: 'Griya',
        icon: <Home className="w-5 h-5" />,
      },
      {
        field: 'Oto',
        label: 'Oto',
        icon: <Car className="w-5 h-5" />,
      },
      {
        field: 'Mitraguna',
        label: 'Mitraguna',
        icon: <Briefcase className="w-5 h-5" />,
      },
      {
        field: 'Pensiun',
        label: 'Pensiun',
        icon: <Users className="w-5 h-5" />,
      },
      {
        field: 'CicilEmas',
        label: 'Cicil Emas (PWG)',
        icon: <Gem className="w-5 h-5" />,
      }
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Input Data Aktual Kol. 2 untuk Periode: {selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod}
        </h3>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Cara Input Kol. 2:</p>
              <p className="text-xs text-emerald-700 mt-1">
                Masukkan angka tanpa titik/koma. Contoh: 350000 (untuk Rp 350 Juta)
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                <strong>Note:</strong> Kol2 hanya input data aktual utama tanpa cair/run off
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
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">
                    {segment.label} (Rp. Juta)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={currentData[segment.field] || ''}
                      onChange={(e) => handleInputChange(segment.field, e.target.value)}
                      placeholder={`Contoh: ${getPlaceholderValue(segment.field)}`}
                      className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>
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

          {/* KOL2 */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <label className="block text-sm font-medium text-emerald-800 mb-2">
              <span className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                KOL2 (Auto)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateKOL2())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-emerald-300 rounded-lg text-emerald-700 font-medium"
              />
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              KOL2 = CFG + PWG
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
              <h2 className="text-xl font-semibold text-gray-900">Pilih Periode Kol. 2</h2>
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

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {renderInputForm()}

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

export default InputKol2;