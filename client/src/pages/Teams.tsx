import {
  MoreHorizontal,
  Plus,
  Search,
  UsersRound,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const teams = [
  {
    id: 1,
    name: 'Development Team',
    description: 'Frontend, backend and infrastructure developers.',
    members: 8,
  },
  {
    id: 2,
    name: 'Design Team',
    description: 'UI/UX designers and creative specialists.',
    members: 5,
  },
  {
    id: 3,
    name: 'Marketing Team',
    description: 'Marketing, content and growth specialists.',
    members: 6,
  },
]

export default function Teams() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">
            Organize and manage your teams.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Team
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search teams..." className="pl-9" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UsersRound className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <CardTitle className="text-base">
                      {team.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {team.members} members
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  aria-label={`More options for ${team.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                {team.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}