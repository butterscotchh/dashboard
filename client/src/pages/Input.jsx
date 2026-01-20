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
  LineChart
} from 'lucide-react';
import InputDPK from '../components/InputDPK';
import InputPBY from '../components/InputPBY';
import InputKol2 from '../components/InputKol2';

const Input = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dpk'); // 'dpk', 'pby', atau 'kol2'

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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Input Data & Target</h1>
            <div className="flex items-center text-gray-600 mt-1">
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                AREA JAKARTA SUDIRMAN
              </span>
              <span>KCP Jakarta Tempo Pavillion 2</span>
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-red-50 border-red-200 border rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation untuk pilih DPK, PBY, atau Kol2 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* DPK Card */}
            <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-emerald-50 mr-3">
                  <Banknote className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">DPK</h3>
                  <p className="text-sm text-gray-600">Dana Pihak Ketiga</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('dpk')}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === 'dpk'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeTab === 'dpk' ? 'Sedang Aktif' : 'Input DPK'}
              </button>
            </div>

            {/* PBY Card */}
            <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-blue-50 mr-3">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">PBY</h3>
                  <p className="text-sm text-gray-600">Pembiayaan</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('pby')}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === 'pby'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeTab === 'pby' ? 'Sedang Aktif' : 'Input PBY'}
              </button>
            </div>

            {/* Kol2 Card */}
            <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-purple-50 mr-3">
                  <LineChart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Kol. 2</h3>
                  <p className="text-sm text-gray-600">Data Kol. 2</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('kol2')}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === 'kol2'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeTab === 'kol2' ? 'Sedang Aktif' : 'Input Kol. 2'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Component Selection */}
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
        ) : (
          <motion.div
            key="kol2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InputKol2 onError={setError} />
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8"
        >
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">Perhatian:</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <div>
                  <span className="font-medium">Data DPK:</span>
                  <ul className="ml-4 space-y-1">
                    <li>• Input data Tabungan, Giro, dan Deposito</li>
                    <li>• DPK, CASA, dan %CASA akan dihitung otomatis</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Data PBY:</span>
                  <ul className="ml-4 space-y-1">
                    <li>• Input data Griya, Oto, Mitraguna, dan Pensiun</li>
                    <li>• CFG akan dihitung otomatis</li>
                    <li>• Dengan input Cair & Run Off</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Data Kol. 2:</span>
                  <ul className="ml-4 space-y-1">
                    <li>• Input data aktual saja (tanpa Cair & Run Off)</li>
                    <li>• Sederhana dan cepat</li>
                    <li>• CFG, PWG, PBY dihitung otomatis</li>
                  </ul>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  <em>Pastikan periode tidak duplikat untuk menghindari bug data.</em>
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