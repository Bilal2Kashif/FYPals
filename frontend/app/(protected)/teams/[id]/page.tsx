'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { UserPlus, UserMinus, Loader2, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { PhaseCard } from '@/components/progress/PhaseCard';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Team } from '@/types';

// ── Date formatting helper ───────────────────────────────────────────────────
function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return raw;
  }
}

function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return raw;
  }
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function TeamWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await api.get(`/teams/${id}`) as unknown as Team;
      setTeam(t);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Refresh team overview when window regains focus
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const isLeader = team?.leaderId === user?.id;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const userResult = await api.get(`/users/by-email?email=${encodeURIComponent(inviteEmail)}`) as any;
      if (!userResult?.id) { toast.error('Student not found'); return; }
      await api.post(`/teams/${id}/invite-student?targetUserId=${userResult.id}`);
      toast.success('Invitation sent!');
      setInviteDialogOpen(false);
      setInviteEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Student not found');
    } finally {
      setInviting(false);
    }
  };

  const handleDrop = async (memberId: number) => {
    try {
      await api.delete(`/teams/${id}/members/${memberId}`);
      toast.success('Member removed');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to drop member');
    }
  };

  if (loading) {
    return (
        <div className="space-y-4 max-w-4xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
    );
  }

  if (!team) return <p className="text-muted-foreground">Team not found.</p>;

  const projectId = (team as any).project?.id;

  return (
      <div className="max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{team.teamName}</h1>
            <Badge variant="secondary" className="mt-1">{team.status}</Badge>
          </div>
          {isLeader && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-1" /> Invite Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Invite a Student</DialogTitle></DialogHeader>
                  <div className="space-y-2">
                    <Label>Student Email</Label>
                    <Input
                        placeholder="teammate@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleInvite} disabled={inviting}>
                      {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Invite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          )}
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle className="text-base">Team Members</CardTitle></CardHeader>
              <CardContent>
                {(team.members ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members yet. Invite your first teammate!</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(team.members ?? []).map((m) => (
                          <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">{m.userName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-medium">{m.userName}</p>
                                {m.userId === team.leaderId && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                              </div>
                              <Badge variant="outline" className="text-xs">{m.memberRole}</Badge>
                            </div>
                            {isLeader && m.userId !== user?.id && (
                                <Button
                                    variant="ghost" size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => handleDrop(m.id)}
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                            )}
                          </div>
                      ))}
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <ChatWindow teamId={Number(id)} />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTabContent projectId={projectId} teamId={Number(id)} isLeader={isLeader} />
          </TabsContent>

          <TabsContent value="deliverables">
            <DeliverablesTabContent projectId={projectId} />
          </TabsContent>

          <TabsContent value="disputes">
            <DisputesTabContent teamId={Number(id)} isLeader={isLeader} />
          </TabsContent>
        </Tabs>
      </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────

function ProgressTabContent({ projectId, teamId, isLeader }: { projectId?: number; teamId: number; isLeader: boolean }) {
  const [progress, setProgress]   = useState<any>(null);
  const [phases, setPhases]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [addCpOpen, setAddCpOpen] = useState<number | null>(null);
  const { user } = useAuthStore();

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    try {
      const [prog, ph] = await Promise.all([
        api.get(`/projects/${projectId}/progress`) as any,
        api.get(`/projects/${projectId}/phases`) as any,
      ]);
      setProgress(prog);
      const phaseList = Array.isArray(ph) ? ph : ph?.value ?? ph?.phases ?? [];
      const phasesWithCheckpoints = await Promise.all(
          phaseList.map(async (phase: any) => {
            try {
              const cp = await api.get(`/phases/${phase.id}/checkpoints`) as any;
              const checkpoints = Array.isArray(cp) ? cp : cp?.value ?? [];
              return { ...phase, checkpoints };
            } catch {
              return { ...phase, checkpoints: [] };
            }
          })
      );
      setPhases(phasesWithCheckpoints);
    } catch { } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Refresh when window regains focus
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const [phaseForm, setPhaseForm] = useState({ name: '', startDate: '', endDate: '' });
  const [cpForm, setCpForm]       = useState({ title: '', deadline: '' });

  const addPhase = async () => {
    try {
      await api.post(`/projects/${projectId}/phases`, phaseForm);
      toast.success('Phase added');
      setAddPhaseOpen(false);
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const addCheckpoint = async (phaseId: number) => {
    try {
      await api.post(`/phases/${phaseId}/checkpoints`, cpForm);
      toast.success('Checkpoint added');
      setAddCpOpen(null);
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  if (!projectId) return <p className="text-sm text-muted-foreground py-4">No project yet.</p>;
  if (loading) return <Skeleton className="h-48 w-full" />;

  const pct = progress?.completionPercentage ?? progress?.completionPercent ?? 0;
  const callerRole = isLeader ? 'LEADER' : 'MEMBER';

  return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Overall Progress</p>
              <span className="text-sm font-bold">{pct}%</span>
            </div>
            <Progress value={pct} />
          </CardContent>
        </Card>

        {isLeader && (
            <Dialog open={addPhaseOpen} onOpenChange={setAddPhaseOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">+ Add Phase</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Phase</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} /></div>
                  <div><Label>Start Date</Label><Input type="date" value={phaseForm.startDate} onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })} /></div>
                  <div><Label>End Date</Label><Input type="date" value={phaseForm.endDate} onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={addPhase}>Add Phase</Button></DialogFooter>
              </DialogContent>
            </Dialog>
        )}

        {phases.length === 0 && <p className="text-sm text-muted-foreground">No phases yet.</p>}

        {phases.map((phase: any) => (
            <div key={phase.id} className="space-y-2">
              {/* ── Phase date range formatted ── */}
              <div className="text-xs text-muted-foreground px-1">
                {formatDate(phase.startDate)} → {formatDate(phase.endDate)}
              </div>
              <PhaseCard phase={phase} isLeader={isLeader} callerRole={callerRole} onStatusChange={load} />
              {isLeader && (
                  <Dialog open={addCpOpen === phase.id} onOpenChange={(o) => setAddCpOpen(o ? phase.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-xs">+ Add Checkpoint to {phase.name}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Checkpoint</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Title</Label><Input value={cpForm.title} onChange={(e) => setCpForm({ ...cpForm, title: e.target.value })} /></div>
                        <div><Label>Deadline</Label><Input type="date" value={cpForm.deadline} onChange={(e) => setCpForm({ ...cpForm, deadline: e.target.value })} /></div>
                      </div>
                      <DialogFooter><Button onClick={() => addCheckpoint(phase.id)}>Add Checkpoint</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
              )}
            </div>
        ))}
      </div>
  );
}

// ─── Deliverables Tab ─────────────────────────────────────────────────────────

function DeliverablesTabContent({ projectId }: { projectId?: number }) {
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [submitOpen, setSubmitOpen]     = useState<number | null>(null);
  const [driveLink, setDriveLink]       = useState('');

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    try {
      const data = await api.get(`/deliverables/project/${projectId}`) as any;
      setDeliverables(Array.isArray(data) ? data : data?.value ?? data?.data ?? []);
    } catch { } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Refresh when window regains focus
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const submit = async (id: number) => {
    try {
      await api.post(`/deliverables/${id}/submit`, { googleDriveLink: driveLink });
      toast.success('Deliverable submitted!');
      setSubmitOpen(null);
      setDriveLink('');
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  if (!projectId) return <p className="text-sm text-muted-foreground py-4">No project yet.</p>;
  if (loading) return <Skeleton className="h-48 w-full" />;

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'secondary', SUBMITTED: 'default', APPROVED: 'default', CHANGES_REQUESTED: 'destructive',
  };

  return (
      <div className="space-y-3">
        {deliverables.length === 0 && <p className="text-sm text-muted-foreground">No deliverables yet.</p>}
        {deliverables.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{d.title}</p>
                    {/* ── Formatted deadline ── */}
                    <p className="text-xs text-muted-foreground">
                      Deadline: {formatDate(d.deadline)}
                    </p>
                    {d.submittedAt && (
                        <p className="text-xs text-muted-foreground">
                          Submitted: {formatDateTime(d.submittedAt)}
                        </p>
                    )}
                    <Badge variant={STATUS_COLORS[d.status] as any} className="mt-1">{d.status}</Badge>
                  </div>
                  {d.status === 'PENDING' && (
                      <Dialog open={submitOpen === d.id} onOpenChange={(o) => setSubmitOpen(o ? d.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm">Submit</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Submit Deliverable</DialogTitle></DialogHeader>
                          <div className="space-y-2">
                            <Label>Google Drive Link</Label>
                            <Input placeholder="https://drive.google.com/..." value={driveLink} onChange={(e) => setDriveLink(e.target.value)} />
                          </div>
                          <DialogFooter><Button onClick={() => submit(d.id)}>Submit</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
                  )}
                </div>
                {d.feedback && (
                    <div className="p-3 rounded-md bg-muted/50 border text-sm space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Advisor Feedback</p>
                      <p>{d.feedback.comment}</p>
                      <Badge variant={d.feedback.decision === 'APPROVED' ? 'default' : 'destructive'}>
                        {d.feedback.decision}
                      </Badge>
                    </div>
                )}
                {(d.staffComments ?? []).map((c: any) => (
                    <div key={c.id} className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm space-y-1">
                      <p className="text-xs font-medium text-blue-600">Staff Comment</p>
                      <p>{c.comment}</p>
                    </div>
                ))}
              </CardContent>
            </Card>
        ))}
      </div>
  );
}

// ─── Disputes Tab ─────────────────────────────────────────────────────────────

function DisputesTabContent({ teamId, isLeader }: { teamId: number; isLeader: boolean }) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [raiseOpen, setRaiseOpen]   = useState(false);
  const [form, setForm]             = useState({ targetItem: '', reason: '' });
  const [pollForm, setPollForm]     = useState({ question: '', options: '', deadline: '' });
  const [pollOpen, setPollOpen]     = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/disputes/team/${teamId}/all`) as any;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      const disputesWithPolls = await Promise.all(
          list.map(async (d: any) => {
            if (d.status === 'OPEN') {
              try {
                const pollData = await api.get(`/disputes/${d.id}/poll`) as any;
                const poll = pollData?.data ?? pollData;
                const optionsRaw = poll?.options ?? '';
                const options = optionsRaw.replace(/^\[|\]$/g, '').split(',').map((o: string) => o.trim()).filter(Boolean);
                try {
                  const resultsData = await api.get(`/disputes/${d.id}/polls/${poll.id}/results`) as any;
                  const results = resultsData?.data ?? resultsData ?? {};
                  const totalVotes = Object.values(results).reduce((a: any, b: any) => a + b, 0) as number;
                  const resultsArray = options.map((opt: string) => ({
                    option: opt,
                    count: (results[opt] ?? 0),
                    percent: totalVotes > 0 ? Math.round(((results[opt] ?? 0) / totalVotes) * 100) : 0,
                  }));
                  return { ...d, poll: { ...poll, options, results: resultsArray } };
                } catch { return { ...d, poll: { ...poll, options } }; }
              } catch { return d; }
            }
            return d;
          })
      );
      setDisputes(disputesWithPolls);
    } catch { } finally { setLoading(false); }
  }, [teamId]);

  useEffect(() => { load(); }, [load]);

  // Refresh when window regains focus
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const raiseDispute = async () => {
    try {
      await api.post('/disputes', { teamId, ...form });
      toast.success('Dispute raised');
      setRaiseOpen(false);
      setForm({ targetItem: '', reason: '' });
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const accept  = async (id: number) => { try { await api.post(`/disputes/${id}/accept`);  toast.success('Dispute accepted'); load(); } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); } };
  const reject  = async (id: number) => { try { await api.post(`/disputes/${id}/reject`);  toast.success('Dispute rejected'); load(); } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); } };
  const resolve = async (id: number) => { try { await api.post(`/disputes/${id}/resolve`); toast.success('Dispute resolved'); load(); } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); } };

  const createPoll = async (disputeId: number) => {
    try {
      const options = pollForm.options.split('\n').map((o) => o.trim()).filter(Boolean);
      await api.post(`/disputes/${disputeId}/poll`, { ...pollForm, options });
      toast.success('Poll created');
      setPollOpen(null);
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const vote = async (disputeId: number, pollId: number, option: string) => {
    try {
      await api.post(`/disputes/${disputeId}/polls/${pollId}/vote`, { chosenOption: option });
      toast.success('Vote cast!');
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Already voted or error'); }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Disputes</h3>
          <Dialog open={raiseOpen} onOpenChange={setRaiseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Raise Dispute</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Raise a Dispute</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Target Item</Label><Input value={form.targetItem} onChange={(e) => setForm({ ...form, targetItem: e.target.value })} placeholder="What's the dispute about?" /></div>
                <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e: any) => setForm({ ...form, reason: e.target.value })} placeholder="Explain the issue..." /></div>
              </div>
              <DialogFooter><Button onClick={raiseDispute}>Submit Dispute</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {disputes.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <p className="text-lg">🤝</p>
              <p className="font-medium">No disputes raised.</p>
              <p className="text-sm">The team is getting along well!</p>
            </div>
        )}

        {disputes.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{d.targetItem}</p>
                    <p className="text-xs text-muted-foreground">
                      Raised by {d.raisedByName}
                      {d.createdAt && <span> · {formatDateTime(d.createdAt)}</span>}
                    </p>
                    <p className="text-sm mt-1">{d.reason}</p>
                  </div>
                  <Badge variant="secondary">{d.status}</Badge>
                </div>

                {d.status === 'REJECTED' && d.rejectionReason && (
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      ❌ Rejected: {d.rejectionReason}
                    </p>
                )}

                {isLeader && d.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => accept(d.id)}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => reject(d.id)}>Reject</Button>
                    </div>
                )}

                {isLeader && d.status === 'OPEN' && !d.poll && (
                    <Dialog open={pollOpen === d.id} onOpenChange={(o) => setPollOpen(o ? d.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm">Create Poll</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Create Poll</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Question</Label><Input value={pollForm.question} onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })} /></div>
                          <div><Label>Options (one per line)</Label><Textarea value={pollForm.options} onChange={(e: any) => setPollForm({ ...pollForm, options: e.target.value })} rows={4} /></div>
                          <div><Label>Deadline</Label><Input type="datetime-local" value={pollForm.deadline} onChange={(e) => setPollForm({ ...pollForm, deadline: e.target.value })} /></div>
                        </div>
                        <DialogFooter><Button onClick={() => createPoll(d.id)}>Create Poll</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                )}

                {d.poll && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="font-medium text-sm">{d.poll.question}</p>
                      {d.poll.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Deadline: {formatDateTime(d.poll.deadline)}
                          </p>
                      )}
                      <div className="space-y-2">
                        {(d.poll.options ?? []).map((opt: string) => {
                          const result = d.poll.results?.find((r: any) => r.option === opt);
                          return (
                              <div key={opt} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => vote(d.id, d.poll.id, opt)}>
                                    {opt}
                                  </Button>
                                  {result && (
                                      <span className="text-xs text-muted-foreground">
                                        {result.count} vote{result.count !== 1 ? 's' : ''} ({result.percent}%)
                                      </span>
                                  )}
                                </div>
                                {result && result.count > 0 && (
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary transition-all" style={{ width: `${result.percent}%` }} />
                                    </div>
                                )}
                              </div>
                          );
                        })}
                      </div>
                      {isLeader && (
                          <Button size="sm" variant="secondary" className="mt-2" onClick={() => resolve(d.id)}>
                            Resolve Dispute
                          </Button>
                      )}
                    </div>
                )}

                {d.status === 'RESOLVED' && (
                    <div className="border-t pt-3 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        ✅ Resolved by <span className="font-medium text-foreground">{d.resolvedByName}</span>
                        {d.resolvedAt && <span> · {formatDateTime(d.resolvedAt)}</span>}
                      </p>
                      {d.winningOption && (
                          <p className="text-sm">
                            🏆 Decision: <span className="font-medium">{d.winningOption}</span>
                          </p>
                      )}
                    </div>
                )}

              </CardContent>
            </Card>
        ))}
      </div>
  );
}