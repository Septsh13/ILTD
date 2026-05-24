import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import api from '../../services/api';

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get('/admin/reviews');
        setReviews(data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-800">Shipment Reviews</h1>
        <p className="text-blue-500 mt-1">General issues and clarifications reported by CHA Agents on rejected shipments.</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>CHA Agent</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date Reported</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : reviews.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4">No reviews found.</TableCell></TableRow>
            ) : reviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold text-blue-800">{r.shipment_id}</TableCell>
                <TableCell>{r.cha_name}</TableCell>
                <TableCell className="max-w-md whitespace-normal">{r.message}</TableCell>
                <TableCell className="text-sm font-mono">{new Date(r.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
