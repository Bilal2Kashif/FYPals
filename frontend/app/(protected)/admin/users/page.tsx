'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { Page } from '@/types';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  profileComplete: boolean;
  skills?: string;
  bio?: string;
  createdAt?: string;
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT:   'bg-blue-100 text-blue-800',
  ADVISOR:   'bg-purple-100 text-purple-800',
  ADMIN:     'bg-red-100 text-red-800',
  FYP_STAFF: 'bg-green-100 text-green-800',
};

export default function AdminUsersPage() {
  const [data, setData]       = useState<Page<AdminUser> | null>(null);
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);

  // Create user form
  const [createOpen, setCreateOpen]   = useState(false);
  const [creating, setCreating]       = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [formError, setFormError]     = useState('');

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { page: p, size: 12 } }) as unknown as Page<AdminUser>;
      setData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete user');
    }
  };

  const createUser = async () => {
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    if (!form.email.trim()) { setFormError('Email is required'); return; }
    if (!form.password.trim()) { setFormError('Password is required'); return; }
    setFormError('');
    setCreating(true);
    try {
      await api.post('/admin/users', form);
      toast.success('User created');
      setCreateOpen(false);
      setForm({ name: '', email: '', password: '', role: 'STUDENT' });
      load(page);
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-sm text-muted-foreground">{data?.totalElements ?? 0} total</p>
          </div>
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setFormError(''); setForm({ name: '', email: '', password: '', role: 'STUDENT' }); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name *</Label>
                  <Input
                      placeholder="Full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                      type="email"
                      placeholder="user@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="ADVISOR">Advisor</SelectItem>
                      <SelectItem value="FYP_STAFF">FYP Staff</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={createUser} disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Profile</th>
              <th className="p-3 font-medium w-16">Actions</th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-t">
                      {[...Array(5)].map((_, j) => (
                          <td key={j} className="p-3"><Skeleton className="h-4 w-24" /></td>
                      ))}
                    </tr>
                ))
            ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td>
                </tr>
            ) : (
                users.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{u.name || <span className="text-muted-foreground italic">No name</span>}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={u.profileComplete ? 'default' : 'secondary'} className="text-xs">
                          {u.profileComplete ? 'Complete' : 'Incomplete'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete user"
                            onClick={() => deleteUser(u.id, u.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                ))
            )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
                Next
              </Button>
            </div>
        )}
      </div>
  );
}