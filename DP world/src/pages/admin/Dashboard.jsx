import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import api from '../../services/api';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeComplaints: 0, flaggedUsers: 0, totalShipments: 0 });
  const [loading, setLoading] = useState(true);
  const [newShipment, setNewShipment] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/summary');
      setMetrics(data.metrics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    if (!newShipment.title || !newShipment.description) return alert('Title and description required.');
    
    setCreating(true);
    try {
      await api.post('/admin/shipments', newShipment);
      alert('Shipment created successfully!');
      setNewShipment({ title: '', description: '' });
      fetchData(); // Refresh metrics
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create shipment.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-800">Admin Dashboard</h1>
        <p className="text-blue-500 mt-1">Manage shipments and oversee operations across the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6 bg-slate-50"><h3 className="text-blue-500 text-sm font-bold uppercase tracking-wide">Total Users</h3><p className="text-3xl font-bold text-blue-800 mt-2">{loading ? '...' : metrics.totalUsers}</p></CardContent></Card>
        <Card><CardContent className="p-6 bg-slate-50"><h3 className="text-blue-500 text-sm font-bold uppercase tracking-wide">Total Shipments</h3><p className="text-3xl font-bold text-blue-800 mt-2">{loading ? '...' : metrics.totalShipments}</p></CardContent></Card>
        <Card><CardContent className="p-6 bg-slate-50"><h3 className="text-blue-500 text-sm font-bold uppercase tracking-wide">Active Complaints</h3><p className="text-3xl font-bold text-red-600 mt-2">{loading ? '...' : metrics.activeComplaints}</p></CardContent></Card>
        <Card><CardContent className="p-6 bg-slate-50"><h3 className="text-blue-500 text-sm font-bold uppercase tracking-wide">Flagged Users</h3><p className="text-3xl font-bold text-amber-600 mt-2">{loading ? '...' : metrics.flaggedUsers}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="bg-white border-b border-blue-100">
          <CardTitle>Create New Shipment</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-slate-50/30">
          <form onSubmit={handleCreateShipment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Title</label>
              <input
                type="text"
                value={newShipment.title}
                onChange={(e) => setNewShipment({ ...newShipment, title: e.target.value })}
                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="E.g. Electronics batch for Port A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Description</label>
              <textarea
                value={newShipment.description}
                onChange={(e) => setNewShipment({ ...newShipment, description: e.target.value })}
                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Batch details..."
              ></textarea>
            </div>
            <Button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {creating ? 'Creating...' : '+ Create Shipment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
