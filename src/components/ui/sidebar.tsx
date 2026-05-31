"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  FileText,
  Settings,
  ChevronsUpDown,
  LogOut,
  UserCircle,
  Bell,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/components/ui/notification-provider";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.5rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween" as const,
  ease: [0.4, 0, 0.2, 1] as const,
  duration: 0.2,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

interface User {
  id: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  email: string;
}

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const { notifications, removeNotification, clearAll } = useNotifications();

  useEffect(() => {
    setMounted(true);

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users?me=true');
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sl-sidebar-width',
      isCollapsed ? '3.5rem' : '15rem'
    );
  }, [isCollapsed]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth?action=logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = '/login/auth';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'ADMINISTRATOR',
      operator: 'OPERATOR',
      viewer: 'VIEWER',
    };
    return roleMap[role] || role.toUpperCase();
  };

  if (!mounted) {
    return (
      <>
        <div className="fixed left-0 z-40 h-full w-[3.5rem] shrink-0 border-r border-[#e8edf4] bg-white" />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            aria-hidden="true"
            className="sl-sidebar-expanded-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionProps}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={cn(
          "sidebar fixed left-0 z-40 h-full shrink-0 border-r border-[#e8edf4] bg-white"
        )}
        initial={isCollapsed ? "closed" : "open"}
        animate={isCollapsed ? "closed" : "open"}
        variants={sidebarVariants}
        transition={transitionProps}
      >
      <motion.div
        className={`relative z-40 flex h-full shrink-0 flex-col bg-white transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col">
            {/* Logo Section */}
            <div className="flex h-[68px] w-full shrink-0 items-center border-b border-[#f0f4f8] px-3.5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a2d5a]">
                  <Image src="/SkyWhite.png" width={20} height={20} alt="SkyLedger" />
                </div>
                <motion.div
                  variants={variants}
                  className="flex flex-col overflow-hidden"
                >
                  <span className="text-xs font-bold leading-tight tracking-tight text-[#1a2d5a]">
                    SkyLedger
                  </span>
                  <span className="text-[7.5px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                    CARGO OPERATIONS
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col">
                <ScrollArea className="h-16 grow py-3">
                  <div className={cn("flex w-full flex-col gap-0.5")}>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "relative flex h-8 w-full flex-row items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]",
                        pathname === "/dashboard" &&
                          "bg-[#f0f4ff] font-semibold text-[#1a2d5a]",
                      )}
                    >
                      {pathname === "/dashboard" && (
                        <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-[#1a2d5a]" />
                      )}
                      <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                      <motion.span variants={variants}>
                        Dashboard
                      </motion.span>
                    </Link>
                    <Link
                      href="/shipments"
                      className={cn(
                        "relative flex h-8 w-full flex-row items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]",
                        pathname?.includes("shipments") &&
                          "bg-[#f0f4ff] font-semibold text-[#1a2d5a]",
                      )}
                    >
                      {pathname?.includes("shipments") && (
                        <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-[#1a2d5a]" />
                      )}
                      <Package className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                      <motion.span variants={variants}>
                        Shipments
                      </motion.span>
                    </Link>
                    <Link
                      href="/reports"
                      className={cn(
                        "relative flex h-8 w-full flex-row items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]",
                        pathname?.includes("reports") &&
                          "bg-[#f0f4ff] font-semibold text-[#1a2d5a]",
                      )}
                    >
                      {pathname?.includes("reports") && (
                        <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-[#1a2d5a]" />
                      )}
                      <FileText className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                      <motion.span variants={variants}>
                        Reports
                      </motion.span>
                    </Link>
                    <Link
                      href="/settings"
                      className={cn(
                        "relative flex h-8 w-full flex-row items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]",
                        pathname?.includes("settings") &&
                          "bg-[#f0f4ff] font-semibold text-[#1a2d5a]",
                      )}
                    >
                      {pathname?.includes("settings") && (
                        <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-[#1a2d5a]" />
                      )}
                      <Settings className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                      <motion.span variants={variants}>
                        Settings
                      </motion.span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        href="/account-management"
                        className={cn(
                          "relative flex h-8 w-full flex-row items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]",
                          pathname?.includes("account-management") &&
                            "bg-[#f0f4ff] font-semibold text-[#1a2d5a]",
                        )}
                      >
                        {pathname?.includes("account-management") && (
                          <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-r-sm bg-[#1a2d5a]" />
                        )}
                        <Users className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        <motion.span variants={variants}>
                          Manajemen Akun
                        </motion.span>
                      </Link>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Bottom Section */}
              <div className="flex flex-col border-t border-[#f0f4f8] py-2">
                {/* Collapse Toggle */}
                <button
                  type="button"
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onClick={() => setIsCollapsed((value) => !value)}
                  className="flex h-8 w-full flex-row items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#64748b] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4 shrink-0" strokeWidth={2} />
                  ) : (
                    <PanelLeftClose className="h-4 w-4 shrink-0" strokeWidth={2} />
                  )}
                  <motion.span variants={variants}>
                    {isCollapsed ? "Expand" : "Collapse"}
                  </motion.span>
                </button>

                {/* Help Button */}
                <button
                  className="flex h-8 w-full flex-row items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#94a3b8] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                  title="Help & Support"
                >
                  <HelpCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <motion.span variants={variants}>
                    Support
                  </motion.span>
                </button>

                {/* Notification Button */}
                <button
                  className={cn(
                    "flex h-8 w-full flex-row items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]",
                    showNotifications ? "bg-[#f0f4ff] text-[#1a2d5a]" : "text-[#94a3b8]"
                  )}
                  title="Notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <div className="relative">
                    <Bell className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {notifications.length > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  <motion.span variants={variants}>
                    Notifications
                  </motion.span>
                </button>

                {/* User Account Dropdown */}
                <div className="px-0 py-1">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full" asChild>
                      <button className="flex h-auto w-full flex-row items-center gap-2.5 rounded-none px-3.5 py-2 text-xs transition-all hover:bg-[#f1f5f9]">
                        <Avatar className="h-8 w-8 shrink-0 rounded-lg bg-[#1a2d5a]">
                          <AvatarFallback className="rounded-lg bg-[#1a2d5a] text-[10px] font-bold text-white">
                            {loading ? '--' : user ? getInitials(user.name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <motion.div
                          variants={variants}
                          className="flex w-full flex-col items-start"
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#1a2d5a]">
                              {loading ? 'Loading...' : user?.name || 'User'}
                            </span>
                            <ChevronsUpDown className="h-3 w-3 text-[#94a3b8]" />
                          </div>
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                            {loading ? '--' : user ? getRoleDisplay(user.role) : 'ROLE'}
                          </span>
                        </motion.div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      sideOffset={8}
                      align="end"
                      className="w-64 rounded-lg border border-[#e8edf4] bg-white p-2 shadow-lg"
                    >
                      <div className="flex flex-row items-center gap-3 px-2 py-2.5">
                        <Avatar className="h-10 w-10 rounded-lg bg-[#1a2d5a]">
                          <AvatarFallback className="rounded-lg bg-[#1a2d5a] text-xs font-bold text-white">
                            {loading ? '--' : user ? getInitials(user.name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold text-[#1a2d5a]">
                            {loading ? 'Loading...' : user?.name || 'User'}
                          </span>
                          <span className="truncate text-xs text-[#64748b]" title={loading ? '--' : user?.email || 'user@skyledger.com'}>
                            {loading ? '--' : user?.email || 'user@skyledger.com'}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="my-1 bg-[#f0f4f8]" />
                      <DropdownMenuItem
                        asChild
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1a2d5a]"
                      >
                        <Link href="/settings">
                          <UserCircle className="h-4 w-4" strokeWidth={2} /> Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1a2d5a]"
                      >
                        <Link href="/settings">
                          <Settings className="h-4 w-4" strokeWidth={2} /> Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 bg-[#f0f4f8]" />
                      <DropdownMenuItem
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-[#94a3b8] hover:bg-[#fff5f5] hover:text-[#ef4444]"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" strokeWidth={2} /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>

    {/* Notification Panel */}
    <AnimatePresence>
      {showNotifications && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowNotifications(false)}
          />

          {/* Notification Panel */}
          <motion.div
            className="fixed right-4 top-4 z-50 w-96 rounded-lg border border-[#e8edf4] bg-white shadow-xl"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#f0f4f8] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#1a2d5a]">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs font-medium text-[#64748b] hover:text-[#1a2d5a]"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Notification List */}
            <ScrollArea className="max-h-[500px]">
              <div className="p-3">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="mb-2 h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-[#94a3b8]">No notifications</p>
                    <p className="text-xs text-[#cbd5e1]">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-lg border border-[#e8edf4] bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-[#1a2d5a]">{notification.title}</h4>
                            {notification.description && (
                              <p className="mt-1 text-xs text-[#64748b]">{notification.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-[#94a3b8] hover:text-[#1a2d5a]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
