import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Activity,
  Bell,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { Input } from '@/components/ui/input'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: FolderKanban,
  },
  {
    label: 'Tasks',
    path: '/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Teams',
    path: '/teams',
    icon: UsersRound,
  },
  {
    label: 'Members',
    path: '/members',
    icon: Users,
  },
  {
    label: 'Activity',
    path: '/activity',
    icon: Activity,
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: ShieldCheck,
  },
] as const
function UserMenu() {
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-2 rounded-full outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              U
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">TeamFlow User</p>
          <p className="text-xs text-muted-foreground">
            Account
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
  onClick={() => navigate({ to: '/profile' })}
>
  Profile
</DropdownMenuItem>

        <DropdownMenuItem>
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Search TeamFlow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, tasks, teams..."
          />

          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed">
            {query.trim() ? (
              <p className="text-sm text-muted-foreground">
                Search will connect to the TeamFlow API.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start typing to search TeamFlow.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
function NotificationMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">
              Notifications
            </h3>
            <p className="text-xs text-muted-foreground">
              Your latest updates
            </p>
          </div>
        </div>

        <div className="flex min-h-32 items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            No new notifications
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const currentPath = routerState.location.pathname

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event. metaKey || event.ctrlKey) && event.key.toLowerCase() ==='k') {
            event.preventDefault()
            setSearchOpen(true)
        }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
        window.removeEventListener('keydown', handleKeyDown)
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
        <GlobalSearch
            open={searchOpen}
            onOpenChange={setSearchOpen}
        />
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col',
          'border-r border-sidebar-border bg-sidebar',
          'transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              TF
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight">
                TeamFlow
              </p>
              <p className="text-xs text-muted-foreground">
                Work Management
              </p>
            </div>
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon

            const isActive =
              currentPath === item.path ||
              currentPath.startsWith(`${item.path}/`)

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  'transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs font-medium">TeamFlow</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Team work execution platform
            </p>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="md:pl-64">
        {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
  <div className="flex items-center">
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
      onClick={() => setMobileOpen(true)}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>

    <div className="ml-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        TF
      </div>

      <span className="text-sm font-semibold">
        TeamFlow
      </span>
    </div>
  </div>

  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={() => setSearchOpen(true)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Search"
    >
      <Search className="h-4 w-4" />
    </button>

    <NotificationMenu />

    <ThemeToggle />

    <UserMenu />
  </div>
</header>
<header className="sticky top-0 z-30 hidden h-16 items-center justify-end gap-1 border-b bg-background/95 px-6 backdrop-blur md:flex">
  <button
    type="button"
    onClick={() => setSearchOpen(true)}
    className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    aria-label="Search"
  >
    <Search className="h-4 w-4" />
    <span>Search</span>
    <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] sm:inline-block">
      ⌘ K
    </kbd>
  </button>

  <NotificationMenu />

  <ThemeToggle />
<UserMenu />
</header>

       
{/* Page content */}
<main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
  <div className="mx-auto w-full max-w-[1600px] space-y-8">
    {children}
  </div>
</main>

      </div>
    </div>
  )
}

export function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShellContent>{children}</AppShellContent>
}