'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Team, Deliverable } from '@/types';

const STATUS_VARIANTS: Record<string, any> = {
  PENDING: 'secondary',
  SUBMITTED: 'info',
  APPROVED: 'success',
  CHANGES_REQUESTED: 'warning',
};

export default function DeliverablesPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState<number | null>(null);
  const [driveLink, setDriveLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const t = await api.get(`/teams/${teamId}`) as unknown as Team;
      setTeam(t);
      if (t.project?.id) {
        const data = await api.get(`/deliverables/project/${t.project.id}`) as unknown as Deliverable[];
        setDeliverables(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [teamId]);

  const submit = async (id: number) => {
    if (!driveLink.trim()) { toast.error('Please enter a Google Drive link'); return; }
    setSubmitting(true);
    try {
      await api.post(`/deliverables/${id}/submit`, { googleDriveLink: driveLink });
      toast.success('Deliverable submitted!');
      setSubmitOpen(null);
      setDriveLink('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/teams/${teamId}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <h1 className="text-xl font-bold">Deliverables</h1>
      </div>

      {deliverables.length === 0 && (
        <p className="text-sm text-muted-foreground">No deliverables assigned yet.</p>
      )}

      {deliverables.map((d) => (
        <Card key={d.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">Deadline: {d.deadline}</p>
                {d.submittedAt && (
                  <p className="text-xs text-muted-foreground">Submitted: {d.submittedAt}</p>
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
                {d.status === 'PENDING' && (
                  <Dialog open={submitOpen === d.id} onOpenChange={(o) => setSubmitOpen(o ? d.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm">Submit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Submit Deliverable</DialogTitle></DialogHeader>
                      <div className="space-y-2">
                        <Label>Google Drive Link</Label>
                        <Input
                          placeholder="https://drive.google.com/file/..."
                          value={driveLink}
                          onChange={(e) => setDriveLink(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Share the link with &quot;Anyone with the link&quot; access.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => submit(d.id)} disabled={submitting}>
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {d.feedback && (
              <div className="p-3 rounded-md bg-muted/50 border text-sm space-y-1">
                <p className="font-medium text-xs text-muted-foreground">Advisor Feedback</p>
                <p>{d.feedback.comment}</p>
                <Badge variant={d.feedback.decision === 'APPROVED' ? 'success' : 'warning'}>
                  {d.feedback.decision}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
