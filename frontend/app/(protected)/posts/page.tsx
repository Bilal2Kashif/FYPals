'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PostCard, PostCardSkeleton } from '@/components/shared/PostCard';
import api from '@/lib/api';
import type { Post, Page, PostCategory } from '@/types';

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'LOOKING_FOR_MEMBER', label: 'Looking for Member' },
  { value: 'PROJECT_IDEA', label: 'Project Idea' },
  { value: 'GENERAL', label: 'General' },
];

const createSchema = z.object({
  title: z.string().min(3, 'Title too short'),
  description: z.string().min(10, 'Description too short'),
  category: z.enum(['LOOKING_FOR_MEMBER', 'PROJECT_IDEA', 'GENERAL']),
});
type CreateValues = z.infer<typeof createSchema>;

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('GENERAL');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { category: 'GENERAL' },
  });

  const load = async (pg = 0) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: pg, size: 10 };
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      const data = await api.get('/posts', { params }) as any;
      if (data && Array.isArray(data.content)) {
        setPosts(data.content);
        setTotalPages(data.totalPages ?? 1);
        setPage(pg);
      } else if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, [categoryFilter]);

  const handleVote = (postId: number, voteCount: number, upvoteCount: number, downvoteCount: number) => {
    setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, voteCount, upvoteCount, downvoteCount } as any : p
    ));
  };

  const onCreatePost = async (data: CreateValues) => {
    setCreating(true);
    try {
      await api.post('/posts', data);
      toast.success('Post created!');
      setDialogOpen(false);
      reset();
      load(0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Community Board</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['ALL', ...CATEGORIES.map((c) => c.value)] as const).map((cat) => (
              <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'ALL' ? 'All' : CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
              </Button>
          ))}
        </div>

        {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <PostCardSkeleton key={i} />)}
            </div>
        ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <p className="text-lg font-medium">No posts yet.</p>
              <p className="text-sm">Be the first to share an idea!</p>
              <Button onClick={() => setDialogOpen(true)}>Create Post</Button>
            </div>
        ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                  <PostCard key={post.id} post={post} onVote={handleVote} />
              ))}
            </div>
        )}

        {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => load(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Next</Button>
            </div>
        )}

        <Button
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg p-0"
            onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onCreatePost)} className="space-y-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input {...register('title')} placeholder="Post title..." />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea {...register('description')} placeholder="Describe your post..." rows={4} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                    value={selectedCategory}
                    onValueChange={(val: PostCategory) => {
                      setSelectedCategory(val);
                      setValue('category', val);
                    }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}