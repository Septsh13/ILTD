import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const barData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Documents Reviewed',
      data: [12, 19, 8, 15, 22, 6, 10],
      backgroundColor: '#a0522d',
      borderRadius: 8,
    },
  ],
};

const barOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#eaddd7' } },
    x: { grid: { display: false } },
  },
};

const doughnutData = {
  labels: ['Approved', 'Rejected', 'Pending'],
  datasets: [
    {
      data: [65, 15, 20],
      backgroundColor: ['#059669', '#dc2626', '#d97706'],
      borderWidth: 0,
    },
  ],
};

const doughnutOptions = {
  responsive: true,
  plugins: { legend: { position: 'bottom' } },
  cutout: '65%',
};

export const GovtPerformance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-800">Performance Dashboard</h1>
        <p className="text-blue-500 mt-1">Your review statistics and SLA compliance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Reviewed', value: '142', color: 'text-blue-800' },
          { label: 'Approved', value: '92', color: 'text-emerald-600' },
          { label: 'Rejected', value: '21', color: 'text-red-600' },
          { label: 'SLA Compliance', value: '96.5%', color: 'text-blue-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <p className="text-sm font-bold text-blue-500 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Review Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={barData} options={barOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decision Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="w-56">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
