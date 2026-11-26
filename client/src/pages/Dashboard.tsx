
import { useEffect, useState } from 'react'
import {
  CheckSquare,
  FolderKanban,
  ListTodo,
  Users,
  Activity as ActivityIcon,
  LoaderCircle,
  CalendarClock,
  Circle,
  Clock,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { apiRequest } from '@/lib/api'

interface DashboardSummary {
  totalProjects: number
  totalTasks: number
  completedTasks: number
  teamMembers: number
  completionPercentage: number
  overdueTasks: number
  taskStatus: {
    todo: number
    inProgress: number
    completed: number
  }
}

interface ActivityItem {
  _id: string
  action: string
  details: string
  createdAt: string
  actorId?: { name?: string } | null
}

interface ActivityResponse {
  activities: ActivityItem[]
  hasMore: boolean
  nextCursor: string | null
}

const statDefinitions = [
  {
    key: 'totalProjects',
    title: 'Total Projects',
    description: 'Workspace projects',
    icon: FolderKanban,
  },
  {
    key: 'totalTasks',
    title: 'Total Tasks',
    description: 'Tasks visible to you',
    icon: ListTodo,
  },
  {
    key: 'completedTasks',
    title: 'Completed Tasks',
    description: 'Tasks completed',
    icon: CheckSquare,
  },
  {
    key: 'teamMembers',
    title: 'Team Members',
    description: 'Active members',
    icon: Users,
  },
] as const

function formatAction(action: string) {
  const labels: Record<string, string> = {
    project_created: 'Project created',
    project_updated: 'Project updated',
    task_created: 'Task created',
    task_assigned: 'Task assigned',
    task_status_updated: 'Task status updated',
    task_updated: 'Task updated',
    task_deleted: 'Task deleted',
  }

  return labels[action] ?? 'Activity'
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState('')

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false)
  const [activityError, setActivityError] = useState('')
  const [activityCursor, setActivityCursor] = useState<string | null>(null)
  const [hasMoreActivities, setHasMoreActivities] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      const [summaryResult, activityResult] = await Promise.allSettled([
        apiRequest<DashboardSummary>('/api/dashboard/summary'),
        apiRequest<ActivityResponse>('/api/activities?limit=5'),
      ])

      if (cancelled) return

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value)
      } else {
        setSummaryError('Unable to load dashboard statistics.')
      }

      if (activityResult.status === 'fulfilled') {
        setActivities(activityResult.value.activities ?? [])
        setActivityCursor(activityResult.value.nextCursor)
        setHasMoreActivities(activityResult.value.hasMore)
      } else {
        setActivityError('Unable to load recent activity.')
      }

      setLoadingSummary(false)
      setLoadingActivities(false)
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleLoadMoreActivities() {
    if (
      !activityCursor ||
      !hasMoreActivities ||
      loadingMoreActivities
    ) {
      return
    }

    try {
      setLoadingMoreActivities(true)
      setActivityError('')

      const response = await apiRequest<ActivityResponse>(
        `/api/activities?limit=5&cursor=${encodeURIComponent(activityCursor)}`,
      )

      setActivities((current) => {
        const existingIds = new Set(
          current.map((activity) => activity._id),
        )

        const newActivities = response.activities.filter(
          (activity) => !existingIds.has(activity._id),
        )

        return [...current, ...newActivities]
      })

      setActivityCursor(response.nextCursor)
      setHasMoreActivities(response.hasMore)
    } catch (err) {
      setActivityError(
        err instanceof Error
          ? err.message
          : 'Unable to load more activities.',
      )
    } finally {
      setLoadingMoreActivities(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Overview of your TeamFlow workspace.
        </p>
      </div>

      {summaryError && (
        <p role="alert" className="text-sm text-destructive">
          {summaryError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        {statDefinitions.map((stat) => {
          const Icon = stat.icon
          const value = summary?.[stat.key]

          return (
            <Card key={stat.key} className="min-w-0 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-6">
                <CardTitle className="min-w-0 text-xs font-medium leading-tight sm:text-sm">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
              </CardHeader>

              <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
                <div className="text-xl font-bold sm:text-2xl">
                  {loadingSummary ? (
                    <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : summaryError ? (
                    '—'
                  ) : (
                    value ?? 0
                  )}
                </div>

                <p className="mt-2 text-[11px] leading-tight text-muted-foreground sm:text-xs">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-5 w-5 text-muted-foreground" />
              Task Completion
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Your task completion progress
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {loadingSummary ? (
              <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : summaryError || !summary ? (
              <p className="text-sm text-muted-foreground">
                Progress is currently unavailable.
              </p>
            ) : (
              <>
                <div className="flex items-end justify-between gap-4">
                  <span className="text-3xl font-bold">
                    {summary.completionPercentage}%
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {summary.completedTasks} of {summary.totalTasks} completed
                  </span>
                </div>

                <div
                  className="h-3 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Task completion"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={summary.completionPercentage}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, summary.completionPercentage))}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Remaining tasks
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {Math.max(
                        0,
                        summary.totalTasks - summary.completedTasks,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Overdue tasks
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {summary.overdueTasks}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              Task Status Overview
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Breakdown by current status
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {loadingSummary ? (
              <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : summaryError || !summary ? (
              <p className="text-sm text-muted-foreground">
                Task status is currently unavailable.
              </p>
            ) : (
              <>
                {[
                  {
                    label: 'To Do',
                    count: summary.taskStatus.todo,
                    icon: Circle,
                  },
                  {
                    label: 'In Progress',
                    count: summary.taskStatus.inProgress,
                    icon: Clock,
                  },
                  {
                    label: 'Completed',
                    count: summary.taskStatus.completed,
                    icon: CheckSquare,
                  },
                ].map((item) => {
                  const Icon = item.icon
                  const percentage =
                    summary.totalTasks === 0
                      ? 0
                      : (item.count / summary.totalTasks) * 100

                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.label}
                        </span>

                        <span className="text-sm font-semibold">
                          {item.count}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/80 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, percentage)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                  <div>
                    <p className="text-sm font-medium">
                      {summary.overdueTasks === 0
                        ? 'You are all caught up!'
                        : `${summary.overdueTasks} overdue ${summary.overdueTasks === 1 ? 'task' : 'tasks'}`}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Uncompleted tasks with past due dates.
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loadingActivities ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading recent activity...
            </div>
          ) : activityError && activities.length === 0 ? (
            <p role="alert" className="py-6 text-sm text-destructive">
              {activityError}
            </p>
          ) : activities.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No recent activity yet. Create a project or task to get started.
            </p>
          ) : (
            <div className="space-y-5">
              {activities.map((activity) => (
                <div
                  key={activity._id}
                  className="flex gap-3 border-b pb-5 last:border-0 last:pb-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {formatAction(activity.action)}
                    </p>

                    <p className="break-words text-sm text-muted-foreground">
                      {activity.details || 'An activity was recorded.'}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {activity.actorId?.name
                        ? `${activity.actorId.name} · `
                        : ''}
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {activityError && (
                <p role="alert" className="text-center text-sm text-destructive">
                  {activityError}
                </p>
              )}

              {hasMoreActivities && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void handleLoadMoreActivities()}
                    disabled={loadingMoreActivities}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    {loadingMoreActivities ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more activities'
                    )}
                  </button>
                </div>
              )}

              {!hasMoreActivities && (
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  You've reached the end of your activity history.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
