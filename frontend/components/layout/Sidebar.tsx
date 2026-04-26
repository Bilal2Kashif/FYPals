'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Search,
  GraduationCap,
  UserCog,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentLinks: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard',       icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Posts',     href: '/posts',            icon: <FileText        className="h-4 w-4" /> },
  { label: 'My Team',   href: '/teams',            icon: <Users           className="h-4 w-4" /> },
  { label: 'Search',    href: '/search',           icon: <Search          className="h-4 w-4" /> },
];

const advisorLinks: NavItem[] = [
  { label: 'Dashboard', href: '/advisor/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
];

const adminLinks: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Users',     href: '/admin/users',     icon: <UserCog         className="h-4 w-4" /> },
  { label: 'Teams',     href: '/admin/teams',     icon: <Users           className="h-4 w-4" /> },
  { label: 'Posts',     href: '/admin/posts',     icon: <FileText        className="h-4 w-4" /> },
];

// FYP Staff nav — browse advisors → their teams → deliverables
const fypStaffLinks: NavItem[] = [
  { label: 'Dashboard', href: '/fyp-staff/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
];

export function Sidebar() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const links =
      user?.role === 'ADMIN'     ? adminLinks     :
          user?.role === 'ADVISOR'   ? advisorLinks   :
              user?.role === 'FYP_STAFF' ? fypStaffLinks  :
                  studentLinks;

  return (
      <aside className="w-56 shrink-0 border-r bg-background h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
        <nav className="flex flex-col gap-1 p-4">
          {links.map((item) => (
              <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      pathname === item.href || pathname.startsWith(item.href + '/')
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground'
                  )}
              >
                {item.icon}
                {item.label}
              </Link>
          ))}
        </nav>
      </aside>
  );
}