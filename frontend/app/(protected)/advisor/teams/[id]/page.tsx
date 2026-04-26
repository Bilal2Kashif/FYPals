'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PhaseCard } from '@/components/progress/PhaseCard';
import api from '@/lib/api';
import type { Team, ProjectProgress, Phase, Deliverable } from '@/types';

// ── Date helpers ─────────────────────────────────────────────────────────────
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

const STATUS_VARIANTS: Record<string, any> = {
  PENDING:            'secondary',
  SUBMITTED:          'default',
  APPROVED:           'default',
  CHANGES_REQUESTED:  'destructive',
};

export default function AdvisorTeamPage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam]               = useState<Team | null>(null);
  const [progress, setProgress]       = useState<ProjectProgress | null>(null);
  const [phases, setPhases]           = useState<Phase[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading]         = useState(true);

  // Feedback state
  const [feedbackOpen, setFeedbackOpen] = useState<number | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    comment: '', decision: 'APPROVED' as 'APPROVED' | 'CHANGES_REQUESTED',
  });
  const [submitting, setSubmitting] = useState(false);

  // Create deliverable state
  const [createOpen, setCreateOpen]   = useState(false);
  const [creating, setCreating]       = useState(false);
  const [createForm, setCreateForm]   = useState({ title: '', deadline: '' });

  const load = async () => {
    try {
      const t = await api.get(`/teams/${id}`) as unknown as Team;
      setTeam(t);
      if (t.project?.id) {
        const [prog, ph, delivs] = await Promise.all([
          api.get(`/projects/${t.project.id}/progress`) as unknown as ProjectProgress,
          api.get(`/projects/${t.project.id}/phases`)   as unknown as Phase[],
          api.get(`/deliverables/project/${t.project.id}`) as unknown as Deliverable[],
        ]);
        setProgress(prog);
        setPhases(Array.isArray(ph) ? ph : (ph as any)?.phases ?? []);
        setDeliverables(Array.isArray(delivs) ? delivs : []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const submitFeedback = async (deliverableId: number) => {
    setSubmitting(true);
    try {
      await api.post(`/deliverables/${deliverableId}/feedback`, {
        ...feedbackForm,
        callerRole: 'ADVISOR',
      });
      toast.success('Feedback submitted');
      setFeedbackOpen(null);
      setFeedbackForm({ comment: '', decision: 'APPROVED' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const createDeliverable = async () => {
    if (!createForm.title || !createForm.deadline) {
      toast.error('Please fill in title and deadline');
      return;
    }
    if (!(team as any)?.project?.id) {
      toast.error('No project found for this team');
      return;
    }
    setCreating(true);
    try {
      await api.post(`/deliverables/project/${(team as any).project.id}`, createForm);
      toast.success('Deliverable created');
      setCreateOpen(false);
      setCreateForm({ title: '', deadline: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create deliverable');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
        <div className="max-w-4xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!team) return <p className="text-muted-foreground">Team not found.</p>;

  const pct = progress?.completionPercent ?? 0;

  return (
      <div className="max-w-4xl space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/advisor/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{team.teamName}</h1>
          <Badge variant="secondary">{team.status}</Badge>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Members</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          </TabsList>

          {/* ── Members tab ── */}
          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle className="text-base">Team Members</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {team.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {m.userName?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{m.userName}</p>
                          <Badge variant="outline" className="text-xs">{m.memberRole}</Badge>
                        </div>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Progress tab ── */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Overall Progress</p>
                  <span className="font-bold text-lg">{pct}%</span>
                </div>
                <Progress value={pct} />
              </CardContent>
            </Card>
            {phases.length === 0 && (
                <p className="text-sm text-muted-foreground">No phases yet.</p>
            )}
            {phases.map((phase) => (
                <div key={phase.id} className="space-y-1">
                  <p className="text-xs text-muted-foreground px-1">
                    {formatDate((phase as any).startDate)} → {formatDate((phase as any).endDate)}
                  </p>
                  <PhaseCard phase={phase} isLeader={false} callerRole="ADVISOR" readOnly />
                </div>
            ))}
          </TabsContent>

          {/* ── Deliverables tab ── */}
          <TabsContent value="deliverables" className="space-y-3">

            {/* Create Deliverable button */}
            <div className="flex justify-end">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-1" /> Create Deliverable
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Deliverable</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input
                          placeholder="e.g. Final Report Submission"
                          value={createForm.title}
                          onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Deadline</Label>
                      <Input
                          type="date"
                          value={createForm.deadline}
                          onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={createDeliverable} disabled={creating}>
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {deliverables.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No deliverables yet. Create one above.
                </p>
            )}

            {deliverables.map((d) => (
                <Card key={d.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{d.title}</p>
                        {/* Formatted deadline */}
                        <p className="text-xs text-muted-foreground">
                          Deadline: {formatDate(d.deadline as any)}
                        </p>
                        {(d as any).submittedAt && (
                            <p className="text-xs text-muted-foreground">
                              Submitted: {formatDateTime((d as any).submittedAt)}
                            </p>
                        )}
                        {d.googleDriveLink && (
                            <a
                                href={d.googleDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary underline"
                            >
                              View Submission
                            </a>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={STATUS_VARIANTS[d.status]}>{d.status}</Badge>

                        {d.status === 'SUBMITTED' && (
                            <Dialog
                                open={feedbackOpen === d.id}
                                onOpenChange={(o) => setFeedbackOpen(o ? d.id : null)}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm">Give Feedback</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Give Feedback</DialogTitle></DialogHeader>
                                <div className="space-y-3">
                                  <div>
                                    <Label>Comment</Label>
                                    <Textarea
                                        value={feedbackForm.comment}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                                        rows={4}
                                        placeholder="Provide detailed feedback..."
                                    />
                                  </div>
                                  <div>
                                    <Label>Decision</Label>
                                    <Select
                                        value={feedbackForm.decision}
                                        onValueChange={(v: 'APPROVED' | 'CHANGES_REQUESTED') =>
                                            setFeedbackForm({ ...feedbackForm, decision: v })
                                        }
                                    >
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="CHANGES_REQUESTED">Changes Requested</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => submitFeedback(d.id)} disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Feedback
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                        )}
                      </div>
                    </div>

                    {d.feedback && (
                        <div className="p-3 rounded-md bg-muted/50 border text-sm space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Your Feedback</p>
                          <p>{d.feedback.comment}</p>
                          <Badge variant={d.feedback.decision === 'APPROVED' ? 'default' : 'destructive'}>
                            {d.feedback.decision}
                          </Badge>
                        </div>
                    )}
                    {((d as any).staffComments ?? []).map((c: any) => (
                        <div key={c.id} className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm space-y-1">
                          <p className="text-xs font-medium text-blue-600">FYP Staff Comment</p>
                          <p>{c.comment}</p>
                        </div>
                    ))}
                  </CardContent>
                </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
  );
}