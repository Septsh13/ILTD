import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import api from '../../services/api';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeComplaints: 0, flaggedUsers: 0, totalShipments: 0 });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [summaryRes, complaintsRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/admin/all-complaints?limit=5')
      ]);

      setMetrics(summaryRes.data.metrics);
      setComplaints(complaintsRes.data.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-800">Admin Dashboard</h1>
        <p className="text-brown-500 mt-1">Platform wide analytics, user management, and complaints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><h3 className="text-brown-500 text-sm font-bold uppercase tracking-wide">Total Users</h3><p className="text-3xl font-bold text-brown-800 mt-2">{loading ? '...' : metrics.totalUsers}</p></CardContent></Card>
        <Card><CardContent className="p-6"><h3 className="text-brown-500 text-sm font-bold uppercase tracking-wide">Total Shipments</h3><p className="text-3xl font-bold text-brown-800 mt-2">{loading ? '...' : metrics.totalShipments}</p></CardContent></Card>
        <Card><CardContent className="p-6"><h3 className="text-brown-500 text-sm font-bold uppercase tracking-wide">Active Complaints</h3><p className="text-3xl font-bold text-red-600 mt-2">{loading ? '...' : metrics.activeComplaints}</p></CardContent></Card>
        <Card><CardContent className="p-6"><h3 className="text-brown-500 text-sm font-bold uppercase tracking-wide">Flagged Users</h3><p className="text-3xl font-bold text-amber-600 mt-2">{loading ? '...' : metrics.flaggedUsers}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Complaints</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Complaint Trk</TableHead>
              <TableHead>Target Officer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : complaints.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4">No complaints found.</TableCell></TableRow>
            ) : complaints.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold">{c.tracking_token}</TableCell>
                <TableCell>{c.related_user_name || 'N/A'}</TableCell>
                <TableCell><Badge>{c.status}</Badge></TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
