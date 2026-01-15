import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertCircle
} from 'lucide-react';
import InputDPK from '../components/InputDPK';

const Input = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

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
                AREA JAKARTA SAHARJO
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

        {/* Input DPK Component */}
        <InputDPK onError={setError} />
      </div>
    </div>
  );
};

export default Input;