import React, { useState, useEffect } from 'react';
import { X, Save, Shield, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import { Button } from './Button';

export const ProfileModal = ({ onClose, userRole }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact_phone: '',
    agency_name: '',
    department: '',
    designation: '',
    employee_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setFormData({
          full_name: data.user.full_name || '',
          email: data.user.email || '',
          contact_phone: data.user.contact_phone || '',
          agency_name: data.user.agency_name || '',
          department: data.user.department || '',
          designation: data.user.designation || '',
          employee_id: data.user.employee_id || ''
        });
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load profile data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/auth/me', formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error(err);
      let errorText = 'Failed to update.';
      if (err.response) {
        if (typeof err.response.data === 'string') {
          errorText = `Server HTML error or Proxy Timeout: ${err.response.statusText}`;
        } else if (err.response.data?.error) {
          errorText = err.response.data.error;
        }
      } else {
        errorText = err.message;
      }
      setMessage({ type: 'error', text: errorText });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Your Profile</h3>
              <p className="text-xs text-slate-500">Employee ID: {formData.employee_id || '...'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message.text && (
          <div className={`px-6 py-3 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading...</div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input required name="full_name" value={formData.full_name} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2" />
                </div>
              </div>

              {userRole === 'CHA_AGENT' && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                    <input name="agency_name" value={formData.agency_name} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                    <input name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2" />
                  </div>
                </div>
              )}

              {userRole === 'GOVT_OFFICIAL' && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <input name="department" value={formData.department} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                    <input name="designation" value={formData.designation} onChange={handleChange} className="w-full border border-slate-200 rounded-xl px-4 py-2" />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
            <Button type="submit" disabled={loading || saving} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
