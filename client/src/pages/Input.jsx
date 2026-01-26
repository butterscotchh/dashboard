import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertCircle,
  BarChart2,
  TrendingUp,
  Banknote,
  DollarSign,
  LineChart,
  AlertTriangle,
  Percent
} from 'lucide-react';
import InputDPK from '../components/InputDPK';
import InputPBY from '../components/InputPBY';
import InputKol2 from '../components/InputKol2';
import InputNPF from '../components/InputNPF';

const Input = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dpk'); // 'dpk', 'pby', 'kol2', atau 'npf'

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-emerald-600 hover:text-emerald-800 mb-3 md:mb-4 transition-colors duration-200 text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Kembali ke Dashboard
          </button>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Input Data & Target</h1>
            <div className="flex flex-wrap items-center text-gray-600 mt-1 gap-2">
              <span className="bg-emerald-100 text-emerald-800 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium">
                AREA JAKARTA SUDIRMAN
              </span>
              <span className="text-sm md:text-base">KCP Jakarta Tempo Pavillion 2</span>
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 md:mb-6"
          >
            <div className="bg-red-50 border-red-200 border rounded-xl p-3 md:p-4">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-400 mt-0.5 mr-2 md:mr-3 flex-shrink-0" />
                <p className="text-xs md:text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation untuk pilih DPK, PBY, Kol2, atau NPF */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 md:mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* DPK Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-sm border border-white/20 p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 rounded-lg bg-emerald-50 mr-2 md:mr-3 flex-shrink-0">
                  <Banknote className="w-4 h-4 md:w-6 md:h-6 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900 truncate">DPK</h3>
                  <p className="text-xs md:text-sm text-gray-600 truncate">Dana Pihak Ketiga</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('dpk')}
                className={`w-full py-2 px-3 md:py-3 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'dpk'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeTab === 'dpk' ? 'Aktif' : 'Input DPK'}
              </button>
            </div>

            {/* PBY Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-sm border border-white/20 p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 rounded-lg bg-blue-50 mr-2 md:mr-3 flex-shrink-0">
                  <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900 truncate">PBY</h3>
                  <p className="text-xs md:text-sm text-gray-600 truncate">Pembiayaan</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('pby')}
                className={`w-full py-2 px-3 md:py-3 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'pby'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeTab === 'pby' ? 'Aktif' : 'Input PBY'}
              </button>
            </div>

            {/* Kol2 Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-sm border border-white/20 p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 rounded-lg bg-purple-50 mr-2 md:mr-3 flex-shrink-0">
                  <LineChart className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900 truncate">Kol. 2</h3>
                  <p className="text-xs md:text-sm text-gray-600 truncate">Data Kol. 2</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('kol2')}
                className={`w-full py-2 px-3 md:py-3 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'kol2'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeTab === 'kol2' ? 'Aktif' : 'Input Kol. 2'}
              </button>
            </div>

            {/* NPF Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-sm border border-white/20 p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 rounded-lg bg-red-50 mr-2 md:mr-3 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900 truncate">NPF</h3>
                  <p className="text-xs md:text-sm text-gray-600 truncate">Non-Performing</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('npf')}
                className={`w-full py-2 px-3 md:py-3 md:px-4 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'npf'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeTab === 'npf' ? 'Aktif' : 'Input NPF'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Component Selection */}
        <div className="mb-6 md:mb-8">
          {activeTab === 'dpk' ? (
            <motion.div
              key="dpk"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InputDPK onError={setError} />
            </motion.div>
          ) : activeTab === 'pby' ? (
            <motion.div
              key="pby"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InputPBY onError={setError} />
            </motion.div>
          ) : activeTab === 'kol2' ? (
            <motion.div
              key="kol2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InputKol2 onError={setError} />
            </motion.div>
          ) : (
            <motion.div
              key="npf"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InputNPF onError={setError} />
            </motion.div>
          )}
        </div>

        {/* Info Box - Langkah Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mt-0.5 mr-2 md:mr-3 flex-shrink-0" />
            <div className="w-full">
              <h3 className="text-sm md:text-base font-medium text-blue-900 mb-4 md:mb-6">
                Langkah-Langkah Input Data:
              </h3>
              
              {/* Langkah untuk SEMUA Segment */}
              <div className="space-y-3 md:space-y-4">
                {/* Langkah 1 - UMUM */}
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    1
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-blue-800">Pilih Periode</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Pilih periode yang sudah ada atau buat custom periode baru
                    </p>
                  </div>
                </div>
                
                {/* Langkah 2 - UMUM */}
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    2
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-blue-800">Input Data Aktual</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Isi semua field data aktual sesuai segment yang dipilih
                    </p>
                  </div>
                </div>
                
                {/* Langkah 3 - DPK */}
                <div className="flex items-start">
                  <div className="bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    DPK
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-emerald-800">Input Data DPK</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Isi Tabungan, Giro, Deposito → Sistem otomatis menghitung DPK, CASA, %CASA
                    </p>
                  </div>
                </div>
                
                {/* Langkah 3 - PBY */}
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    PBY
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-blue-800">Input Data PBY</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Isi Griya, Oto, Mitraguna, Pensiun → Sistem otomatis menghitung CFG
                    </p>
                  </div>
                </div>
                
                {/* Langkah 3 - KOL.2 */}
                <div className="flex items-start">
                  <div className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    KOL.2
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-purple-800">Input Data Kol.2</h4>
                    <p className="text-xs text-purple-700 mt-0.5">
                      Isi Griya, Oto, Mitraguna, Pensiun, Cicil Emas → Sistem otomatis menghitung CFG, PWG, Kol.2
                    </p>
                  </div>
                </div>
                
                {/* Langkah 3 - NPF */}
                <div className="flex items-start">
                  <div className="bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    NPF
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-red-800">Input Data NPF</h4>
                    <p className="text-xs text-red-700 mt-0.5">
                      Isi NPF per segment → Sistem otomatis menghitung CFG, PWG, NPF
                    </p>
                  </div>
                </div>
                
                {/* Langkah 4 - UMUM */}
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    4
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-blue-800">Input Target (DPK & PBY)</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Untuk DPK & PBY: Isi target per komponen
                    </p>
                  </div>
                </div>
                
                {/* Langkah 5 - UMUM */}
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    5
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-blue-800">Input Catatan (Opsional)</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Tambahkan catatan atau keterangan jika diperlukan
                    </p>
                  </div>
                </div>
                
                {/* Langkah 6 - UMUM */}
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 mt-0.5 flex-shrink-0">
                    6
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-blue-800">Simpan Data</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Klik "Simpan Data" untuk menyimpan
                    </p>
                  </div>
                </div>
                
                {/* Catatan Penting */}
                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-blue-200">
                  <h4 className="text-xs font-medium text-blue-900 mb-1 md:mb-2">Catatan Penting:</h4>
                  <ul className="text-xs text-blue-700 space-y-0.5 md:space-y-1">
                    <li>• Gunakan angka tanpa titik/koma (Contoh: 350000)</li>
                    <li>• Untuk edit data: Pilih periode yang sudah ada → Update data</li>
                    <li>• Untuk hapus data: Pilih periode → Klik tombol Hapus</li>
                    <li>• Setelah simpan, sistem akan redirect ke Dashboard</li>
                    <li>• Pastikan periode tidak duplikat</li>
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

export default Input;