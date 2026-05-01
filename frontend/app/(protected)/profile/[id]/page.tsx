'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({
    name: '', bio: '', skills: '',
    // Student fields
    gpa: '', interests: '', pastProjects: '',
    // Advisor fields
    department: '', researchAreas: '',
    // FYP Staff fields
    designation: '',
  });

  const load = async () => {
    try {
      const p = await api.get(`/users/${id}/profile`) as unknown as User;
      setProfile(p);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const isOwnProfile = authUser?.id === Number(id);

  const openEdit = () => {
    if (!profile) return;
    setForm({
      name:         profile.name ?? '',
      bio:          profile.bio  ?? '',
      skills:       profile.skills ?? '',
      gpa:          (profile.gpa?.toString()) ?? '',
      interests:    profile.interests ?? '',
      pastProjects: profile.pastProjects ?? '',
      department:   profile.department ?? '',
      researchAreas: (profile as any).researchAreas ?? '',
      designation:  (profile as any).designation ?? '',
    });
    setEditOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        name:   form.name,
        bio:    form.bio,
        skills: form.skills,
      };

      const role = profile?.role ?? authUser?.role;

      if (role === 'STUDENT') {
        if (form.gpa) payload.gpa = parseFloat(form.gpa);
        payload.interests    = form.interests;
        payload.pastProjects = form.pastProjects;
      } else if (role === 'ADVISOR') {
        payload.department    = form.department;
        payload.researchAreas = form.researchAreas;
      } else if (role === 'FYP_STAFF') {
        payload.designation = form.designation;
      }
      // ADMIN: only common fields (name, bio, skills)

      const updated = await api.put('/users/me/profile', payload) as unknown as User;
      setProfile(updated);
      updateUser({ name: updated.name, profileComplete: updated.profileComplete });
      toast.success('Profile updated!');
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
          <Skeleton className="h-24 w-full" />
        </div>
    );
  }

  if (!profile) return <p className="text-muted-foreground">Profile not found.</p>;

  const role = profile.role;
  // Admin and FYP Staff don't need profile completion
  const needsProfileComplete = role === 'STUDENT' || role === 'ADVISOR';

  return (
      <div className="max-w-2xl space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{profile.role}</Badge>
                  {needsProfileComplete && (
                      profile.profileComplete
                          ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3.5 w-3.5" /> Profile Complete</span>
                          : <span className="flex items-center gap-1 text-xs text-amber-600"><AlertCircle className="h-3.5 w-3.5" /> Incomplete Profile</span>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">{profile.email}</p>
              </div>
              {isOwnProfile && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={openEdit}>Edit Profile</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
                        <div><Label>Skills (comma separated)</Label><Input value={form.skills} placeholder="React, Java, Python..." onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>

                        {/* Student-specific fields */}
                        {role === 'STUDENT' && (
                            <>
                              <div><Label>GPA</Label><Input type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={(e) => setForm({ ...form, gpa: e.target.value })} placeholder="e.g. 3.5" /></div>
                              <div><Label>Interests</Label><Input value={form.interests} placeholder="AI, Web Dev..." onChange={(e) => setForm({ ...form, interests: e.target.value })} /></div>
                              <div><Label>Past Projects</Label><Textarea value={form.pastProjects} onChange={(e) => setForm({ ...form, pastProjects: e.target.value })} rows={2} /></div>
                            </>
                        )}

                        {/* Advisor-specific fields */}
                        {role === 'ADVISOR' && (
                            <>
                              <div><Label>Department</Label><Input value={form.department} placeholder="e.g. Computer Science" onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
                              <div><Label>Research Areas</Label><Input value={form.researchAreas} placeholder="AI, Machine Learning..." onChange={(e) => setForm({ ...form, researchAreas: e.target.value })} /></div>
                            </>
                        )}

                        {/* FYP Staff-specific fields */}
                        {role === 'FYP_STAFF' && (
                            <div><Label>Designation</Label><Input value={form.designation} placeholder="e.g. FYP Coordinator" onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button onClick={save} disabled={saving}>
                          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {profile.bio && (
            <Card>
              <CardHeader><CardTitle className="text-sm">About</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{profile.bio}</p></CardContent>
            </Card>
        )}

        {profile.skills && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Skills</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.split(',').map((s) => (
                      <Badge key={s.trim()} variant="outline">{s.trim()}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
        )}

        {/* Student-specific info */}
        {role === 'STUDENT' && (profile.gpa || profile.interests || profile.pastProjects) && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Academic Info</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {profile.gpa && <p className="text-sm"><span className="font-medium">GPA:</span> {profile.gpa}</p>}
                {profile.interests && <p className="text-sm"><span className="font-medium">Interests:</span> {profile.interests}</p>}
                {profile.pastProjects && <p className="text-sm"><span className="font-medium">Past Projects:</span> {profile.pastProjects}</p>}
              </CardContent>
            </Card>
        )}

        {/* Advisor-specific info */}
        {role === 'ADVISOR' && ((profile as any).department || (profile as any).researchAreas) && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Academic Info</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(profile as any).department && <p className="text-sm"><span className="font-medium">Department:</span> {(profile as any).department}</p>}
                {(profile as any).researchAreas && <p className="text-sm"><span className="font-medium">Research Areas:</span> {(profile as any).researchAreas}</p>}
              </CardContent>
            </Card>
        )}
      </div>
  );
}