import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export const GovtDashboard = () => {
  const [metrics, setMetrics] = useState({ pendingDocs: 0, approvedDocs: 0, rejectedDocs: 0, totalProcessed: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReasons, setRejectReasons] = useState({});

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/govt/summary');
      setMetrics(data.metrics);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleApprove = async (documentId) => {
    try {
      await api.post('/govt/approve', { document_id: documentId });
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve document.');
    }
  };

  const handleReject = async (documentId) => {
    const reason = rejectReasons[documentId];
    if (!reason) {
      return alert('Please select a rejection reason.');
    }
    try {
      await api.post('/govt/reject', { document_id: documentId, rejection_reason: reason });
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject document.');
    }
  };

  const handleReasonChange = (docId, val) => {
    setRejectReasons(prev => ({ ...prev, [docId]: val }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-800">Govt Official Review Panel</h1>
        <p className="text-brown-500 mt-1">Review assignments and manage SLA performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><h3 className="text-brown-500 text-sm font-bold uppercase tracking-wide">Pending Review</h3><p className="text-3xl font-bold text-brown-800 mt-2">{loading ? '...' : metrics.pendingDocs}</p></CardContent></Card>
        <Card><CardContent className="p-6"><h3 className="text-brown-500 text-sm font-bold uppercase tracking-wide">Approved</h3><p className="text-3xl font-bold text-emerald-600 mt-2">{loading ? '...' : metrics.approvedDocs}</p></CardContent></Card>
        <Card><CardContent className="p-6"><h3 className="text-brown-500 text-sm font-bold uppercase tracking-wide">Rejected</h3><p className="text-3xl font-bold text-red-600 mt-2">{loading ? '...' : metrics.rejectedDocs}</p></CardContent></Card>
        <Card><CardContent className="p-6"><h3 className="text-brown-500 text-sm font-bold uppercase tracking-wide">Total Processed</h3><p className="text-3xl font-bold text-brown-800 mt-2">{loading ? '...' : metrics.totalProcessed}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-6 border-b border-brown-100 flex items-center justify-between bg-beige-50/50">
          <h3 className="font-semibold text-brown-800">Recent Assignments</h3>
          <Badge className="bg-brown-600 text-white">{metrics.pendingDocs} Pending</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Decisions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : recentActivity.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">No recent documents.</TableCell></TableRow>
            ) : recentActivity.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-semibold">{doc.tracking_number}</TableCell>
                <TableCell>{doc.document_type}</TableCell>
                <TableCell>
                  <span className="font-mono text-brown-600 text-sm font-medium">
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell><Badge variant={doc.status === 'REJECTED' ? 'rejected' : doc.status === 'APPROVED' ? 'approved' : 'pending'}>{doc.status}</Badge></TableCell>
                <TableCell className="text-right space-x-2">
                  {doc.status === 'PENDING' ? (
                    <>
                      <select 
                        value={rejectReasons[doc.id] || ''}
                        onChange={(e) => handleReasonChange(doc.id, e.target.value)}
                        className="border border-brown-200 bg-white rounded-lg px-2 py-1.5 text-sm mr-2 focus:ring-brown-500 max-w-[150px]"
                      >
                        <option value="">Reject Reason...</option>
                        <option value="INCOMPLETE_DOCUMENTATION">Incomplete Docs</option>
                        <option value="MISSING_SIGNATURE">Missing Signature</option>
                        <option value="DATA_MISMATCH">Data Mismatch</option>
                        <option value="POLICY_VIOLATION">Policy Violation</option>
                        <option value="FRAUDULENT_CLAIM">Fraud</option>
                      </select>
                      <Button variant="danger" size="icon" title="Reject" onClick={() => handleReject(doc.id)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" size="icon" title="Approve" onClick={() => handleApprove(doc.id)}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-brown-400">Processed</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
