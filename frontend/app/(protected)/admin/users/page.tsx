'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Trash2, ShieldCheck, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { User, Page } from '@/types';

const ROLES = ['STUDENT', 'ADVISOR', 'ADMIN', 'FYP_STAFF'];

export default function AdminUsersPage() {
  const [data, setData]       = useState<Page<User> | null>(null);
  const [page, setPage]       = useState(0);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  // Change role state
  const [roleOpen, setRoleOpen] = useState<number | null>(null);
  const [newRole, setNewRole]   = useState('');
  const [updating, setUpdating] = useState(false);

  // Create user state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', role: 'STUDENT',
  });

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { page: p, size: 15, search: search || undefined },
      }) as unknown as Page<User>;
      setData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); setPage(0); }, [search]);
  useEffect(() => { load(page); }, [page]);

  const deleteUser = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete user');
    }
  };

  const updateRole = async (id: number) => {
    if (!newRole) return;
    setUpdating(true);
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      toast.success('Role updated');
      setRoleOpen(null);
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const createUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/users', createForm);
      toast.success('User created');
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'STUDENT' });
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const users      = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{data?.totalElements ?? 0} total</span>

            {/* ── Create User button ── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-1" /> Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                        placeholder="Full name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                        type="email"
                        placeholder="email@example.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                        value={createForm.role}
                        onValueChange={(v) => setCreateForm({ ...createForm, role: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createUser} disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              className="pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Team</th>
              <th className="p-3 font-medium w-24">Actions</th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                    </tr>
                ))
            ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td>
                </tr>
            ) : (
                users.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <Badge variant="outline">{u.role}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {u.teamId ? `Team #${u.teamId}` : '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Dialog
                              open={roleOpen === u.id}
                              onOpenChange={(o) => { setRoleOpen(o ? u.id : null); setNewRole(u.role); }}
                          >
                            <DialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Change role">
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Change Role — {u.name}</DialogTitle></DialogHeader>
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <DialogFooter>
                                <Button onClick={() => updateRole(u.id)} disabled={updating}>Update</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              title="Delete user"
                              onClick={() => deleteUser(u.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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