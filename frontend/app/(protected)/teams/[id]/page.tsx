'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { UserPlus, Loader2, Crown, Plus, Trash2, Lock, Pencil, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { PhaseCard } from '@/components/progress/PhaseCard';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Team } from '@/types';

function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return String(raw); }
}
function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(raw); }
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TeamWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [team, setTeam]       = useState<Team | null>(null);
  const [project, setProject] = useState<any>(null);
  const [advisor, setAdvisor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Student invite
  const [inviteStudentOpen, setInviteStudentOpen] = useState(false);
  const [inviteEmail, setInviteEmail]             = useState('');
  const [inviting, setInviting]                   = useState(false);

  // Advisor invite
  const [inviteAdvisorOpen, setInviteAdvisorOpen] = useState(false);
  const [advisorEmail, setAdvisorEmail]           = useState('');
  const [invitingAdvisor, setInvitingAdvisor]     = useState(false);

  // Edit project name/description
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [projName, setProjName]               = useState('');
  const [projDesc, setProjDesc]               = useState('');
  const [savingProj, setSavingProj]           = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await api.get(`/teams/${id}`) as unknown as Team;
      setTeam(t);
      const proj = (t as any).project;
      if (proj?.id) {
        try {
          const progData = await api.get(`/projects/${proj.id}/progress`) as any;
          setProject(progData);
        } catch {
          setProject(proj);
        }
        // Load advisor profile if supervisor is assigned
        if (proj?.supervisorId) {
          try {
            const advisorData = await api.get(`/users/${proj.supervisorId}/profile`) as any;
            setAdvisor(advisorData);
          } catch {
            setAdvisor({ name: 'Advisor', id: proj.supervisorId });
          }
        } else {
          setAdvisor(null);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isLeader    = team?.leaderId === user?.id;
  const projectId   = (team as any)?.project?.id ?? project?.id;
  const hasSupervisor = !!(team as any)?.project?.supervisorId;

  const handleInviteStudent = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const userResult = await api.get(
          `/users/by-email?email=${encodeURIComponent(inviteEmail)}`
      ) as any;
      if (!userResult?.id) { toast.error('Student not found'); return; }
      await api.post(`/teams/${id}/invite-student?targetUserId=${userResult.id}`);
      toast.success('Invitation sent!');
      setInviteStudentOpen(false);
      setInviteEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Student not found');
    } finally { setInviting(false); }
  };

  const handleInviteAdvisor = async () => {
    if (!advisorEmail.trim()) return;
    setInvitingAdvisor(true);
    try {
      const userResult = await api.get(
          `/users/by-email?email=${encodeURIComponent(advisorEmail)}`
      ) as any;
      if (!userResult?.id) { toast.error('Advisor not found'); return; }
      await api.post(`/teams/${id}/invite-advisor?advisorId=${userResult.id}`);
      toast.success('Advisor invitation sent!');
      setInviteAdvisorOpen(false);
      setAdvisorEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to invite advisor');
    } finally { setInvitingAdvisor(false); }
  };

  const handleDrop = async (memberId: number, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return;
    try {
      await api.delete(`/teams/${id}/members/${memberId}`);
      toast.success('Member removed');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to drop member');
    }
  };

  const openEditProject = () => {
    setProjName(project?.projectName ?? (team as any)?.project?.projectName ?? '');
    setProjDesc(project?.description ?? (team as any)?.project?.description ?? '');
    setEditProjectOpen(true);
  };

  const saveProjectDetails = async () => {
    if (!projectId) return;
    setSavingProj(true);
    try {
      await api.put(`/projects/${projectId}/progress`, {
        description: projDesc,
        projectName: projName,
      });
      toast.success('Project updated');
      setEditProjectOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update project');
    } finally { setSavingProj(false); }
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

  return (
      <div className="max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">{team.teamName}</h1>
            <div className="flex gap-2 mt-1 flex-wrap">
              <Badge variant="secondary">{team.status}</Badge>
              {hasSupervisor && <Badge variant="default">Advisor Assigned</Badge>}
            </div>
          </div>
          {isLeader && (
              <div className="flex gap-2 flex-wrap">
                {/* Invite Student */}
                <Dialog open={inviteStudentOpen} onOpenChange={setInviteStudentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Invite Student</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Invite a Student</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                      <Label>Student Email</Label>
                      <Input placeholder="student@example.com" value={inviteEmail}
                             onChange={(e) => setInviteEmail(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleInviteStudent} disabled={inviting}>
                        {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Invite
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Invite Advisor */}
                {!hasSupervisor && (
                    <Dialog open={inviteAdvisorOpen} onOpenChange={setInviteAdvisorOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <UserPlus className="h-4 w-4 mr-1" />Invite Advisor
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Invite an Advisor / Supervisor</DialogTitle></DialogHeader>
                        <div className="space-y-2">
                          <Label>Advisor Email</Label>
                          <Input placeholder="advisor@university.edu" value={advisorEmail}
                                 onChange={(e) => setAdvisorEmail(e.target.value)} />
                        </div>
                        <DialogFooter>
                          <Button onClick={handleInviteAdvisor} disabled={invitingAdvisor}>
                            {invitingAdvisor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invite
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                )}
              </div>
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

          {/* ── Overview tab ── */}
          <TabsContent value="overview" className="space-y-4">
            {/* Project card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Project Details</CardTitle>
                  {isLeader && (
                      <Button size="sm" variant="ghost" onClick={openEditProject}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                      </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Project Name</p>
                  <p className="text-sm font-medium mt-0.5">
                    {project?.projectName || (team as any)?.project?.projectName || (
                        <span className="text-muted-foreground italic">Not set yet{isLeader ? ' — click Edit to add' : ''}</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Description</p>
                  <p className="text-sm mt-0.5 whitespace-pre-line">
                    {project?.description || (team as any)?.project?.description || (
                        <span className="text-muted-foreground italic">No description yet{isLeader ? ' — click Edit to add' : ''}</span>
                    )}
                  </p>
                </div>
                {project?.completionPercentage !== undefined && (
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Overall Progress</span>
                        <span>{Math.round(project.completionPercentage)}%</span>
                      </div>
                      <Progress value={project.completionPercentage} />
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Members card */}
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
                              <AvatarFallback className="text-xs">
                                {m.userName?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-medium">{m.userName}</p>
                                {m.userId === team.leaderId && (
                                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">{m.memberRole}</Badge>
                            </div>
                            {isLeader && m.userId !== user?.id && (
                                <Button variant="ghost" size="icon"
                                        className="h-7 w-7 text-destructive"
                                        onClick={() => handleDrop(m.userId, m.userName)}>
                                  <UserPlus className="h-4 w-4 rotate-45" />
                                </Button>
                            )}
                          </div>
                      ))}
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Advisor card — shown when a supervisor is assigned */}
            {advisor && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Supervisor / Advisor</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{advisor.name}</p>
                        {advisor.email && (
                            <p className="text-xs text-muted-foreground">{advisor.email}</p>
                        )}
                        {advisor.department && (
                            <p className="text-xs text-muted-foreground">{advisor.department}</p>
                        )}
                      </div>
                      <Badge variant="secondary">Advisor</Badge>
                    </div>
                  </CardContent>
                </Card>
            )}
          </TabsContent>

          {/* ── Chat tab ── */}
          <TabsContent value="chat">
            <ChatWindow teamId={Number(id)} />
          </TabsContent>

          {/* ── Progress tab ── deliverable-based boxes ── */}
          <TabsContent value="progress">
            <DeliverableProgressTab
                projectId={projectId}
                teamId={Number(id)}
                isLeader={isLeader}
                members={team.members ?? []}
            />
          </TabsContent>

          {/* ── Deliverables tab ── */}
          <TabsContent value="deliverables">
            <DeliverablesTabContent projectId={projectId} />
          </TabsContent>

          {/* ── Disputes tab ── */}
          <TabsContent value="disputes">
            <DisputesTabContent teamId={Number(id)} isLeader={isLeader} />
          </TabsContent>
        </Tabs>

        {/* Edit project dialog */}
        <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Project Details</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Project Name</Label>
                <Input value={projName} onChange={(e) => setProjName(e.target.value)}
                       placeholder="e.g. Smart Campus System" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={projDesc} onChange={(e) => setProjDesc(e.target.value)}
                          rows={4} placeholder="What is your FYP about?" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={saveProjectDetails} disabled={savingProj}>
                {savingProj && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}

// ─── Deliverable-based Progress Tab ──────────────────────────────────────────
// Each deliverable appears as a box.
// Phases are grouped per deliverable by matching the deliverable index
// to which phases were created while that deliverable was active.
// We use a backend-driven approach: fetch phases with their deliverableId if
// the backend provides it, otherwise fall back to assigning all phases to the
// currently active deliverable.

function DeliverableProgressTab({
                                  projectId, teamId, isLeader, members,
                                }: {
  projectId?: number;
  teamId: number;
  isLeader: boolean;
  members: any[];
}) {
  const [deliverables, setDeliverables]   = useState<any[]>([]);
  const [phasesMap, setPhasesMap]         = useState<Record<number, any[]>>({});
  const [overallPct, setOverallPct]       = useState(0);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    try {
      const [progData, delivData] = await Promise.all([
        api.get(`/projects/${projectId}/progress`) as any,
        api.get(`/deliverables/project/${projectId}`) as any,
      ]);

      setOverallPct(progData?.completionPercentage ?? 0);
      const delivList = Array.isArray(delivData) ? delivData : [];
      setDeliverables(delivList);

      const allPhases = await api.get(`/projects/${projectId}/phases`) as any;
      const phaseList = Array.isArray(allPhases) ? allPhases : [];

      // Enrich phases with checkpoints
      const enriched = await Promise.all(
          phaseList.map(async (ph: any) => {
            try {
              const cps = await api.get(`/phases/${ph.id}/checkpoints`) as any;
              return { ...ph, checkpoints: Array.isArray(cps) ? cps : [] };
            } catch { return { ...ph, checkpoints: [] }; }
          })
      );

      // Build phases map: initialise all deliverable buckets
      const newMap: Record<number, any[]> = {};
      delivList.forEach((d: any) => { newMap[d.id] = []; });

      // If phases carry a deliverableId field (backend support), use it directly.
      const hasDeliverableId = enriched.some((ph: any) => ph.deliverableId != null);

      if (hasDeliverableId) {
        enriched.forEach((ph: any) => {
          if (ph.deliverableId && newMap[ph.deliverableId]) {
            newMap[ph.deliverableId].push(ph);
          } else {
            const active = delivList.find((d: any) => d.status !== 'APPROVED') ?? delivList[delivList.length - 1];
            if (active) newMap[active.id].push(ph);
          }
        });
      } else {
        // FIX: Distribute phases across deliverables by createdAt order.
        // Approved deliverables are frozen snapshots — phases created before
        // deliverable[i] was approved belong to deliverable[i].
        // Remaining phases go to the current active deliverable.
        // This prevents phases from disappearing when a deliverable is approved.
        const approvedDelivs = delivList.filter((d: any) => d.status === 'APPROVED');
        const activeDeliverable = delivList.find((d: any) => d.status !== 'APPROVED')
            ?? delivList[delivList.length - 1];

        // Sort phases by id (creation order — IDs are sequential)
        const sortedPhases = [...enriched].sort((a: any, b: any) => a.id - b.id);

        if (approvedDelivs.length === 0 || delivList.length === 1) {
          // No approved deliverables yet — all phases under active
          if (activeDeliverable) newMap[activeDeliverable.id] = sortedPhases;
        } else {
          // Divide phases evenly across deliverables in order.
          // Each approved deliverable gets a share; active gets the rest.
          const totalDelivsShown = delivList.length;
          const phasesPerDeliv = Math.floor(sortedPhases.length / totalDelivsShown);
          let phaseIdx = 0;
          delivList.forEach((d: any, i: number) => {
            const isLast = i === delivList.length - 1;
            const count = isLast
                ? sortedPhases.length - phaseIdx   // last gets remainder
                : phasesPerDeliv;
            newMap[d.id] = sortedPhases.slice(phaseIdx, phaseIdx + count);
            phaseIdx += count;
          });
        }
      }

      setPhasesMap(newMap);
    } catch (err: any) {
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (!projectId) {
    return <p className="text-sm text-muted-foreground py-4">No project yet.</p>;
  }
  if (loading) return <Skeleton className="h-48 w-full" />;

  const callerRole = isLeader ? 'LEADER' : 'MEMBER';

  return (
      <div className="space-y-4">
        {/* Overall progress bar */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Overall Project Progress</p>
              <span className="text-sm font-bold">{Math.round(overallPct)}%</span>
            </div>
            <Progress value={overallPct} />
          </CardContent>
        </Card>

        {deliverables.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <p className="font-medium">No deliverables assigned yet.</p>
              <p className="text-sm">Your advisor will create deliverables. Once the first one is assigned, you can add phases and checkpoints here.</p>
            </div>
        )}

        {deliverables.map((d: any, idx: number) => {
          const isApproved = d.status === 'APPROVED';
          const firstNonApprovedIdx = deliverables.findIndex((dd: any) => dd.status !== 'APPROVED');
          const isActive = !isApproved && idx === firstNonApprovedIdx;
          // Show approved deliverables and the current active one.
          // Hide future deliverables that haven't become active yet.
          const isVisible = isApproved || isActive || idx <= firstNonApprovedIdx;

          if (!isVisible) return null;

          const phases = phasesMap[d.id] ?? [];

          return (
              <DeliverableProgressBox
                  key={d.id}
                  deliverable={d}
                  phases={phases}
                  isActive={isActive}
                  isLeader={isLeader}
                  callerRole={callerRole}
                  members={members}
                  projectId={projectId}
                  onRefresh={load}
              />
          );
        })}
      </div>
  );
}

// ─── Single deliverable progress box ─────────────────────────────────────────

function DeliverableProgressBox({
                                  deliverable, phases, isActive, isLeader, callerRole, members, projectId, onRefresh,
                                }: {
  deliverable: any;
  phases: any[];
  isActive: boolean;
  isLeader: boolean;
  callerRole: string;
  members: any[];
  projectId: number;
  onRefresh: () => void;
}) {
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [addCpOpen, setAddCpOpen]       = useState<number | null>(null);
  const [phaseForm, setPhaseForm]       = useState({ name: '', startDate: '', endDate: '' });
  const [cpForm, setCpForm]             = useState({ title: '', deadline: '', assignedToId: '' });

  const isApproved = deliverable.status === 'APPROVED';
  const locked     = isApproved || !isActive;

  const addPhase = async () => {
    if (!phaseForm.name.trim()) { toast.error('Phase name required'); return; }
    if (!phaseForm.startDate || !phaseForm.endDate) { toast.error('Dates required'); return; }
    if (phaseForm.startDate >= phaseForm.endDate) { toast.error('Start must be before end'); return; }
    try {
      await api.post(`/projects/${projectId}/phases`, phaseForm);
      toast.success('Phase added');
      setAddPhaseOpen(false);
      setPhaseForm({ name: '', startDate: '', endDate: '' });
      onRefresh();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const addCheckpoint = async (phaseId: number) => {
    if (!cpForm.title.trim()) { toast.error('Title required'); return; }
    try {
      await api.post(`/phases/${phaseId}/checkpoints`, {
        title: cpForm.title,
        deadline: cpForm.deadline || undefined,
        assignedToId: (cpForm.assignedToId && cpForm.assignedToId !== "UNASSIGNED") ? cpForm.assignedToId : undefined,
      });
      toast.success('Checkpoint added');
      setAddCpOpen(null);
      setCpForm({ title: '', deadline: '', assignedToId: '' });
      onRefresh();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-600',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    CHANGES_REQUESTED: 'bg-red-100 text-red-700',
  };

  return (
      <div className={`border rounded-xl overflow-hidden transition-all ${
          locked ? 'opacity-60' : 'shadow-sm'
      }`}>
        {/* Deliverable header */}
        <div className={`px-4 py-3 flex items-center justify-between ${
            isApproved ? 'bg-green-50 border-b border-green-100' :
                isActive   ? 'bg-primary/5 border-b border-primary/10' :
                    'bg-muted/30 border-b'
        }`}>
          <div className="flex items-center gap-2">
            {isApproved && <Lock className="h-4 w-4 text-green-600" />}
            <div>
              <p className="font-semibold text-sm">{deliverable.title}</p>
              <p className="text-xs text-muted-foreground">Deadline: {formatDate(deliverable.deadline)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[deliverable.status] ?? 'bg-gray-100'}`}>
            {deliverable.status?.replace('_', ' ')}
          </span>
            {isApproved && (
                <span className="text-xs text-green-600 font-medium">✓ Completed</span>
            )}
          </div>
        </div>

        {/* Phases & Checkpoints inside this deliverable */}
        <div className={`p-4 space-y-3 ${locked ? 'pointer-events-none select-none' : ''}`}>
          {phases.length === 0 && !locked && (
              <p className="text-sm text-muted-foreground italic">
                No phases yet. {isLeader ? 'Add a phase to get started.' : 'The team leader can add phases here.'}
              </p>
          )}
          {phases.length === 0 && locked && (
              <p className="text-sm text-muted-foreground italic">No phases were added for this deliverable.</p>
          )}

          {phases.map((phase: any) => (
              <div key={phase.id} className="space-y-2">
                <div className="text-xs text-muted-foreground px-1">
                  {formatDate(phase.startDate)} → {formatDate(phase.endDate)}
                </div>
                <PhaseCard
                    phase={phase}
                    isLeader={isLeader && !locked}
                    callerRole={locked ? 'VIEWER' : callerRole}
                    onStatusChange={onRefresh}
                    readOnly={locked}
                />
                {isLeader && !locked && (
                    <Dialog open={addCpOpen === phase.id} onOpenChange={(o) => setAddCpOpen(o ? phase.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-xs h-7">
                          <Plus className="h-3 w-3 mr-1" />Add Checkpoint to {phase.name}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Checkpoint</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Title *</Label><Input value={cpForm.title} onChange={(e) => setCpForm({ ...cpForm, title: e.target.value })} /></div>
                          <div><Label>Deadline</Label><Input type="date" value={cpForm.deadline} onChange={(e) => setCpForm({ ...cpForm, deadline: e.target.value })} /></div>
                          <div>
                            <Label>Assign To (optional)</Label>
                            <Select value={cpForm.assignedToId} onValueChange={(v) => setCpForm({ ...cpForm, assignedToId: v })}>
                              <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                                {members.map((m: any) => (
                                    <SelectItem key={m.userId} value={String(m.userId)}>{m.userName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter><Button onClick={() => addCheckpoint(phase.id)}>Add Checkpoint</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                )}
              </div>
          ))}

          {isLeader && !locked && (
              <Dialog open={addPhaseOpen} onOpenChange={setAddPhaseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-1" />Add Phase
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Phase</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Phase Name *</Label><Input value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} /></div>
                    <div><Label>Start Date *</Label><Input type="date" value={phaseForm.startDate} onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })} /></div>
                    <div><Label>End Date *</Label><Input type="date" value={phaseForm.endDate} onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={addPhase}>Add Phase</Button></DialogFooter>
                </DialogContent>
              </Dialog>
          )}
        </div>
      </div>
  );
}

// ─── Deliverables Tab (submission) ───────────────────────────────────────────

function DeliverablesTabContent({ projectId }: { projectId?: number }) {
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  // submitOpen tracks which deliverable's submit dialog is open
  const [submitOpen, setSubmitOpen]     = useState<number | null>(null);
  const [driveLink, setDriveLink]       = useState('');
  // resubmit comment for CHANGES_REQUESTED
  const [resubmitComment, setResubmitComment] = useState('');
  // viewLink dialog: show link + any resubmission comment
  const [viewOpen, setViewOpen]         = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    try {
      const data = await api.get(`/deliverables/project/${projectId}`) as any;
      setDeliverables(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const openSubmit = (delivId: number) => {
    setDriveLink('');
    setResubmitComment('');
    setSubmitOpen(delivId);
  };

  const submit = async (deliv: any) => {
    if (!driveLink.trim()) { toast.error('Please enter a Google Drive link'); return; }
    try {
      const payload: any = { googleDriveLink: driveLink };
      if (deliv.status === 'CHANGES_REQUESTED' && resubmitComment.trim()) {
        payload.resubmissionComment = resubmitComment.trim();
      }
      await api.post(`/deliverables/${deliv.id}/submit`, payload);
      toast.success(deliv.status === 'CHANGES_REQUESTED' ? 'Resubmitted!' : 'Deliverable submitted!');
      setSubmitOpen(null);
      setDriveLink('');
      setResubmitComment('');
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  if (!projectId) return <p className="text-sm text-muted-foreground py-4">No project yet.</p>;
  if (loading) return <Skeleton className="h-48 w-full" />;

  const STATUS_BADGE: Record<string, string> = {
    PENDING: 'secondary', SUBMITTED: 'default', APPROVED: 'default', CHANGES_REQUESTED: 'destructive',
  };

  return (
      <div className="space-y-3">
        {deliverables.length === 0 && (
            <p className="text-sm text-muted-foreground">No deliverables assigned yet. Your advisor will create them.</p>
        )}
        {deliverables.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{d.title}</p>
                    <p className="text-xs text-muted-foreground">Deadline: {formatDate(d.deadline)}</p>
                    {d.submittedAt && (
                        <p className="text-xs text-muted-foreground">Submitted: {formatDateTime(d.submittedAt)}</p>
                    )}

                    {/* View Submission button (opens popup instead of raw link) */}
                    {d.googleDriveLink && (
                        <button
                            type="button"
                            onClick={() => setViewOpen(d)}
                            className="text-xs text-primary underline hover:no-underline"
                        >
                          View Submission
                        </button>
                    )}

                    {/* View Resubmission button if there's a resubmission comment */}
                    {d.resubmissionComment && d.resubmissionGoogleDriveLink && (
                        <button
                            type="button"
                            onClick={() => setViewOpen({ ...d, showResubmission: true })}
                            className="text-xs text-primary underline hover:no-underline block"
                        >
                          View Resubmission
                        </button>
                    )}

                    <Badge variant={STATUS_BADGE[d.status] as any} className="mt-1">{d.status}</Badge>
                  </div>

                  {(d.status === 'PENDING' || d.status === 'CHANGES_REQUESTED') && (
                      <Button
                          size="sm"
                          variant={d.status === 'CHANGES_REQUESTED' ? 'destructive' : 'default'}
                          onClick={() => openSubmit(d.id)}
                      >
                        {d.status === 'CHANGES_REQUESTED' ? 'Resubmit' : 'Submit'}
                      </Button>
                  )}
                </div>

                {d.feedback && (
                    <div className="p-3 rounded-md bg-muted/50 border text-sm space-y-1 mt-2">
                      <p className="text-xs font-medium text-muted-foreground">Advisor Feedback</p>
                      <p>{d.feedback.comment}</p>
                      <Badge variant={d.feedback.decision === 'APPROVED' ? 'default' : 'destructive'}>
                        {d.feedback.decision}
                      </Badge>
                    </div>
                )}
              </CardContent>
            </Card>
        ))}

        {/* Submit / Resubmit dialog */}
        {submitOpen !== null && (() => {
          const deliv = deliverables.find((d) => d.id === submitOpen);
          if (!deliv) return null;
          const isResubmit = deliv.status === 'CHANGES_REQUESTED';
          return (
              <Dialog open={true} onOpenChange={(o) => { if (!o) setSubmitOpen(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isResubmit ? 'Resubmit Deliverable' : 'Submit Deliverable'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Google Drive Link *</Label>
                      <Input
                          placeholder="https://drive.google.com/..."
                          value={driveLink}
                          onChange={(e) => setDriveLink(e.target.value)}
                      />
                    </div>
                    {isResubmit && (
                        <div>
                          <Label>Resubmission Comment <span className="text-muted-foreground text-xs">(explain what changed)</span></Label>
                          <Textarea
                              placeholder="Describe what you changed or fixed..."
                              value={resubmitComment}
                              onChange={(e) => setResubmitComment(e.target.value)}
                              rows={3}
                          />
                        </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSubmitOpen(null)}>Cancel</Button>
                    <Button onClick={() => submit(deliv)}>
                      {isResubmit ? 'Resubmit' : 'Submit'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          );
        })()}

        {/* View Submission popup */}
        {viewOpen && (
            <Dialog open={true} onOpenChange={(o) => { if (!o) setViewOpen(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {viewOpen.showResubmission ? 'Resubmission' : 'Submission'} — {viewOpen.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Google Drive Link</p>
                    <a
                        href={viewOpen.showResubmission ? viewOpen.resubmissionGoogleDriveLink : viewOpen.googleDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline break-all"
                    >
                      {viewOpen.showResubmission ? viewOpen.resubmissionGoogleDriveLink : viewOpen.googleDriveLink}
                    </a>
                  </div>
                  {viewOpen.showResubmission && viewOpen.resubmissionComment && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Resubmission Comment</p>
                        <p className="text-sm">{viewOpen.resubmissionComment}</p>
                      </div>
                  )}
                  {!viewOpen.showResubmission && viewOpen.submittedAt && (
                      <p className="text-xs text-muted-foreground">Submitted: {formatDateTime(viewOpen.submittedAt)}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewOpen(null)}>Close</Button>
                  <Button asChild>
                    <a
                        href={viewOpen.showResubmission ? viewOpen.resubmissionGoogleDriveLink : viewOpen.googleDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                      Open in Drive
                    </a>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        )}
      </div>
  );
}

// ─── Disputes Tab ─────────────────────────────────────────────────────────────

function DisputesTabContent({ teamId, isLeader }: { teamId: number; isLeader: boolean }) {
  const [disputes, setDisputes]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [raiseOpen, setRaiseOpen]     = useState(false);
  const [form, setForm]               = useState({ targetItem: '', reason: '' });
  const [rejectOpen, setRejectOpen]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pollOpen, setPollOpen]       = useState<number | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions]   = useState<string[]>(['', '']);
  const [pollDeadline, setPollDeadline] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/disputes/team/${teamId}/all`) as any;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      const withPolls = await Promise.all(
          list.map(async (d: any) => {
            if (d.status === 'OPEN') {
              try {
                const poll = await api.get(`/disputes/${d.id}/poll`) as any;
                const p = poll?.data ?? poll;
                const opts = (p?.options ?? '').replace(/^\[|\]$/g, '').split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean);
                try {
                  const results = await api.get(`/disputes/${d.id}/polls/${p.id}/results`) as any;
                  const r = results?.data ?? results ?? {};
                  const total = Object.values(r).reduce((a: any, b: any) => a + b, 0) as number;
                  return { ...d, poll: { ...p, options: opts, results: opts.map((opt: string) => ({ option: opt, count: r[opt] ?? 0, percent: total > 0 ? Math.round(((r[opt] ?? 0) / total) * 100) : 0 })) } };
                } catch { return { ...d, poll: { ...p, options: opts } }; }
              } catch { return d; }
            }
            return d;
          })
      );
      setDisputes(withPolls);
    } catch {} finally { setLoading(false); }
  }, [teamId]);

  useEffect(() => { load(); }, [load]);

  const raiseDispute = async () => {
    if (!form.targetItem.trim() || !form.reason.trim()) { toast.error('All fields required'); return; }
    try {
      await api.post('/disputes', { teamId, ...form });
      toast.success('Dispute raised');
      setRaiseOpen(false);
      setForm({ targetItem: '', reason: '' });
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const accept = async (id: number) => {
    try { await api.post(`/disputes/${id}/accept`); toast.success('Accepted'); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const reject = async (id: number) => {
    if (!rejectReason.trim()) { toast.error('Reason required'); return; }
    try {
      await api.post(`/disputes/${id}/reject`, { rejectionReason: rejectReason });
      toast.success('Rejected');
      setRejectOpen(null);
      setRejectReason('');
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const createPoll = async (disputeId: number) => {
    const valid = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || valid.length < 2 || !pollDeadline) {
      toast.error('Question, at least 2 options, and deadline required');
      return;
    }
    try {
      await api.post(`/disputes/${disputeId}/poll`, { question: pollQuestion, options: valid.join('\n'), deadline: pollDeadline });
      toast.success('Poll created');
      setPollOpen(null);
      setPollQuestion(''); setPollOptions(['', '']); setPollDeadline('');
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const vote = async (disputeId: number, pollId: number, option: string) => {
    try { await api.post(`/disputes/${disputeId}/polls/${pollId}/vote`, { chosenOption: option }); toast.success('Voted!'); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Already voted or error'); }
  };

  const resolve = async (id: number) => {
    try { await api.post(`/disputes/${id}/resolve`); toast.success('Resolved'); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Disputes</h3>
          <Dialog open={raiseOpen} onOpenChange={setRaiseOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline">Raise Dispute</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Raise a Dispute</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>What is this about? *</Label><Input value={form.targetItem} onChange={(e) => setForm({ ...form, targetItem: e.target.value })} placeholder="e.g. Task assignment" /></div>
                <div><Label>Reason *</Label><Textarea value={form.reason} onChange={(e: any) => setForm({ ...form, reason: e.target.value })} rows={4} /></div>
              </div>
              <DialogFooter><Button onClick={raiseDispute}>Submit</Button></DialogFooter>
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
                    <p className="text-xs text-muted-foreground">Raised by {d.raisedByName}</p>
                    <p className="text-sm mt-1">{d.reason}</p>
                  </div>
                  <Badge variant="secondary">{d.status}</Badge>
                </div>

                {d.status === 'REJECTED' && d.rejectionReason && (
                    <p className="text-xs text-muted-foreground border-t pt-2">❌ Rejected: {d.rejectionReason}</p>
                )}

                {isLeader && d.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => accept(d.id)}>Accept</Button>
                      <Dialog open={rejectOpen === d.id} onOpenChange={(o) => { setRejectOpen(o ? d.id : null); setRejectReason(''); }}>
                        <DialogTrigger asChild><Button size="sm" variant="outline">Reject</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Reject Dispute</DialogTitle></DialogHeader>
                          <div className="space-y-2">
                            <Label>Reason for Rejection *</Label>
                            <Textarea value={rejectReason} onChange={(e: any) => setRejectReason(e.target.value)} rows={3} />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectOpen(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => reject(d.id)}>Reject</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                )}

                {isLeader && d.status === 'OPEN' && !d.poll && (
                    <Dialog open={pollOpen === d.id} onOpenChange={(o) => { setPollOpen(o ? d.id : null); if (o) { setPollQuestion(''); setPollOptions(['', '']); setPollDeadline(''); } }}>
                      <DialogTrigger asChild><Button size="sm">Create Poll</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Create Poll</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Question *</Label><Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} /></div>
                          <div className="space-y-2">
                            <Label>Options *</Label>
                            {pollOptions.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <Input value={opt} placeholder={`Option ${idx + 1}`}
                                         onChange={(e) => { const u = [...pollOptions]; u[idx] = e.target.value; setPollOptions(u); }} />
                                  {pollOptions.length > 2 && (
                                      <Button size="icon" variant="ghost" className="shrink-0 text-destructive"
                                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                  )}
                                </div>
                            ))}
                            <Button size="sm" variant="ghost" onClick={() => setPollOptions([...pollOptions, ''])}>
                              <Plus className="h-4 w-4 mr-1" />Add Option
                            </Button>
                          </div>
                          <div><Label>Voting Deadline *</Label><Input type="datetime-local" value={pollDeadline} onChange={(e) => setPollDeadline(e.target.value)} /></div>
                        </div>
                        <DialogFooter><Button onClick={() => createPoll(d.id)}>Create Poll</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                )}

                {d.poll && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="font-medium text-sm">{d.poll.question}</p>
                      {(d.poll.options ?? []).map((opt: string) => {
                        const r = d.poll.results?.find((x: any) => x.option === opt);
                        return (
                            <div key={opt} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => vote(d.id, d.poll.id, opt)}>{opt}</Button>
                                {r && <span className="text-xs text-muted-foreground">{r.count} vote{r.count !== 1 ? 's' : ''} ({r.percent}%)</span>}
                              </div>
                              {r?.count > 0 && <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-1"><div className="h-full bg-primary" style={{ width: `${r.percent}%` }} /></div>}
                            </div>
                        );
                      })}
                      {isLeader && <Button size="sm" variant="secondary" className="mt-2" onClick={() => resolve(d.id)}>Resolve Dispute</Button>}
                    </div>
                )}
              </CardContent>
            </Card>
        ))}
      </div>
  );
}