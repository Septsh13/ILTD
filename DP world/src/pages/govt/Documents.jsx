import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const REJECTION_REASONS = [
  'INCOMPLETE_DOCUMENTATION',
  'POLICY_VIOLATION',
  'DUPLICATE_SUBMISSION',
  'FRAUDULENT_CLAIM',
  'MISSING_SIGNATURE',
];

export const GovtDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/govt/assigned-documents?limit=50');
      setDocuments(data.documents || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load assigned documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleApprove = async (document_id) => {
    setActionLoading(document_id + '_approve');
    try {
      await api.post('/govt/approve', { document_id, notes: 'Approved via portal' });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.error || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (document_id) => {
    const reason = window.prompt(
      `Select rejection reason:\n${REJECTION_REASONS.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nEnter the reason exactly as shown:`
    );
    if (!reason) return;

    setActionLoading(document_id + '_reject');
    try {
      await api.post('/govt/reject', {
        document_id,
        rejection_reason: reason.trim().toUpperCase().replace(/ /g, '_'),
        notes: '',
      });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.error || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-800">Assigned Documents</h1>
          <p className="text-brown-500 mt-1">All documents assigned to you for review and clearance.</p>
        </div>
        <button
          onClick={fetchDocuments}
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
          <CardTitle>Document Queue</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc ID</TableHead>
              <TableHead>Shipment</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-brown-400 py-8">Loading…</TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-brown-400 py-8">No documents assigned to you.</TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-semibold font-mono text-sm">{doc.id?.slice(0, 8)}…</TableCell>
                  <TableCell className="font-mono text-sm">{doc.shipment_id?.slice(0, 8)}…</TableCell>
                  <TableCell>{doc.uploaded_by_name || doc.uploaded_by?.slice(0, 8)}</TableCell>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell className="text-brown-500 text-sm">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.status?.toLowerCase()}>{doc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" title="View">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {doc.status === 'PENDING' && (
                      <>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          size="icon"
                          title="Approve"
                          disabled={actionLoading === doc.id + '_approve'}
                          onClick={() => handleApprove(doc.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="icon"
                          title="Reject"
                          disabled={actionLoading === doc.id + '_reject'}
                          onClick={() => handleReject(doc.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
