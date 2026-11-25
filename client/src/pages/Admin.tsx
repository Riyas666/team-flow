
import {
  FolderKanban,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useNavigate } from '@tanstack/react-router'

const adminSections = [
  {
    title: 'Manage Members',
    description: 'View and manage workspace members.',
    icon: Users,
    roles: ['owner'],
  },
  {
    title: 'Workspace Settings',
    description: 'Configure workspace preferences and settings.',
    icon: Settings,
    roles: ['owner'],
  },
  {
    title: 'Project Management',
    description: 'Create, manage and organize workspace projects.',
    icon: FolderKanban,
    roles: ['owner', 'teamLeader'],
  },
]

export default function Admin() {
  const navigate = useNavigate()
  const userRole = sessionStorage.getItem('teamflow_role')

  const isOwner = userRole === 'owner'
  const isTeamLeader = userRole === 'teamLeader'

  if (!isOwner && !isTeamLeader) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldCheck className="mb-4 h-10 w-10 text-muted-foreground" />

          <h2 className="text-lg font-semibold">
            Access Restricted
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to access the Admin section.
          </p>
        </CardContent>
      </Card>
    )
  }

  const visibleSections = adminSections.filter((section) =>
    section.roles.includes(userRole ?? ''),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage your workspace and administrative settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleSections.map((section) => {
          const Icon = section.icon

          return (
            <Card
  key={section.title}
  className="cursor-pointer transition-colors hover:bg-accent"
  onClick={() => {
    if (section.title === 'Workspace Settings') {
      navigate({ to: '/workspace-settings' })
    }

    if (section.title === 'Manage Members') {
      navigate({ to: '/members' })
    }

    if (section.title === 'Project Management') {
      navigate({ to: '/projects' })
    }
  }}
>
  <CardHeader>
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>

      <div>
        <CardTitle className="text-base">
          {section.title}
        </CardTitle>

        <CardDescription className="mt-1">
          {section.description}
        </CardDescription>
      </div>
    </div>
  </CardHeader>
</Card>
          )
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Signed in as: {isOwner ? 'Owner' : 'Team Leader'}
      </div>
    </div>
  )
}
