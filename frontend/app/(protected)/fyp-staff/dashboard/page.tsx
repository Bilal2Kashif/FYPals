'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { GraduationCap, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface AdvisorItem {
    id: number;
    name: string;
    email: string;
    bio: string;
    profileComplete: boolean;
}

export default function FYPStaffDashboardPage() {
    const { user: authUser } = useAuthStore();
    const [profile, setProfile]     = useState<any>(null);
    const [advisors, setAdvisors]   = useState<AdvisorItem[]>([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [p, data] = await Promise.all([
                    api.get('/users/me/profile') as any,
                    api.get('/fyp-staff/advisors') as any,
                ]);
                setProfile(p);
                setAdvisors(Array.isArray(data) ? data : data?.data ?? []);
            } catch (err: any) {
                toast.error(err?.response?.data?.message ?? 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const profileComplete = profile?.profileComplete ?? false;

    return (
        <div className="max-w-3xl space-y-6">
            {/* Welcome card */}
            <Card>
                <CardContent className="p-6">
                    <h1 className="text-2xl font-bold">Welcome, {profile?.name ?? authUser?.name}</h1>
                    <p className="text-muted-foreground">
                        {profile?.designation
                            ? `FYP Office Staff — ${profile.designation}`
                            : 'FYP Office Staff — Review deliverable submissions'}
                    </p>
                </CardContent>
            </Card>

            {/* FYP Staff profile completion banner — staff-specific wording */}
            {!profileComplete && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50 text-purple-800">
                    <ClipboardList className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Set up your staff profile</p>
                        <p className="text-sm mt-1">
                            Add your designation (e.g. FYP Coordinator) so the system can properly identify your role.
                            This helps teams and advisors know who is reviewing their submissions.
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="mt-2 border-purple-300 hover:bg-purple-100"
                        >
                            <Link href={`/profile/${profile?.id ?? authUser?.id}`}>
                                Complete Staff Profile
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-3 rounded-full bg-purple-100">
                            <GraduationCap className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{advisors.length}</p>
                            <p className="text-sm text-muted-foreground">Advisors on Platform</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Advisors list */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">All Advisors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {loading ? (
                        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                    ) : advisors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No advisors registered yet.</p>
                    ) : (
                        advisors.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="text-xs">
                                            {a.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{a.name}</p>
                                        <p className="text-xs text-muted-foreground">{a.email}</p>
                                        {a.bio && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 italic">{a.bio}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {a.profileComplete && (
                                        <Badge variant="outline" className="text-xs">Profile Complete</Badge>
                                    )}
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/fyp-staff/advisors/${a.id}`}>View Teams</Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}