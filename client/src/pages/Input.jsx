import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Calendar,
  DollarSign,
  Wallet,
  PiggyBank,
  CreditCard,
  Landmark,
  AlertCircle,
  Info,
  Target,
  Trash2,
  Edit
} from 'lucide-react';
import authService from '../services/auth';

const InputDPK = () => {
  const navigate = useNavigate();
  
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
    DPK: '',
    Tabungan: '',
    Giro: '',
    Deposito: ''
  });
  
  // Growth targets untuk periode saat ini
  const [currentGrowthTargets, setCurrentGrowthTargets] = useState({
    DPK: '',
    Tabungan: '',
    Giro: '',
    Deposito: '',
    CASA: ''
  });
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [debugInfo, setDebugInfo] = useState('');
  const [periodsList, setPeriodsList] = useState([]);

  // Load data saat komponen mount
  useEffect(() => {
    loadAllDPKData();
  }, []);

  // Update current data berdasarkan periode yang dipilih
  useEffect(() => {
    if (selectedPeriod === 'custom') {
      setCurrentData({
        DPK: '',
        Tabungan: '',
        Giro: '',
        Deposito: ''
      });
      setCurrentGrowthTargets({
        DPK: '',
        Tabungan: '',
        Giro: '',
        Deposito: '',
        CASA: ''
      });
      setNotes('');
    } else {
      loadPeriodData(selectedPeriod);
    }
  }, [selectedPeriod]);

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
    // Fallback untuk format lama
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
      
      // Konversi ke Date object untuk perbandingan
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndexA = months.indexOf(dateA.month);
      const monthIndexB = months.indexOf(dateB.month);
      
      const dateObjA = new Date(parseInt(dateA.year), monthIndexA, parseInt(dateA.day));
      const dateObjB = new Date(parseInt(dateB.year), monthIndexB, parseInt(dateB.day));
      
      return dateObjA - dateObjB; // Dari terlama ke terbaru
    });
  };

  const loadAllDPKData = async () => {
    try {
      console.log('Loading DPK data...');
      const response = await authService.getDPKData();
      console.log('DPK data response:', response);
      
      if (response.success) {
        // Convert data dari backend ke format frontend
        const formattedData = {};
        const periods = [];
        
        response.data.forEach(item => {
          formattedData[item.period] = {
            DPK: item.dpk?.toString() || '',
            Tabungan: item.tabungan?.toString() || '',
            Giro: item.giro?.toString() || '',
            Deposito: item.deposito?.toString() || '',
            growthTargets: {
              DPK: item.target_dpk ? item.target_dpk.toString() : '',
              Tabungan: item.target_tabungan ? item.target_tabungan.toString() : '',
              Giro: item.target_giro ? item.target_giro.toString() : '',
              Deposito: item.target_deposito ? item.target_deposito.toString() : '',
              CASA: item.target_casa ? item.target_casa.toString() : ''
            },
            notes: item.notes || '',
            date: item.date || null
          };
          
          periods.push(item.period);
        });
        
        // Urutkan periode dari terlama ke terbaru
        const sortedPeriods = sortPeriods(periods);
        
        setAllPeriodsData(formattedData);
        setPeriodsList(sortedPeriods);
        
        console.log('Formatted data:', formattedData);
        console.log('Sorted periods list:', sortedPeriods);
      } else {
        console.error('Error loading DPK data:', response.error);
        setDebugInfo(`Error: ${response.error}`);
      }
    } catch (error) {
      console.error('Error loading DPK data:', error);
      setDebugInfo(`Catch error: ${error.message}`);
    }
  };

  const loadPeriodData = async (period) => {
    try {
      console.log(`Loading period data for: ${period}`);
      const response = await authService.getDPKPeriodData(period);
      console.log('Period data response:', response);
      
      if (response.success && response.data) {
        const data = response.data;
        setCurrentData({
          DPK: data.dpk?.toString() || '',
          Tabungan: data.tabungan?.toString() || '',
          Giro: data.giro?.toString() || '',
          Deposito: data.deposito?.toString() || ''
        });
        setCurrentGrowthTargets({
          DPK: data.target_dpk ? data.target_dpk.toString() : '',
          Tabungan: data.target_tabungan ? data.target_tabungan.toString() : '',
          Giro: data.target_giro ? data.target_giro.toString() : '',
          Deposito: data.target_deposito ? data.target_deposito.toString() : '',
          CASA: data.target_casa ? data.target_casa.toString() : ''
        });
        setNotes(data.notes || '');
        
        // Parse periode ke customDate
        const parsedDate = parsePeriodString(period);
        setCustomDate(parsedDate);
      } else {
        // Data belum ada, reset form
        console.log('No data found for period:', period);
        setCurrentData({
          DPK: '',
          Tabungan: '',
          Giro: '',
          Deposito: ''
        });
        setCurrentGrowthTargets({
          DPK: '',
          Tabungan: '',
          Giro: '',
          Deposito: '',
          CASA: ''
        });
        setNotes('');
        
        // Tetap set customDate dari periode yang dipilih
        const parsedDate = parsePeriodString(period);
        setCustomDate(parsedDate);
      }
    } catch (error) {
      console.error('Error loading period data:', error);
      setDebugInfo(`Period data error: ${error.message}`);
    }
  };

  const handleDeletePeriod = async (period) => {
    if (!window.confirm(`Yakin ingin menghapus data untuk periode ${period}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Deleting period: ${period}`);
      
      const response = await authService.deleteDPKData(period);
      console.log('Delete response:', response);
      
      if (response.success) {
        // Update local state
        const updatedData = { ...allPeriodsData };
        delete updatedData[period];
        setAllPeriodsData(updatedData);
        
        // Update periods list
        const updatedPeriods = periodsList.filter(p => p !== period);
        setPeriodsList(updatedPeriods);
        
        // Jika period yang dihapus sedang dipilih, reset ke custom
        if (selectedPeriod === period) {
          setSelectedPeriod('custom');
          setCurrentData({
            DPK: '',
            Tabungan: '',
            Giro: '',
            Deposito: ''
          });
          setCurrentGrowthTargets({
            DPK: '',
            Tabungan: '',
            Giro: '',
            Deposito: '',
            CASA: ''
          });
          setNotes('');
        }
        
        setDebugInfo(`✅ Data periode ${period} berhasil dihapus`);
      } else {
        setError(`❌ Gagal menghapus data: ${response.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('❌ Gagal menghapus data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value, isTarget = false) => {
    // Hanya terima angka, titik, dan koma
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

  const calculateCASA = (data = currentData) => {
    const parseValue = (value) => {
      if (!value) return 0;
      const cleaned = value.toString().replace(',', '.');
      return parseFloat(cleaned) || 0;
    };
    
    const tabungan = parseValue(data.Tabungan);
    const giro = parseValue(data.Giro);
    return tabungan + giro;
  };

  const calculateCASAPercentage = (data = currentData) => {
    const casa = calculateCASA(data);
    const dpkValue = parseFloat(data.DPK?.replace(',', '.') || 0);
    if (dpkValue === 0) return '0.00';
    return ((casa / dpkValue) * 100).toFixed(2);
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
    setError('');
    setDebugInfo('');
    setLoading(true);

    // Validasi custom date jika pilih custom
    if (selectedPeriod === 'custom') {
      const dateError = validateCustomDate();
      if (dateError) {
        setError(dateError);
        setLoading(false);
        return;
      }
    }

    // Validasi data aktual
    const requiredFields = ['DPK', 'Tabungan', 'Giro', 'Deposito'];
    const isEmpty = requiredFields.some(field => !currentData[field]);
    
    if (isEmpty) {
      setError('Harap isi semua field data aktual yang wajib diisi!');
      setLoading(false);
      return;
    }

    try {
      const periodKey = selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod;
      
      // Helper function untuk parse value
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

      const dpkValue = parseNumber(currentData.DPK);
      const tabunganValue = parseNumber(currentData.Tabungan);
      const giroValue = parseNumber(currentData.Giro);
      const depositoValue = parseNumber(currentData.Deposito);
      const casaValue = tabunganValue + giroValue;
      const casaPercentageValue = dpkValue > 0 ? (casaValue / dpkValue) * 100 : 0;

      // Format date untuk custom period
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
        // Growth targets
        target_dpk: parseNullableNumber(currentGrowthTargets.DPK),
        target_tabungan: parseNullableNumber(currentGrowthTargets.Tabungan),
        target_giro: parseNullableNumber(currentGrowthTargets.Giro),
        target_deposito: parseNullableNumber(currentGrowthTargets.Deposito),
        target_casa: parseNullableNumber(currentGrowthTargets.CASA),
        notes: notes || null
      };

      console.log('=== DATA TO SAVE ===');
      console.log('Data object:', dataToSave);
      console.log('Period:', periodKey);

      // Debug info untuk UI
      setDebugInfo(`Menyimpan untuk periode: ${periodKey}\nData: ${JSON.stringify(dataToSave, null, 2)}`);

      // Kirim ke backend menggunakan authService
      console.log('Calling authService.saveDPKData...');
      const response = await authService.saveDPKData(dataToSave);
      
      console.log('=== BACKEND RESPONSE ===');
      console.log('Response:', response);
      
      if (response.success) {
        console.log('✅ Data berhasil disimpan:', response.data);
        setDebugInfo(`✅ Data untuk periode ${periodKey} berhasil disimpan! Redirecting to dashboard...`);
        
        // Update local state
        if (selectedPeriod === 'custom' && !periodsList.includes(periodKey)) {
          const newPeriodsList = sortPeriods([...periodsList, periodKey]);
          setPeriodsList(newPeriodsList);
        }
        
        // Update allPeriodsData
        const updatedData = { ...allPeriodsData };
        updatedData[periodKey] = {
          DPK: currentData.DPK,
          Tabungan: currentData.Tabungan,
          Giro: currentData.Giro,
          Deposito: currentData.Deposito,
          growthTargets: currentGrowthTargets,
          notes: notes,
          date: formattedDate
        };
        setAllPeriodsData(updatedData);
        
        // Set selectedPeriod ke yang baru disimpan
        setSelectedPeriod(periodKey);
        
        // Success - redirect ke dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        console.error('❌ Save failed:', response.error);
        const errorMsg = response.error || response.message || 'Gagal menyimpan data';
        setError(`❌ Error: ${errorMsg}`);
        setDebugInfo(`❌ Server error response: ${JSON.stringify(response, null, 2)}`);
      }

    } catch (err) {
      console.error('❌ Catch error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        request: err.request
      });
      
      let errorMsg = 'Gagal menyimpan data. Silakan coba lagi.';
      if (err.response) {
        errorMsg = `Server error: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data) {
          errorMsg += ` - ${JSON.stringify(err.response.data)}`;
        }
      } else if (err.request) {
        errorMsg = 'Tidak ada response dari server. Periksa koneksi backend.';
      }
      
      setError(`❌ ${errorMsg}`);
      setDebugInfo(`❌ Error details: ${err.message}\n${err.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentData({
      DPK: '',
      Tabungan: '',
      Giro: '',
      Deposito: ''
    });
    setCurrentGrowthTargets({
      DPK: '',
      Tabungan: '',
      Giro: '',
      Deposito: '',
      CASA: ''
    });
    setNotes('');
    setError('');
    setDebugInfo('');
    setCustomDate({
      day: '31',
      month: '12',
      year: '2024'
    });
  };

  // Format untuk display saja (tidak untuk input)
  const formatDisplayNumber = (value) => {
    if (!value && value !== 0) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Get placeholder value untuk preview
  const getPlaceholderValue = (field) => {
    const examples = {
      'DPK': '389125',
      'Tabungan': '168107',
      'Giro': '107073',
      'Deposito': '113945'
    };
    return examples[field] || '0';
  };

  const renderInputTab = () => {
    const categories = [
      { field: 'DPK', label: 'DPK', icon: <DollarSign className="w-5 h-5" /> },
      { field: 'Tabungan', label: 'Tabungan', icon: <PiggyBank className="w-5 h-5" /> },
      { field: 'Giro', label: 'Giro', icon: <CreditCard className="w-5 h-5" /> },
      { field: 'Deposito', label: 'Deposito', icon: <Landmark className="w-5 h-5" /> }
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Input Data Aktual untuk Periode: {selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod}
        </h3>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Cara Input:</p>
              <p className="text-xs text-emerald-700 mt-1">
                Masukkan angka langsung tanpa tanda titik atau koma. Contoh: 350000 (untuk Rp 350 Juta)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(({ field, label, icon }) => (
            <div key={field} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-emerald-50 mr-3">
                  <div className="text-emerald-600">
                    {icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                  <p className="text-xs text-gray-500">Data Aktual (Rp. Juta)</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nilai (Rp. Juta)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={currentData[field] || ''}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      placeholder={`Contoh: ${getPlaceholderValue(field)}`}
                      className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Format Display:</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Rp {formatDisplayNumber(currentData[field] || '0')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <label className="block text-sm font-medium text-emerald-800 mb-2">
              <span className="flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                CASA (Auto-calculated)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600">
                Rp
              </span>
              <input
                type="text"
                value={formatDisplayNumber(calculateCASA())}
                readOnly
                className="pl-10 pr-3 py-3 w-full bg-white border border-emerald-300 rounded-lg text-emerald-700 font-medium"
              />
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              CASA = Tabungan + Giro
            </p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <label className="block text-sm font-medium text-emerald-800 mb-2">
              <span className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                % CASA (Auto-calculated)
              </span>
            </label>
            <input
              type="text"
              value={`${calculateCASAPercentage()}%`}
              readOnly
              className="px-3 py-3 w-full bg-white border border-emerald-300 rounded-lg text-emerald-700 font-medium text-center"
            />
            <p className="text-xs text-emerald-600 mt-2">
              % CASA = (CASA ÷ DPK) × 100%
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderGrowthTargetsTab = () => {
    const categories = [
      { field: 'DPK', label: 'Target DPK', icon: <DollarSign className="w-5 h-5" /> },
      { field: 'Tabungan', label: 'Target Tabungan', icon: <PiggyBank className="w-5 h-5" /> },
      { field: 'Giro', label: 'Target Giro', icon: <CreditCard className="w-5 h-5" /> },
      { field: 'Deposito', label: 'Target Deposito', icon: <Landmark className="w-5 h-5" /> },
      { field: 'CASA', label: 'Target CASA', icon: <Wallet className="w-5 h-5" /> }
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Input Target Growth untuk Periode: {selectedPeriod === 'custom' ? getCustomPeriodLabel() : selectedPeriod}
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Informasi Target Growth</p>
              <p className="text-xs text-blue-700 mt-1">
                Masukkan target resmi dari bisnis untuk setiap indikator. Target digunakan sebagai acuan pencapaian.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(({ field, label, icon }) => (
            <div key={field} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-blue-50 mr-3">
                  <div className="text-blue-600">
                    {icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                  <p className="text-xs text-gray-500">Target Growth (Rp. Juta)</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Target (Rp. Juta)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={currentGrowthTargets[field] || ''}
                      onChange={(e) => handleInputChange(field, e.target.value, true)}
                      placeholder="Contoh: 45000"
                      className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    {field === 'CASA' ? 'CASA Aktual:' : 'Aktual:'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    Rp {formatDisplayNumber(
                      field === 'CASA' ? calculateCASA() : (parseFloat(currentData[field]?.replace(',', '.') || 0))
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-emerald-600 hover:text-emerald-800 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Dashboard
          </button>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Input Data DPK & Target</h1>
            <div className="flex items-center text-gray-600 mt-1">
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                AREA JAKARTA SAHARJO
              </span>
              <span>KCP Jakarta Tempo Pavillion 2</span>
            </div>
          </motion.div>
        </div>

        {/* Error & Debug Messages */}
        {(error || debugInfo) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {error && (
              <div className="bg-red-50 border-red-200 border rounded-xl p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              </div>
            )}
            {debugInfo && (
              <div className="bg-yellow-50 border-yellow-200 border rounded-xl p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Debug Info:</p>
                    <pre className="text-xs text-gray-600 bg-white/50 p-3 rounded overflow-auto max-h-40">
                      {debugInfo}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

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
                <h2 className="text-xl font-semibold text-gray-900">Pilih Periode</h2>
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
                  
                  {/* Delete Button untuk periode yang sudah ada */}
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
            
            {/* Info tentang periode */}
            <div className="mt-4 text-sm text-gray-600">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Input Target Pada Data Yang Paling Baru Saja</h3>
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
                  Growth Target
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {renderTabs()}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
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

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
        >
          <div className="flex items-start">
            <Info className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">Format Periode & Urutan Data:</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <div>
                  <span className="font-medium">Format Periode:</span>
                  <ul className="ml-4 space-y-1">
                    <li>• Gunakan format: <code>DD-MMM-YYYY</code> (Contoh: 31-Dec-2024)</li>
                    <li>• Data akan otomatis diurutkan dari terlama ke terbaru di dashboard</li>
                    <li>• Pastikan input tanggal valid (hari 1-31, bulan 1-12, tahun 4 digit)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InputDPK;