import {
  FolderKanban,
  ListTodo,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  {
    title: 'Total Members',
    value: '24',
    icon: Users,
  },
  {
    title: 'Total Projects',
    value: '12',
    icon: FolderKanban,
  },
  {
    title: 'Total Tasks',
    value: '86',
    icon: ListTodo,
  },
  {
    title: 'Admins',
    value: '3',
    icon: ShieldCheck,
  },
]

export default function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage your workspace and monitor system activity.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {stat.value}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Administration
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium">
                Manage Members
              </p>

              <p className="text-xs text-muted-foreground">
                Add, remove and manage workspace members.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium">
                Roles & Permissions
              </p>

              <p className="text-xs text-muted-foreground">
                Control access and workspace permissions.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-4 w-4 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium">
                Workspace Settings
              </p>

              <p className="text-xs text-muted-foreground">
                Configure workspace preferences.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium">
                Project Management
              </p>

              <p className="text-xs text-muted-foreground">
                Manage workspace projects.
              </p>
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  )
}