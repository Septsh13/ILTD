import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Package, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card>
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-blue-500 uppercase tracking-wide">{title}</p>
        <h4 className="text-3xl font-bold text-blue-800 mt-1">{value}</h4>
      </div>
    </CardContent>
  </Card>
);

export const ChaDashboard = () => {
  const [metrics, setMetrics] = useState({ activeShipments: 0, pendingSla: 0, suspiciousFlags: 0, clearedToday: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.get('/cha/summary');
        setMetrics(data.metrics);
        setRecentActivity(data.recentActivity || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-800">CHA Agent Dashboard</h1>
        <p className="text-blue-500 mt-1">Overview of your current clearances and shipments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Shipments" value={loading ? '...' : metrics.activeShipments} icon={Package} color="bg-blue-50 text-blue-600" />
        <StatCard title="Pending SLA" value={loading ? '...' : metrics.pendingSla} icon={Clock} color="bg-yellow-50 text-yellow-600" />
        <StatCard title="Suspicious Flags" value={loading ? '...' : metrics.suspiciousFlags} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <StatCard title="Cleared Today" value={loading ? '...' : metrics.clearedToday} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-blue-500">Loading activity...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-blue-500">No recent activity.</p>
              ) : (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-blue-100 last:border-0 pb-4 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800">Shipment #{activity.tracking_number}</p>
                      <p className="text-xs text-blue-500">Status: {activity.status}</p>
                    </div>
                    <span className="text-xs font-medium text-blue-400">
                      {new Date(activity.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
