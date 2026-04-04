import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Flag, Eye, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [flagLoading, setFlagLoading] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/all-complaints?limit=50');
      setComplaints(data.complaints || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleFlagUser = async (userId) => {
    if (!userId) { alert('No related user to flag.'); return; }
    const reason = window.prompt('Reason for flagging this user:');
    if (!reason) return;

    setFlagLoading(userId);
    try {
      await api.post('/admin/flag-user', { user_id: userId, flag: true, reason });
      alert('User flagged successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not flag user.');
    } finally {
      setFlagLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-800">Complaints Management</h1>
          <p className="text-brown-500 mt-1">Review and manage all complaints filed on the platform.</p>
        </div>
        <button
          onClick={fetchComplaints}
          className="p-2 rounded-lg hover:bg-brown-50 text-brown-400 hover:text-brown-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Token</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Related User</TableHead>
              <TableHead>Date Filed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-brown-400 py-8">Loading…</TableCell>
              </TableRow>
            ) : complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-brown-400 py-8">No complaints found.</TableCell>
              </TableRow>
            ) : (
              complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold font-mono text-sm">{c.tracking_token?.slice(0, 12)}…</TableCell>
                  <TableCell>{c.subject}</TableCell>
                  <TableCell>{c.related_user_id?.slice(0, 8) || '—'}</TableCell>
                  <TableCell className="text-brown-500 text-sm">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      c.status === 'RESOLVED' ? 'resolved' :
                      c.status === 'CLOSED' ? 'approved' :
                      'pending'
                    }>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" title="View" onClick={() => setViewModal(c)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="icon"
                      title="Flag Related User"
                      disabled={flagLoading === c.related_user_id}
                      onClick={() => handleFlagUser(c.related_user_id)}
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title={`Complaint Details`}>
        {viewModal && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-brown-600">Tracking Token:</span>
                <p className="font-mono text-brown-800 text-xs break-all">{viewModal.tracking_token}</p>
              </div>
              <div>
                <span className="font-semibold text-brown-600">Status:</span>
                <p><Badge variant={viewModal.status === 'RESOLVED' ? 'resolved' : 'pending'}>{viewModal.status}</Badge></p>
              </div>
              <div>
                <span className="font-semibold text-brown-600">Filed:</span>
                <p className="text-brown-800">{new Date(viewModal.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-semibold text-brown-600">Related User:</span>
                <p className="font-mono text-brown-800 text-xs">{viewModal.related_user_id || 'None'}</p>
              </div>
            </div>
            <div>
              <span className="font-semibold text-brown-600">Subject:</span>
              <p className="text-brown-800">{viewModal.subject}</p>
            </div>
            <div>
              <span className="font-semibold text-brown-600">Description:</span>
              <p className="text-brown-800">{viewModal.description}</p>
            </div>
            {viewModal.admin_notes && (
              <div>
                <span className="font-semibold text-brown-600">Admin Notes:</span>
                <p className="text-brown-800">{viewModal.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
