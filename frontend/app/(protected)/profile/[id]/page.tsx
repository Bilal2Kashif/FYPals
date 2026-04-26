'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Loader2, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

const editSchema = z.object({
  name: z.string().min(2),
  bio: z.string().optional(),
  skills: z.string().optional(),
  gpa: z.coerce.number().min(0).max(4).optional().or(z.literal('')),
  interests: z.string().optional(),
  pastProjects: z.string().optional(),
  department: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isOwn = authUser?.id?.toString() === id;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const load = async () => {
    try {
      const data = await api.get(`/users/${id}/profile`) as unknown as User;
      setProfile(data);
      reset({
        name: data.name ?? '',
        bio: data.bio ?? '',
        skills: data.skills ?? '',
        gpa: data.gpa ?? ('' as any),
        interests: data.interests ?? '',
        pastProjects: data.pastProjects ?? '',
        department: data.department ?? '',
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const onSave = async (data: EditValues) => {
    setSaving(true);
    try {
      const updated = await api.put('/users/me/profile', {
        ...data,
        gpa: data.gpa === '' ? undefined : data.gpa,
      }) as unknown as User;
      setProfile(updated);
      updateUser(updated);
      toast.success('Profile updated');
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile) return <p className="text-muted-foreground">Profile not found.</p>;

  const skills = profile.skills ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const initials = profile.name?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{profile.name}</h1>
                <Badge variant="secondary">{profile.role}</Badge>
                {profile.profileComplete ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Complete
                  </Badge>
                ) : (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Incomplete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {profile.gpa != null && (
                <p className="text-sm mt-1">GPA: <span className="font-medium">{profile.gpa}</span></p>
              )}
            </div>
            {isOwn && (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSave)} className="space-y-3">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input {...register('name')} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Bio</Label>
                      <Textarea {...register('bio')} placeholder="Tell others about yourself..." />
                    </div>
                    <div className="space-y-1">
                      <Label>Skills (comma-separated)</Label>
                      <Input {...register('skills')} placeholder="React, Java, ML..." />
                    </div>
                    <div className="space-y-1">
                      <Label>GPA (0-4)</Label>
                      <Input type="number" step="0.01" {...register('gpa')} />
                      {errors.gpa && <p className="text-xs text-destructive">{errors.gpa.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Interests</Label>
                      <Input {...register('interests')} placeholder="AI, Fintech, Healthcare..." />
                    </div>
                    <div className="space-y-1">
                      <Label>Past Projects</Label>
                      <Textarea {...register('pastProjects')} placeholder="Describe previous projects..." />
                    </div>
                    <div className="space-y-1">
                      <Label>Department</Label>
                      <Input {...register('department')} placeholder="Computer Science..." />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {profile.bio && (
        <Card>
          <CardHeader><CardTitle className="text-base">Bio</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{profile.bio}</p></CardContent>
        </Card>
      )}

      {skills.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {profile.interests && (
        <Card>
          <CardHeader><CardTitle className="text-base">Interests</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{profile.interests}</p></CardContent>
        </Card>
      )}

      {profile.pastProjects && (
        <Card>
          <CardHeader><CardTitle className="text-base">Past Projects</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-line">{profile.pastProjects}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
