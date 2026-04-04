import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export const GovtDashboard = () => {
  const [metrics, setMetrics] = useState({ pendingShipments: 0, approvedShipments: 0, rejectedShipments: 0, totalProcessed: 0 });
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});

  const fetchData = async () => {
    try {
      const { data: summaryData } = await api.get('/govt/summary');
      setMetrics(summaryData.metrics);
      
      const { data: shipmentsData } = await api.get('/govt/shipments');
      setShipments(shipmentsData.shipments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (shipmentId, decision) => {
    const rmk = remarks[shipmentId];
    if (decision === 'REJECTED' && !rmk) {
      return alert('Please provide remarks when rejecting.');
    }
    try {
      await api.put(`/govt/shipments/${shipmentId}`, { decision, remarks: rmk || '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${decision.toLowerCase()} shipment.`);
    }
  };

  const handleRemarkChange = (id, val) => {
    setRemarks(prev => ({ ...prev, [id]: val }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-800">Govt Official Panel</h1>
        <p className="text-blue-500 mt-1">Review and approve shipments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6 bg-slate-50"><h3 className="text-blue-500 text-sm font-bold uppercase tracking-wide">Pending Review</h3><p className="text-3xl font-bold text-blue-800 mt-2">{loading ? '...' : metrics.pendingShipments}</p></CardContent></Card>
        <Card><CardContent className="p-6 bg-slate-50"><h3 className="text-blue-500 text-sm font-bold uppercase tracking-wide">Approved</h3><p className="text-3xl font-bold text-emerald-600 mt-2">{loading ? '...' : metrics.approvedShipments}</p></CardContent></Card>
        <Card><CardContent className="p-6 bg-slate-50"><h3 className="text-blue-500 text-sm font-bold uppercase tracking-wide">Rejected</h3><p className="text-3xl font-bold text-red-600 mt-2">{loading ? '...' : metrics.rejectedShipments}</p></CardContent></Card>
        <Card><CardContent className="p-6 bg-slate-50"><h3 className="text-blue-500 text-sm font-bold uppercase tracking-wide">Total Processed</h3><p className="text-3xl font-bold text-blue-800 mt-2">{loading ? '...' : metrics.totalProcessed}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-white">
          <h3 className="font-semibold text-blue-800">All Shipments</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Decisions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : shipments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">No shipments found.</TableCell></TableRow>
            ) : shipments.map((shipment) => (
              <TableRow key={shipment.id} className="bg-slate-50/20">
                <TableCell className="font-semibold">{shipment.id}</TableCell>
                <TableCell>{shipment.title}</TableCell>
                <TableCell>
                  <span className="font-mono text-blue-600 text-sm font-medium">
                    {new Date(shipment.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={shipment.status === 'REJECTED' ? 'rejected' : shipment.status === 'APPROVED' ? 'approved' : 'pending'}>
                    {shipment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {shipment.status === 'PENDING' ? (
                    <div className="flex justify-end items-center space-x-2">
                      <input 
                        type="text"
                        placeholder="Remarks..."
                        value={remarks[shipment.id] || ''}
                        onChange={(e) => handleRemarkChange(shipment.id, e.target.value)}
                        className="border border-blue-200 rounded px-2 py-1 text-sm max-w-[150px]"
                      />
                      <Button variant="danger" size="icon" title="Reject" onClick={() => handleDecision(shipment.id, 'REJECTED')}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" size="icon" title="Approve" onClick={() => handleDecision(shipment.id, 'APPROVED')}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-blue-400">{shipment.remarks || 'No remarks'}</span>
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
