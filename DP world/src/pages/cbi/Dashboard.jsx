import React, { useState, useEffect } from 'react';
import axios from "../../services/api";
import { AlertCircle, CheckCircle, Clock, FileText, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CBIDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, [statusFilter, page]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/cbi/complaints', {
        params: {
          status: statusFilter,
          page,
          limit: 10,
        },
      });
      setComplaints(response.data.complaints);
      setError(null);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/cbi/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const getStatusIcon = (status) => {
    const iconClass = 'w-5 h-5';
    switch (status) {
      case 'OPEN':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'UNDER_REVIEW':
        return <Clock className={`${iconClass} text-yellow-500`} />;
      case 'RESOLVED':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'CLOSED':
        return <FileText className={`${iconClass} text-gray-500`} />;
      default:
        return <FileText className={`${iconClass} text-blue-500`} />;
    }
  };

  const getStatusBadge = (status) => {
    const badgeClass = 'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 w-fit';
    switch (status) {
      case 'OPEN':
        return <span className={`${badgeClass} bg-red-100 text-red-800`}>{getStatusIcon(status)} OPEN</span>;
      case 'UNDER_REVIEW':
        return <span className={`${badgeClass} bg-yellow-100 text-yellow-800`}>{getStatusIcon(status)} UNDER REVIEW</span>;
      case 'RESOLVED':
        return <span className={`${badgeClass} bg-green-100 text-green-800`}>{getStatusIcon(status)} RESOLVED</span>;
      case 'CLOSED':
        return <span className={`${badgeClass} bg-gray-100 text-gray-800`}>{getStatusIcon(status)} CLOSED</span>;
      default:
        return <span className={`${badgeClass} bg-blue-100 text-blue-800`}>{getStatusIcon(status)}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CBI Investigation Dashboard</h1>
          <p className="text-gray-600">Review and investigate complaints anonymously</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Open Cases</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.by_status?.OPEN || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Under Review</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.by_status?.UNDER_REVIEW || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Resolved</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.by_status?.RESOLVED || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Assigned to Me</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.assigned_to_me || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Cases</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Loading complaints...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No complaints found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Assigned To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Investigation Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Filed Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                          {complaint.subject}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(complaint.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {complaint.assigned_to_name || <span className="text-gray-400">Unassigned</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {complaint.cbi_message || <span className="text-gray-400 italic">No notes</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            to={`/cbi/complaints/${complaint.id}`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page <span className="font-medium">{page}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>🔐 Privacy Notice:</strong> Complainant identities are encrypted and not displayed here. Only authorized administrators can decrypt complainant information. Your investigation is anonymous and secure.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CBIDashboard;
