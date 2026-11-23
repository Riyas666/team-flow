
import { useEffect, useState } from 'react'
import {
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  CalendarDays,
  ListChecks,
  CircleDashed,
  CircleCheck,
  Archive,
  LoaderCircle,
} from 'lucide-react'

import { apiRequest } from '@/lib/api'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useNavigate } from '@tanstack/react-router'

interface Project {
  _id: string
  name: string
  description: string
  status: 'planning' | 'in_progress' | 'completed' | 'archived'
  createdAt: string
}

interface ProjectsResponse {
  projects: Project[]
}

interface CreateProjectResponse {
  message: string
  project: Project
}

const statusConfig = {
  planning: {
    label: 'Planning',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    icon: CircleDashed,
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    icon: ListChecks,
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    icon: CircleCheck,
  },
  archived: {
    label: 'Archived',
    className: 'bg-secondary text-secondary-foreground',
    icon: Archive,
  },
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  })
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function fetchProjects() {
      try {
        setIsLoading(true)
        setError('')

        const data = await apiRequest<ProjectsResponse>('/api/projects')

        if (!cancelled) {
          setProjects(data.projects ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load projects.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void fetchProjects()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreateProject() {
    const name = newProject.name.trim()
    const description = newProject.description.trim()

    if (name.length < 2 || name.length > 120) {
      setCreateError('Project name must be between 2 and 120 characters.')
      return
    }

    if (description.length > 2000) {
      setCreateError('Description cannot exceed 2000 characters.')
      return
    }

    try {
      setIsCreating(true)
      setCreateError('')

      await apiRequest<CreateProjectResponse>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      })

      const data = await apiRequest<ProjectsResponse>('/api/projects')

      setProjects(data.projects ?? [])
      setNewProject({ name: '', description: '' })
      setIsCreateOpen(false)
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Failed to create project.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  const filteredProjects = projects.filter((project) =>
    `${project.name} ${project.description}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim()),
  )

  const statusCounts = {
    planning: projects.filter((p) => p.status === 'planning').length,
    in_progress: projects.filter((p) => p.status === 'in_progress').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    archived: projects.filter((p) => p.status === 'archived').length,
  }

  const summaryCards = [
    {
      title: 'Total Projects',
      value: projects.length,
      description: 'All workspace projects',
      icon: FolderKanban,
    },
    {
      title: 'In Progress',
      value: statusCounts.in_progress,
      description: 'Projects currently underway',
      icon: ListChecks,
    },
    {
      title: 'Completed',
      value: statusCounts.completed,
      description: 'Projects marked complete',
      icon: CircleCheck,
    },
    {
      title: 'Planning',
      value: statusCounts.planning,
      description: 'Projects being planned',
      icon: CircleDashed,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your team projects.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setCreateError('')
            setIsCreateOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title} className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : error ? (
                    '—'
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-9"
          aria-label="Search projects"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading projects...
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-destructive" role="alert">{error}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">
              {searchTerm.trim() ? 'No matching projects' : 'No projects yet'}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {searchTerm.trim()
                ? 'Try another search term.'
                : 'Create your first project to start organizing your team’s work.'}
            </p>
            {!searchTerm.trim() && (
              <Button
                className="mt-5"
                onClick={() => {
                  setCreateError('')
                  setIsCreateOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const status = statusConfig[project.status] ?? statusConfig.planning
            const StatusIcon = status.icon

            return (
              <Card
  key={project._id}
  className="cursor-pointer rounded-xl transition-shadow hover:shadow-md"
  onClick={() =>
    navigate({
      to: '/projects/$projectId',
      params: { projectId: project._id },
    })
  }
>
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="break-words text-base">
                          {project.name}
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Project
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={`More options for ${project.name}`}
                      title="More options coming soon"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                </CardHeader>

                <CardContent className="space-y-5">
                  <p className="min-h-10 break-words text-sm text-muted-foreground">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span>
                      Created{' '}
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString(
                            undefined,
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          )
                        : 'date unavailable'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) setCreateError('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Create a new project for your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={newProject.name}
                maxLength={120}
                onChange={(e) => {
                  setNewProject({ ...newProject, name: e.target.value })
                  setCreateError('')
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Describe your project..."
                value={newProject.description}
                maxLength={2000}
                onChange={(e) => {
                  setNewProject({
                    ...newProject,
                    description: e.target.value,
                  })
                  setCreateError('')
                }}
              />
            </div>
          </div>

          {createError && (
            <p className="text-sm text-destructive" role="alert">
              {createError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isCreating}
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                newProject.name.trim().length < 2 ||
                newProject.name.trim().length > 120 ||
                newProject.description.trim().length > 2000 ||
                isCreating
              }
              onClick={handleCreateProject}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
