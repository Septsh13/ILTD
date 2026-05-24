import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { AlertCircle, RefreshCw, Send, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const ChaShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // State for issues
  const [issueShipmentId, setIssueShipmentId] = useState(null);
  const [issueType, setIssueType] = useState('GENERAL'); // 'GENERAL' | 'BRIBERY'
  const [issueMessage, setIssueMessage] = useState('');

  const fetchShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/cha/shipments');
      setShipments(data.shipments || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipments(); }, []);

  const handleAcceptDecision = async (shipment_id) => {
    try {
      await api.post('/cha/accept', { shipment_id });
      alert('Decision accepted.');
      fetchShipments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept decision.');
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (issueType === 'BRIBERY') {
      navigate('/complaint', { state: { defaultShipmentId: issueShipmentId } });
      return;
    }

    if (!issueMessage) return alert('Message is required.');

    try {
      await api.post('/cha/reviews', {
        shipment_id: issueShipmentId,
        message: issueMessage
      });
      alert('General issue reported to Administration.');
      setIssueShipmentId(null);
      setIssueMessage('');
      fetchShipments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit issue.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">Shipments</h1>
          <p className="text-blue-500 mt-1">View shipments and review government decisions.</p>
        </div>
        <Button onClick={fetchShipments} variant="ghost" size="icon" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Shipment Status</TableHead>
              <TableHead>CBI / Prev Complaint</TableHead>
              <TableHead>Required Action / Decision</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-blue-400 py-8">Loading…</TableCell></TableRow>
            ) : shipments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-blue-400 py-8">No shipments available.</TableCell></TableRow>
            ) : (
              shipments.map((s) => (
                <React.Fragment key={s.shipment_id}>
                  <TableRow className="bg-white">
                    <TableCell className="font-semibold font-mono text-sm">{s.shipment_id}</TableCell>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'REJECTED' ? 'rejected' : s.status === 'APPROVED' ? 'approved' : 'pending'}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.complaint_status ? (
                        <div className="text-sm">
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <AlertCircle className="w-4 h-4"/> {s.complaint_status}
                          </span>
                          {s.cbi_message && <span className="block mt-1 text-xs text-amber-700">CBI: {s.cbi_message}</span>}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.status === 'REJECTED' && !s.is_cha_accepted && !s.complaint_status && !s.review_id ? (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 space-y-2">
                          <p className="text-red-800 font-medium text-xs uppercase tracking-wider">Govt Remarks: {s.remarks || 'No remarks provided.'}</p>
                          <p className="text-blue-800 font-semibold mb-2">Is this decision valid?</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleAcceptDecision(s.shipment_id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                            >
                              <Check className="w-3 h-3 mr-1" /> Accept Decision
                            </Button>
                            <Button 
                              size="sm" 
                              variant="danger" 
                              onClick={() => setIssueShipmentId(issueShipmentId === s.shipment_id ? null : s.shipment_id)}
                              className="flex-1"
                            >
                              <AlertCircle className="w-3 h-3 mr-1" /> Report Issue
                            </Button>
                          </div>
                        </div>
                      ) : s.is_cha_accepted ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1"><Check className="w-4 h-4"/> Accepted by you</span>
                      ) : s.complaint_status || s.review_id ? (
                        <span className="text-amber-700 font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Issue Reported</span>
                      ) : s.status === 'APPROVED' ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1"><Check className="w-4 h-4"/> Approved</span>
                      ) : (
                        <span className="text-gray-500 text-xs">Waiting for action</span>
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {/* Inline Issue Form */}
                  {issueShipmentId === s.shipment_id && (
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={5} className="p-4 border-t-0">
                        <form onSubmit={handleReportIssue} className="max-w-2xl bg-white p-4 rounded border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-3">Report Issue for {s.shipment_id}</h4>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-blue-700 mb-2">Select Issue Type</label>
                            <div className="space-x-4">
                              <label className="inline-flex items-center text-sm text-blue-800">
                                <input type="radio" className="form-radio text-blue-600" value="GENERAL" checked={issueType === 'GENERAL'} onChange={() => setIssueType('GENERAL')} />
                                <span className="ml-2">Report Issue / Clarification (To Admin)</span>
                              </label>
                              <label className="inline-flex items-center text-sm text-blue-800">
                                <input type="radio" className="form-radio text-red-600" value="BRIBERY" checked={issueType === 'BRIBERY'} onChange={() => setIssueType('BRIBERY')} />
                                <span className="ml-2 uppercase text-red-600 font-bold tracking-wider">Report Bribery / Corruption (To CBI)</span>
                              </label>
                            </div>
                          </div>
                          {issueType === 'GENERAL' ? (
                            <>
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-blue-700 mb-1">Message</label>
                                <textarea
                                  required
                                  value={issueMessage}
                                  onChange={(e) => setIssueMessage(e.target.value)}
                                  className="w-full border border-blue-200 rounded px-3 py-2 text-sm focus:ring-blue-500"
                                  placeholder="Provide details..."
                                  rows="3"
                                ></textarea>
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                  <Send className="w-4 h-4 mr-2" /> Submit to Admin
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setIssueShipmentId(null)}>Cancel</Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex gap-2 mt-4">
                              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                                <ExternalLink className="w-4 h-4 mr-2" /> Go to Complaints Portal
                              </Button>
                              <Button type="button" variant="ghost" onClick={() => setIssueShipmentId(null)}>Cancel</Button>
                            </div>
                          )}
                        </form>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
