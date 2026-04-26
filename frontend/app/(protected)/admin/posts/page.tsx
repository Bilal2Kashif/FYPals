'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { Post, Page } from '@/types';

const CATEGORIES = ['ALL', 'LOOKING_FOR_MEMBER', 'PROJECT_IDEA', 'GENERAL'];

const CATEGORY_LABELS: Record<string, string> = {
  LOOKING_FOR_MEMBER: 'Looking for Member',
  PROJECT_IDEA: 'Project Idea',
  GENERAL: 'General',
};

export default function AdminPostsPage() {
  const [data, setData] = useState<Page<Post> | null>(null);
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params: any = { page: p, size: 15 };
      if (category !== 'ALL') params.category = category;
      const res = await api.get('/admin/posts', { params }) as unknown as Page<Post>;
      setData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(0); load(0); }, [category]);
  useEffect(() => { load(page); }, [page]);

  const deletePost = async (id: number) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      toast.success('Post deleted');
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete post');
    }
  };

  const posts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <span className="text-sm text-muted-foreground">{data?.totalElements ?? 0} total</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Category:</span>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c === 'ALL' ? 'All Categories' : CATEGORY_LABELS[c] ?? c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Author</th>
              <th className="text-left p-3 font-medium">Votes</th>
              <th className="text-left p-3 font-medium">Comments</th>
              <th className="p-3 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-t">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="p-3"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">No posts found.</td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium max-w-[200px] truncate">{p.title}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.authorName}</td>
                  <td className="p-3 text-muted-foreground">{p.voteCount ?? 0}</td>
                  <td className="p-3 text-muted-foreground">{p.commentCount ?? 0}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" asChild title="View post">
                        <Link href={`/posts/${p.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Delete post"
                        onClick={() => deletePost(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
