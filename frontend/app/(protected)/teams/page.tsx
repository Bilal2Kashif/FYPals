'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

const schema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function TeamsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const p = await api.get('/users/me/profile') as unknown as User;
        setProfile(p);
        if (p.teamId) {
          router.replace(`/teams/${p.teamId}`);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setCreating(true);
    try {
      const team = await api.post(`/teams?teamName=${encodeURIComponent(data.teamName)}`) as unknown as { id: number };
      toast.success('Team created!');
      router.push(`/teams/${team.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 max-w-md" />;
  }

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="p-4 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">Form Your Team</CardTitle>
          <CardDescription className="text-center">
            Start a new team for your Final Year Project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Team Name</Label>
              <Input placeholder="e.g. Team Alpha" {...register('teamName')} />
              {errors.teamName && <p className="text-xs text-destructive">{errors.teamName.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Team
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
