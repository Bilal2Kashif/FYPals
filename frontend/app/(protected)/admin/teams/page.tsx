'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import type { Page } from '@/types';

// Use a local type matching AdminTeamDTO exactly
interface AdminTeam {
  id: number;
  teamName: string;
  leaderName: string;
  leaderId: number;
  status: string;
  memberCount: number;   // ← comes from AdminTeamDTO, not a members array
  createdAt: string;
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return raw; }
}

export default function AdminTeamsPage() {
  const [data, setData]       = useState<Page<AdminTeam> | null>(null);
  const [page, setPage]       = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/teams', {
        params: { page: p, size: 15 },
      }) as unknown as Page<AdminTeam>;
      setData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const deleteTeam = async (id: number) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/teams/${id}`);
      toast.success('Team deleted');
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete team');
    }
  };

  const teams      = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Teams</h1>
          <span className="text-sm text-muted-foreground">{data?.totalElements ?? 0} total</span>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Team Name</th>
              <th className="text-left p-3 font-medium">Leader</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Members</th>
              <th className="text-left p-3 font-medium">Created</th>
              <th className="p-3 font-medium w-16">Actions</th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-t">
                      {[...Array(6)].map((_, j) => (
                          <td key={j} className="p-3"><Skeleton className="h-4 w-24" /></td>
                      ))}
                    </tr>
                ))
            ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No teams found.
                  </td>
                </tr>
            ) : (
                teams.map((t) => (
                    <tr key={t.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{t.teamName}</td>
                      <td className="p-3 text-muted-foreground">{t.leaderName}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{t.status}</Badge>
                      </td>
                      {/* Use memberCount from AdminTeamDTO — NOT t.members.length */}
                      <td className="p-3 text-muted-foreground">{t.memberCount}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                      <td className="p-3">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete team"
                            onClick={() => deleteTeam(t.id)}
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
              <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
              <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
        )}
      </div>
  );
}