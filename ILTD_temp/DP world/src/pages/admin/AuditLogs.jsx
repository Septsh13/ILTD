import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { RefreshCw } from 'lucide-react';
import api from '../../services/api';

const statusVariant = (code) => {
  if (code >= 500) return 'rejected';
  if (code >= 400) return 'pending';
  return 'approved';
};

const statusLabel = (code) => {
  if (code >= 500) return 'ERROR';
  if (code >= 400) return 'WARN';
  return 'OK';
};

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/audit-logs?limit=100');
      setLogs(data.audit_logs || data.logs || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brown-800">Audit Logs</h1>
          <p className="text-brown-500 mt-1">Complete log of all platform actions for compliance and review.</p>
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
        <CardHeader>
          <CardTitle>System Logs ({logs.length})</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-brown-400 py-8">Loading…</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-brown-400 py-8">No logs yet.</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.role ? <Badge>{log.role}</Badge> : <span className="text-brown-300 text-xs">Public</span>}
                  </TableCell>
                  <TableCell className="font-semibold">{log.action}</TableCell>
                  <TableCell className="font-mono text-sm text-brown-500">{log.ip_address || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(log.status_code)}>
                      {log.status_code} {statusLabel(log.status_code)}
                    </Badge>
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
