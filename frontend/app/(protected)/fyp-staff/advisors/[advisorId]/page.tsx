'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

interface TeamItem {
    teamId: number;
    teamName: string;
    status: string;
    memberCount: number;
    projectId: number;
}

interface AdvisorInfo {
    id: number;
    name: string;
    email: string;
}

export default function FYPStaffAdvisorTeamsPage() {
    const { advisorId } = useParams<{ advisorId: string }>();
    const [advisor, setAdvisor] = useState<AdvisorInfo | null>(null);
    const [teams, setTeams]     = useState<TeamItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Load advisor info from the advisors list
                const allAdvisors = await api.get('/fyp-staff/advisors') as any;
                const advisorList = Array.isArray(allAdvisors) ? allAdvisors : allAdvisors?.data ?? [];
                const found = advisorList.find((a: any) => String(a.id) === advisorId);
                if (found) setAdvisor(found);

                // Load teams supervised by this advisor
                const data = await api.get(`/fyp-staff/advisors/${advisorId}/teams`) as any;
                setTeams(Array.isArray(data) ? data : data?.data ?? []);
            } catch (err: any) {
                toast.error(err?.response?.data?.message ?? 'Failed to load teams');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [advisorId]);

    return (
        <div className="max-w-3xl space-y-4">

            {/* Back + header */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/fyp-staff/dashboard">
                        <ArrowLeft className="h-4 w-4 mr-1" /> All Advisors
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold">
                        {advisor ? advisor.name : 'Advisor'}
                    </h1>
                    {advisor && (
                        <p className="text-xs text-muted-foreground">{advisor.email}</p>
                    )}
                </div>
            </div>

            {/* Teams list */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" /> Supervised Teams
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {loading ? (
                        [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                    ) : teams.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No teams supervised by this advisor yet.
                        </p>
                    ) : (
                        teams.map((t) => (
                            <div
                                key={t.teamId}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-sm">{t.teamName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-xs">{t.status}</Badge>
                                        <span className="text-xs text-muted-foreground">
                      {t.memberCount} member{t.memberCount !== 1 ? 's' : ''}
                    </span>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={`/fyp-staff/teams/${t.teamId}?projectId=${t.projectId}`}>
                                        View Deliverables
                                    </Link>
                                </Button>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}