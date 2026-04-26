'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Users, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { User, Team } from '@/types';

export default function AdvisorDashboardPage() {
  const { user: authUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [pendingDeliverables, setPendingDeliverables] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await api.get('/users/me/profile') as unknown as User;
        setProfile(p);
        // Fetch teams supervised by this advisor
        // The backend may return teams via admin endpoint or a specific advisor endpoint
        // Using search as fallback — adjust if backend has GET /advisor/teams
        try {
          const t = await api.get('/advisor/teams') as unknown as Team[];
          const teamList = Array.isArray(t) ? t : (t as any)?.content ?? [];
          setTeams(teamList);

          let pending = 0;
          for (const team of teamList) {
            if (team.project?.id) {
              try {
                const delivs = await api.get(`/deliverables/project/${team.project.id}`) as any[];
                pending += Array.isArray(delivs) ? delivs.filter((d: any) => d.status === 'SUBMITTED').length : 0;
              } catch { /* ignore */ }
            }
          }
          setPendingDeliverables(pending);
        } catch {
          setTeams([]);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">Welcome, {profile?.name ?? authUser?.name}</h1>
          <p className="text-muted-foreground">
            {profile?.department ? `Department: ${profile.department}` : 'FYP Advisor'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teams.length}</p>
              <p className="text-sm text-muted-foreground">Teams Supervised</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-full bg-amber-100">
              <FileCheck className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingDeliverables}</p>
              <p className="text-sm text-muted-foreground">Pending Feedback</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Supervised Teams</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams assigned to you yet.</p>
          ) : (
            teams.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{t.teamName}</p>
                  <p className="text-xs text-muted-foreground">{t.members?.length ?? 0} members</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/advisor/teams/${t.id}`}>View Team</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
