'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import React from 'react';
import api from '@/lib/api';

// ── Date helpers ─────────────────────────────────────────────────────────────
function formatDate(raw: string | null | undefined): string {
    if (!raw) return '—';
    try {
        return new Date(raw).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    } catch { return raw; }
}

function formatDateTime(raw: string | null | undefined): string {
    if (!raw) return '—';
    try {
        return new Date(raw).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return raw; }
}

const STATUS_COLORS: Record<string, string> = {
    PENDING:           'secondary',
    SUBMITTED:         'default',
    APPROVED:          'default',
    CHANGES_REQUESTED: 'destructive',
};

export default function FYPStaffTeamDeliverablesPage() {
    const { teamId }   = useParams<{ teamId: string }>();
    const searchParams = useSearchParams();
    const projectId    = searchParams.get('projectId');

    const [teamName, setTeamName]         = useState<string>('');
    const [deliverables, setDeliverables] = useState<any[]>([]);
    const [loading, setLoading]           = useState(true);

    // Comment state
    const [commentOpen, setCommentOpen] = useState<number | null>(null);
    const [comment, setComment]         = useState('');
    const [submitting, setSubmitting]   = useState(false);

    // View submission popup
    const [viewOpen, setViewOpen] = useState<any | null>(null);

    const load = async () => {
        try {
            const team = await api.get(`/teams/${teamId}`) as any;
            setTeamName(team?.teamName ?? `Team ${teamId}`);

            if (projectId) {
                const data = await api.get(`/deliverables/project/${projectId}`) as any;
                const list = Array.isArray(data) ? data : data?.data ?? [];
                setDeliverables(list.filter((d: any) => d.status !== 'PENDING'));
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to load deliverables');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [teamId, projectId]);

    const submitComment = async (deliverableId: number) => {
        if (!comment.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/deliverables/${deliverableId}/feedback`, {
                comment,
                callerRole: 'FYP_STAFF',
            });
            toast.success('Comment submitted');
            setCommentOpen(null);
            setComment('');
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to submit comment');
        } finally {
            setSubmitting(false);
        }
    };

    const backHref = '/fyp-staff/dashboard';

    return (
        <React.Fragment>
            <div className="max-w-3xl space-y-4">

                {/* Header */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={backHref}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold">{teamName} — Deliverables</h1>
                </div>

                <p className="text-sm text-muted-foreground">
                    Showing submitted deliverables only. You can leave comments but cannot change status.
                </p>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-28 w-full" />
                        ))}
                    </div>
                ) : deliverables.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                        <p className="text-lg">📭</p>
                        <p className="font-medium">No submitted deliverables yet.</p>
                        <p className="text-sm">Check back when the team has made a submission.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deliverables.map((d: any) => (
                            <Card key={d.id}>
                                <CardContent className="p-4 space-y-3">

                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium">{d.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Deadline: {formatDate(d.deadline)}
                                            </p>
                                            {d.submittedAt && (
                                                <p className="text-xs text-muted-foreground">
                                                    Submitted: {formatDateTime(d.submittedAt)}
                                                </p>
                                            )}
                                            {d.googleDriveLink && (
                                                <button
                                                    type="button"
                                                    onClick={() => setViewOpen(d)}
                                                    className="text-xs text-primary underline hover:no-underline"
                                                >
                                                    View Submission
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant={STATUS_COLORS[d.status] as any}>
                                                {d.status}
                                            </Badge>

                                            <Dialog
                                                open={commentOpen === d.id}
                                                onOpenChange={(o) => {
                                                    setCommentOpen(o ? d.id : null);
                                                    if (!o) setComment('');
                                                }}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline">
                                                        Leave Comment
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Leave a Comment</DialogTitle>
                                                    </DialogHeader>
                                                    <p className="text-sm text-muted-foreground">
                                                        Your comment will be visible to the team and advisor.
                                                        You cannot change the deliverable status.
                                                    </p>
                                                    <div className="space-y-2">
                                                        <Label>Comment</Label>
                                                        <Textarea
                                                            rows={5}
                                                            placeholder="Write your observations or notes here..."
                                                            value={comment}
                                                            onChange={(e) => setComment(e.target.value)}
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            onClick={() => submitComment(d.id)}
                                                            disabled={submitting}
                                                        >
                                                            {submitting && (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            )}
                                                            Submit Comment
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>

                                    {d.feedback && (
                                        <div className="p-3 rounded-md bg-muted/50 border text-sm space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Advisor Feedback
                                            </p>
                                            <p>{d.feedback.comment}</p>
                                            <Badge
                                                variant={
                                                    d.feedback.decision === 'APPROVED'
                                                        ? 'default'
                                                        : 'destructive'
                                                }
                                            >
                                                {d.feedback.decision}
                                            </Badge>
                                        </div>
                                    )}

                                    {(d.staffComments ?? []).map((c: any) => (
                                        <div
                                            key={c.id}
                                            className="p-3 rounded-md border border-primary/20 bg-primary/5 text-sm space-y-1"
                                        >
                                            <p className="text-xs font-medium text-primary">Staff Comment</p>
                                            <p className="text-foreground">{c.comment}</p>
                                        </div>
                                    ))}

                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

            </div>

            {/* View Submission popup for FYP Staff */}
            {viewOpen !== null && (
                <Dialog
                    open={viewOpen !== null}
                    onOpenChange={(o) => { if (!o) setViewOpen(null); }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Submission — {viewOpen.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Google Drive Link
                                </p>
                                <a
                                    href={viewOpen.googleDriveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary underline break-all"
                                >
                                    {viewOpen.googleDriveLink}
                                </a>
                            </div>
                            {viewOpen.submittedAt && (
                                <p className="text-xs text-muted-foreground">
                                    Submitted: {formatDateTime(viewOpen.submittedAt)}
                                </p>
                            )}
                            {viewOpen.resubmissionComment && (
                                <div className="p-3 rounded-md border border-primary/20 bg-primary/5">
                                    <p className="text-xs font-medium text-primary mb-1">
                                        Student&apos;s resubmission note
                                    </p>
                                    <p className="text-sm text-foreground">
                                        {viewOpen.resubmissionComment}
                                    </p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setViewOpen(null)}>
                                Close
                            </Button>
                            <Button asChild>
                                <a
                                    href={viewOpen.googleDriveLink}
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
        </React.Fragment>
    );
}