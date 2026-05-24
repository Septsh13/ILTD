import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const roleRoutes = {
  ADMIN: '/admin/dashboard',
  CHAPTER_PRESIDENT: '/president/dashboard',
  NORMAL_USER: '/user/dashboard',
  USER: '/user/dashboard',
};

const selectedRoleMatches = (selectedRole, actualRole) => {
  if (!selectedRole) return true;
  if (selectedRole === 'ADMIN') return actualRole === 'ADMIN';
  if (selectedRole === 'USER') return actualRole === 'NORMAL_USER' || actualRole === 'CHAPTER_PRESIDENT' || actualRole === 'USER';
  return selectedRole === actualRole;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const employeeId = localStorage.getItem('employee_id');
    const name = localStorage.getItem('full_name');
    if (token && role) {
      setUser({ role, employeeId, name });
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
      return { success: true, otp: data.otp, employeeId: data.employee_id || employee_id, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      return { success: false, message: msg };
    }
  };

  /**
   * Step 2: Submit employee_id + otp → backend validates and returns JWT
   */
  const verifyOtp = async (employee_id, otp, selectedRole) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { employee_id, otp });
      const { token, user: userData } = data;

      if (!token || !userData) {
        return { success: false, message: 'Invalid response from server. Please try again.' };
      }

      if (!selectedRoleMatches(selectedRole, userData.role)) {
        return { success: false, message: `This account is ${userData.role === 'ADMIN' ? 'an admin' : 'a user'} account. Choose the matching role and try again.` };
      }

      localStorage.setItem('token', token);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('employee_id', userData.employee_id);
      localStorage.setItem('full_name', userData.full_name);

      setUser({
        role: userData.role,
        employeeId: userData.employee_id,
        name: userData.full_name,
      });

      setTimeout(() => navigate(roleRoutes[userData.role] || '/user/dashboard'), 100);

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
    localStorage.removeItem('full_name');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, requestOtp, verifyOtp, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
