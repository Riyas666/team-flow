
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  UserPlus,
  Loader2,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface ActivityItem {
  _id: string
  action: string
  details: string
  createdAt: string
  actorId: { name: string } | null
  projectId: { name: string } | null
  taskId: { title: string } | null
}

interface ActivityResponse {
  activities: ActivityItem[]
  hasMore: boolean
  nextCursor: string | null
}

function getActivityTitle(action: string) {
  const titles: Record<string, string> = {
    project_created: 'Project created',
    project_updated: 'Project updated',
    task_created: 'Task created',
    task_assigned: 'Task assigned',
    task_updated: 'Task updated',
    task_status_updated: 'Task status updated',
    task_deleted: 'Task deleted',
  }

  return titles[action] ?? 'Activity'
}

function getActivityDescription(activity: ActivityItem) {
  const actor = activity.actorId?.name ?? 'Someone'

  return activity.details
    ? `${actor} ${activity.details}`
    : `${actor} performed an action`
}

function getActivityTime(date: string) {
  const timestamp = new Date(date).getTime()

  if (Number.isNaN(timestamp)) return 'Unknown time'

  const diff = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(diff / 60_000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(hours / 24)

  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return new Date(date).toLocaleDateString()
}

export default function Activity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadActivities() {
      try {
        setLoading(true)
        setError('')

        const response = await apiRequest<ActivityResponse>(
          '/api/activities?limit=10',
        )

        if (cancelled) return

        setActivities(response.activities)
        setHasMore(response.hasMore)
        setNextCursor(response.nextCursor)
      } catch (err) {
        if (cancelled) return

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load activities.',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadActivities()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleLoadMore() {
    if (!nextCursor || !hasMore || loadingMore) return

    try {
      setLoadingMore(true)
      setError('')

      const response = await apiRequest<ActivityResponse>(
        `/api/activities?limit=10&cursor=${encodeURIComponent(nextCursor)}`,
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

      setHasMore(response.hasMore)
      setNextCursor(response.nextCursor)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load more activities.',
      )
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Activity
        </h1>

        <p className="text-sm text-muted-foreground">
          See what is happening across your workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Recent Activity
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading activities...
              </div>
            ) : error && activities.length === 0 ? (
              <p
                className="p-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : activities.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No activities yet.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  {activities.map((activity) => {
                    const Icon =
                      activity.action === 'task_status_updated'
                        ? CheckCircle2
                        : activity.action === 'task_updated'
                          ? ListTodo
                          : activity.action.startsWith('project_')
                            ? FolderKanban
                            : activity.action === 'task_assigned'
                              ? UserPlus
                              : activity.action === 'task_deleted'
                                ? ListTodo
                                : Clock3

                    return (
                      <div
                        key={activity._id}
                        className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {getActivityTitle(activity.action)}
                          </p>

                          <p className="mt-0.5 break-words text-sm text-muted-foreground">
                            {getActivityDescription(activity)}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {getActivityTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {error && (
                  <p
                    className="p-3 text-center text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={() => void handleLoadMore()}
                      disabled={loadingMore}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load more activities'
                      )}
                    </button>
                  </div>
                )}

                {!hasMore && activities.length > 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    You've reached the end of your activity history.
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
