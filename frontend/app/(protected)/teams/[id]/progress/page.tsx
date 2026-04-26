'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PhaseCard } from '@/components/progress/PhaseCard';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Phase, ProjectProgress, Team } from '@/types';

export default function ProgressPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);

  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [addCpOpen, setAddCpOpen] = useState<number | null>(null);
  const [phaseForm, setPhaseForm] = useState({ name: '', startDate: '', endDate: '' });
  const [cpForm, setCpForm] = useState({ title: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const t = await api.get(`/teams/${teamId}`) as unknown as Team;
      setTeam(t);
      if (t.project?.id) {
        const [prog, ph] = await Promise.all([
          api.get(`/projects/${t.project.id}/progress`) as unknown as ProjectProgress,
          api.get(`/projects/${t.project.id}/phases`) as unknown as Phase[],
        ]);
        setProgress(prog);
        setPhases(Array.isArray(ph) ? ph : (ph as any)?.phases ?? []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [teamId]);

  const isLeader = team?.leaderId === user?.id;
  const projectId = team?.project?.id;
  const callerRole = isLeader ? 'LEADER' : 'MEMBER';

  const addPhase = async () => {
    setSaving(true);
    try {
      await api.post(`/projects/${projectId}/phases`, phaseForm);
      toast.success('Phase added');
      setAddPhaseOpen(false);
      setPhaseForm({ name: '', startDate: '', endDate: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add phase');
    } finally { setSaving(false); }
  };

  const addCheckpoint = async (phaseId: number) => {
    setSaving(true);
    try {
      await api.post(`/phases/${phaseId}/checkpoints`, cpForm);
      toast.success('Checkpoint added');
      setAddCpOpen(null);
      setCpForm({ title: '', deadline: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add checkpoint');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/teams/${teamId}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <p className="text-muted-foreground">No project assigned to this team yet.</p>
      </div>
    );
  }

  const pct = progress?.completionPercent ?? 0;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/teams/${teamId}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <h1 className="text-xl font-bold">Project Progress</h1>
        </div>
        {isLeader && (
          <Dialog open={addPhaseOpen} onOpenChange={setAddPhaseOpen}>
            <DialogTrigger asChild>
              <Button size="sm">+ Add Phase</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Phase</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Phase Name</Label><Input value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} /></div>
                <div><Label>Start Date</Label><Input type="date" value={phaseForm.startDate} onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })} /></div>
                <div><Label>End Date</Label><Input type="date" value={phaseForm.endDate} onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={addPhase} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Phase
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Overall Completion</p>
            <span className="text-lg font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {progress?.completedCheckpoints ?? 0} / {progress?.totalCheckpoints ?? 0} checkpoints complete
          </p>
        </CardContent>
      </Card>

      {phases.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <p className="text-lg font-medium">No phases yet.</p>
          {isLeader && <p className="text-sm">Click &quot;Add Phase&quot; to get started.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.id} className="space-y-1">
              <PhaseCard
                phase={phase}
                isLeader={isLeader}
                callerRole={callerRole}
                onStatusChange={load}
              />
              {isLeader && (
                <Dialog open={addCpOpen === phase.id} onOpenChange={(o) => setAddCpOpen(o ? phase.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs ml-2">
                      + Add Checkpoint to {phase.name}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Checkpoint</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Title</Label><Input value={cpForm.title} onChange={(e) => setCpForm({ ...cpForm, title: e.target.value })} /></div>
                      <div><Label>Deadline</Label><Input type="date" value={cpForm.deadline} onChange={(e) => setCpForm({ ...cpForm, deadline: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => addCheckpoint(phase.id)} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Checkpoint
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
