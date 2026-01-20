import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Input from './pages/Input'; // Tambah import Input
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile'; // Tambah import Profile

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/input" 
          element={
            <ProtectedRoute>
              <Input />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile"  // TAMBAH ROUTE PROFILE
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;