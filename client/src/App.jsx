import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Input from './pages/Input';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';

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
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Fallback untuk 404 */}
        <Route path="*" element={
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>404 - Page Not Found</h1>
            <p>Return to <a href="/dashboard">Dashboard</a></p>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;