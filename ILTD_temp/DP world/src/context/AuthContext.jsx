import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const employeeId = localStorage.getItem('employee_id');
    if (token && role) {
      setUser({ role, employeeId });
    }
    setLoading(false);
  }, []);

  /**
   * Step 1: Submit employee_id + password → backend generates & returns OTP
   */
  const requestOtp = async (employee_id, password) => {
    try {
      const { data } = await api.post('/auth/login', { employee_id, password });
      // In dev: OTP is returned in the response body (mock mode)
      return { success: true, otp: data.otp, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      return { success: false, message: msg };
    }
  };

  /**
   * Step 2: Submit employee_id + otp → backend validates and returns JWT
   */
  const verifyOtp = async (employee_id, otp) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { employee_id, otp });
      const { token, user: userData } = data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('employee_id', userData.employee_id);

      setUser({
        role: userData.role,
        employeeId: userData.employee_id,
        name: userData.full_name,
      });

      // Navigate based on role
      if (userData.role === 'CHA_AGENT') navigate('/cha/dashboard');
      else if (userData.role === 'GOVT_OFFICIAL') navigate('/govt/dashboard');
      else if (userData.role === 'ADMIN') navigate('/admin/dashboard');

      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid or expired OTP.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('employee_id');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, requestOtp, verifyOtp, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
