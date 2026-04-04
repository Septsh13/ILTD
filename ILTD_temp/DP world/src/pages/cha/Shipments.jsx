import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export const ChaShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const fetchShipments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/cha/shipments?page=${page}&limit=20`);
      setShipments(data.shipments || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipments(); }, [page]);

  const handleMarkSuspicious = async (shipment_id) => {
    const note = window.prompt('Enter a note for flagging this shipment (optional):');
    if (note === null) return; // cancelled
    try {
      await api.post('/cha/mark-suspicious', { shipment_id, note });
      fetchShipments();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not flag shipment.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-800">Shipments</h1>
          <p className="text-brown-500 mt-1">Manage and track your shipment clearances.</p>
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
              <TableHead>Tracking #</TableHead>
              <TableHead>Shipper</TableHead>
              <TableHead>Origin → Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Suspicious</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-brown-400 py-8">Loading…</TableCell>
              </TableRow>
            ) : shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-brown-400 py-8">No shipments found.</TableCell>
              </TableRow>
            ) : (
              shipments.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold font-mono text-sm">{s.tracking_number}</TableCell>
                  <TableCell>{s.shipper_name}</TableCell>
                  <TableCell className="text-sm">{s.origin_port} → {s.destination_port}</TableCell>
                  <TableCell>
                    <Badge variant={s.status?.toLowerCase()}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.is_suspicious ? (
                      <span className="text-red-500 font-semibold text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    ) : (
                      <span className="text-brown-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" title="View Details">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!s.is_suspicious && (
                      <Button
                        variant="danger"
                        size="icon"
                        title="Mark as Suspicious"
                        onClick={() => handleMarkSuspicious(s.id)}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {/* Simple pagination */}
      <div className="flex justify-center gap-3">
        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
        <span className="text-sm text-brown-500 self-center">Page {page}</span>
        <Button variant="ghost" onClick={() => setPage(p => p + 1)}>Next →</Button>
      </div>
    </div>
  );
};
