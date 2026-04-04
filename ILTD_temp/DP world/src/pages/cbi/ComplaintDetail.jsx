import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from "../../services/api";
import { ArrowLeft, AlertCircle, CheckCircle, Clock, Save, Loader } from 'lucide-react';

export function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [status, setStatus] = useState('');
  const [cbiMessage, setCbiMessage] = useState('');

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/cbi/complaints/${id}`);
      setComplaint(response.data);
      setStatus(response.data.status);
      setCbiMessage(response.data.cbi_message || '');
      setError(null);
    } catch (err) {
      console.error('Error fetching complaint:', err);
      setError('Failed to fetch complaint details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await axios.put(`/cbi/complaints/${id}`, {
        status,
        cbi_message: cbiMessage,
      });
      
      // Refresh complaint data
      await fetchComplaint();
      alert('Complaint updated successfully');
    } catch (err) {
      console.error('Error updating complaint:', err);
      alert('Failed to update complaint');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (st) => {
    const badgeClass = 'inline-block px-4 py-2 rounded-full text-sm font-medium';
    switch (st) {
      case 'OPEN':
        return <span className={`${badgeClass} bg-red-100 text-red-800`}>🔴 OPEN</span>;
      case 'UNDER_REVIEW':
        return <span className={`${badgeClass} bg-yellow-100 text-yellow-800`}>🟡 UNDER REVIEW</span>;
      case 'RESOLVED':
        return <span className={`${badgeClass} bg-green-100 text-green-800`}>✅ RESOLVED</span>;
      case 'CLOSED':
        return <span className={`${badgeClass} bg-gray-100 text-gray-800`}>⚪ CLOSED</span>;
      default:
        return <span className={`${badgeClass} bg-blue-100 text-blue-800`}>ℹ️ {st}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/cbi')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-center text-red-700">{error || 'Complaint not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/cbi')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{complaint.subject}</h1>
            <div className="flex items-center gap-3">
              {getStatusBadge(complaint.status)}
              <span className="text-blue-200">•</span>
              <span className="text-sm">Token: {complaint.tracking_token.slice(0, 16)}...</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Complaint Details */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 whitespace-pre-line">{complaint.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filed Date</label>
                  <p className="text-gray-900">{new Date(complaint.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                  <p className="text-gray-900">{new Date(complaint.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <hr className="my-8" />

            {/* Investigation Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Investigation</h2>

              {/* Status Update */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPEN">🔴 Open</option>
                  <option value="UNDER_REVIEW">🟡 Under Review</option>
                  <option value="RESOLVED">✅ Resolved</option>
                  <option value="CLOSED">⚪ Closed</option>
                </select>
              </div>

              {/* Investigation Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Investigation Notes</label>
                <p className="text-xs text-gray-600 mb-2">Internal notes visible only to CBI investigators</p>
                <textarea
                  value={cbiMessage}
                  onChange={(e) => setCbiMessage(e.target.value)}
                  placeholder="Enter your investigative findings, evidence summary, or next steps..."
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-family-mono"
                />
                <p className="text-xs text-gray-500 mt-2">{cbiMessage.length} characters</p>
              </div>

              {/* Auto-assignment notice */}
              {complaint._permissions?.can_edit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-xs text-blue-800">
                    ℹ️ Saving changes will auto-assign this complaint to you if not already assigned.
                  </p>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-indigo-800">
                <strong>🔐 Security Note:</strong> Complainant identity is encrypted and not displayed. Only authorized administrators can access the identity of this complainant through secure decryption channels.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                disabled={saving || !complaint._permissions?.can_edit}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/cbi')}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Info */}
        {complaint.cbi_assigned_to && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">
              <strong>Assigned to:</strong> {complaint.cbi_assigned_to ? `(You)` : 'Unassigned'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplaintDetail;
