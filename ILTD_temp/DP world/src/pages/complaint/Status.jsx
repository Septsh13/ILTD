import React, { useState } from 'react';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const ComplaintStatus = () => {
  const [trackingToken, setTrackingToken] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setComplaint(null);
    setLoading(true);
    try {
      const { data } = await api.get(`/complaints/status?tracking_token=${encodeURIComponent(trackingToken)}`);
      setComplaint(data.complaint || data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No complaint found for that tracking token.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch complaint status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (status) => {
    if (!status) return 'pending';
    const s = status.toUpperCase();
    if (s === 'RESOLVED' || s === 'CLOSED') return 'resolved';
    if (s === 'UNDER_REVIEW') return 'pending';
    return 'pending';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-800">Track My Complaint</h1>
          <p className="text-brown-500 mt-1">Enter your tracking token to check the status of your grievance.</p>
        </div>
        <Button onClick={() => window.location.href = '/complaint/new'}>
          File New Complaint
        </Button>
      </div>

      {/* Search form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-400" />
              <input
                type="text"
                value={trackingToken}
                onChange={(e) => setTrackingToken(e.target.value)}
                placeholder="Enter your complaint tracking token…"
                className="w-full pl-10 pr-4 py-3 border border-brown-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brown-500 placeholder:text-brown-300"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Result */}
      {complaint && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              <h2 className="text-lg font-bold text-brown-800">Complaint Found</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-brown-500 uppercase tracking-wide text-xs">Subject</p>
                <p className="text-brown-800 mt-1">{complaint.subject}</p>
              </div>
              <div>
                <p className="font-semibold text-brown-500 uppercase tracking-wide text-xs">Status</p>
                <div className="mt-1">
                  <Badge variant={statusVariant(complaint.status)}>{complaint.status}</Badge>
                </div>
              </div>
              <div>
                <p className="font-semibold text-brown-500 uppercase tracking-wide text-xs">Filed</p>
                <p className="text-brown-800 mt-1">{new Date(complaint.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-semibold text-brown-500 uppercase tracking-wide text-xs">Last Updated</p>
                <p className="text-brown-800 mt-1">{new Date(complaint.updated_at).toLocaleDateString()}</p>
              </div>
              {complaint.admin_notes && (
                <div className="col-span-2 md:col-span-3">
                  <p className="font-semibold text-brown-500 uppercase tracking-wide text-xs">Admin Notes</p>
                  <p className="text-brown-800 mt-1">{complaint.admin_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
