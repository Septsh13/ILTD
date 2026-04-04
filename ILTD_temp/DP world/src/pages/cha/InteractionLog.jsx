import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { MessageSquare, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const typeIcons = {
  upload: <FileText className="w-4 h-4" />,
  status: <MessageSquare className="w-4 h-4" />,
  flag: <AlertTriangle className="w-4 h-4" />,
};

const typeColors = {
  upload: 'bg-blue-50 text-blue-600',
  status: 'bg-emerald-50 text-emerald-600',
  flag: 'bg-red-50 text-red-600',
};

/** Maps backend action strings to an icon type */
const resolveType = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('upload') || a.includes('document') || a.includes('shipment')) return 'upload';
  if (a.includes('flag') || a.includes('suspicious')) return 'flag';
  return 'status';
};

export const ChaInteractionLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/audit-logs?limit=50');
      // audit-logs returns { logs, total } — fall back gracefully
      const rows = data.logs || data.data || data || [];
      setLogs(rows);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load interaction log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-800">Interaction Log</h1>
          <p className="text-brown-500 mt-1">Full timeline of interactions on your shipments and documents.</p>
        </div>
        <button
          onClick={fetchLogs}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-brown-400 py-8">Loading…</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-brown-400 py-8">No activity yet.</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const type = resolveType(log.action);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${typeColors[type]}`}>
                        {typeIcons[type]}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-brown-600">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold">{log.action}</TableCell>
                    <TableCell>
                      <Badge>{log.role || 'System'}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-brown-500">{log.ip_address || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={log.status_code < 400 ? 'approved' : 'rejected'}>
                        {log.status_code}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
