import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Flag, ShieldCheck, User } from 'lucide-react';
import api from '../../services/api';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFlag = async (userId, currentFlagState) => {
    try {
      await api.post('/admin/flag-user', { user_id: userId, flag: !currentFlagState, reason: 'Admin override' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to update flag state');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-800">User Management</h1>
        <p className="text-brown-500 mt-1">View and manage all platform users and their statuses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Complaints</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
               <TableRow><TableCell colSpan={6} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : users.length === 0 ? (
               <TableRow><TableCell colSpan={6} className="text-center py-4">No users found.</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold">{u.employee_id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brown-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-brown-500" />
                    </div>
                    {u.full_name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge>{u.role.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.is_flagged ? 'rejected' : 'approved'}>
                    {u.is_flagged ? 'FLAGGED' : 'ACTIVE'}
                  </Badge>
                </TableCell>
                <TableCell>{u.complaints_count || 0}</TableCell>
                <TableCell className="text-right space-x-2">
                  {!u.is_flagged ? (
                    <Button variant="danger" size="sm" title="Flag User" onClick={() => handleFlag(u.id, false)}>
                      <Flag className="w-3.5 h-3.5 mr-1" /> Flag
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" title="Unflag User" onClick={() => handleFlag(u.id, true)}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Unflag
                    </Button>
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
