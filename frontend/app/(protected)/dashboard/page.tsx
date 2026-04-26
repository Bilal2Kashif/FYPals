'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTimeAgo } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { User, Notification } from '@/types';

export default function DashboardPage() {
  const { user: authUser } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser?.role === 'ADMIN') {
      router.replace('/admin/dashboard');
      return;
    }
    if (authUser?.role === 'ADVISOR') {
      router.replace('/advisor/dashboard');
      return;
    }

    const load = async () => {
      try {
        const [p, n] = await Promise.all([
          api.get('/users/me/profile') as unknown as Promise<User>,
          api.get('/notifications', { params: { size: 5 } }) as unknown as Promise<Notification[]>,
        ]);
        setProfile(p);
        setNotifications(Array.isArray(n) ? n : (n as any)?.content ?? []);
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authUser?.role]);

  if (loading) {
    return (
        <div className="space-y-6">
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
    );
  }

  return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile?.name ?? authUser?.name}!</h1>
          <p className="text-muted-foreground mt-1">
            Role: <Badge variant="secondary">{profile?.role ?? authUser?.role}</Badge>
          </p>
        </div>

        {profile && !profile.profileComplete && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Complete your profile</p>
                <p className="text-sm mt-1">Add your skills, GPA, and bio to help others find you.</p>
                <Button size="sm" variant="outline" asChild className="mt-2 border-amber-300 hover:bg-amber-100">
                  <Link href={`/profile/${authUser?.id}`}>Edit Profile</Link>
                </Button>
              </div>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href="/teams" className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium">My Team</p>
                <p className="text-xs text-muted-foreground">View or form your team</p>
              </Link>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href="/posts" className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium">Browse Posts</p>
                <p className="text-xs text-muted-foreground">Explore ideas and projects</p>
              </Link>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href="/search" className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium">Search Students</p>
                <p className="text-xs text-muted-foreground">Find teammates by skills</p>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
                notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.read ? 'text-muted-foreground' : 'font-medium'}`}>{n.message}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                ))
            )}
            {notifications.length > 0 && (
                <Button variant="ghost" size="sm" asChild className="w-full mt-2">
                  <Link href="/notifications">View all notifications</Link>
                </Button>
            )}
          </CardContent>
        </Card>
      </div>
  );
}