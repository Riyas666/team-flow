
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Plus,
        Trash2,
        Pencil 
 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FolderKanban,
  ListTodo,
  UserRound,
} from 'lucide-react'

import { apiRequest } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Project {
  _id: string
  name: string
  description: string
  status: 'planning' | 'in_progress' | 'completed' | 'archived'
  createdAt: string
}

interface Task {
  _id: string
  title: string
  description: string
  projectId: { _id: string; name: string } | string
  assignedTo?: { _id: string; name: string; email: string } | null
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  createdAt: string
}

interface Member {
  _id: string
  name: string
  email: string
  role: 'owner' | 'teamLeader' | 'employee'
  isActive: boolean
}

const priorityStyles: Record<Task['priority'], string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-700',
}

const projectStatusLabels: Record<Project['status'], string> = {
  planning: 'Planning',
  in_progress: 'In progress',
  completed: 'Completed',
  archived: 'Archived',
}

function formatDate(date: string | null | undefined) {
  if (!date) return 'No due date'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return 'No due date'

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getProjectId(task: Task) {
  return typeof task.projectId === 'string'
    ? task.projectId
    : task.projectId?._id
}

export default function ProjectDetails() {
  const params = useParams({ strict: false })
  const projectId = String(params.projectId ?? '')
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newTask, setNewTask] = useState({
  title: '',
  description: '',
  priority: 'medium' as Task['priority'],
  dueDate: '',
})
  const [members, setMembers] = useState<Member[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  
const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
const [isDeletingTask, setIsDeletingTask] = useState(false)
const [deleteTaskError, setDeleteTaskError] = useState('')
const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
const [isEditingTask, setIsEditingTask] = useState(false)
const [editTaskError, setEditTaskError] = useState('')
const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

const [editTask, setEditTask] = useState({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  dueDate: '',
  assignedTo: '',
})

const userRole = sessionStorage.getItem('teamflow_role')
const canDeleteTasks =
  userRole === 'owner' || userRole === 'teamLeader'

  
const [isEditOpen, setIsEditOpen] = useState(false)
const [isSavingProject, setIsSavingProject] = useState(false)
const [editProjectError, setEditProjectError] = useState('')

const [editProjectForm, setEditProjectForm] = useState({
  name: '',
  description: '',
})
const [isDeleteOpen, setIsDeleteOpen] = useState(false)
const [isDeleting, setIsDeleting] = useState(false)
const [deleteError, setDeleteError] = useState('')


const handleEditProject = async () => {
  const name = editProjectForm.name.trim()
  const description = editProjectForm.description.trim()

  if (name.length < 2 || name.length > 120) {
    setEditProjectError('Project name must be between 2 and 120 characters.')
    return
  }

  if (description.length > 2000) {
    setEditProjectError('Description cannot exceed 2000 characters.')
    return
  }

  setIsSavingProject(true)
  setEditProjectError('')

  try {
    await apiRequest(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, description }),
    })

    setIsEditOpen(false)

    // Reload project data so the updated details appear.
    const result = await apiRequest<{ projects: Project[] }>(
      '/api/projects',
    )

    const updatedProject = result.projects.find(
      (item) => item._id === projectId,
    )

    if (updatedProject) {
      setProject(updatedProject)
    }
  } catch (error) {
    setEditProjectError(
      error instanceof Error
        ? error.message
        : 'Failed to update project.',
    )
  } finally {
    setIsSavingProject(false)
  }
}
const handleDeleteProject = async () => {
  setIsDeleting(true)
  setDeleteError('')

  try {
    await apiRequest(`/api/projects/${projectId}`, {
      method: 'DELETE',
    })

    setIsDeleteOpen(false)

    navigate({ to: '/projects' })
  } catch (error) {
    setDeleteError(
      error instanceof Error
        ? error.message
        : 'Failed to delete project.',
    )
  } finally {
    setIsDeleting(false)
  }
}


  useEffect(() => {
    let cancelled = false

    async function loadProjectDetails() {
      setLoading(true)
      setError('')

      try {
        const [projectResult, taskResult] = await Promise.all([
          apiRequest<{ projects: Project[] }>('/api/projects'),
          apiRequest<{ tasks: Task[] }>('/api/tasks'),
        ])

        if (cancelled) return

        const foundProject = projectResult.projects.find(
          (item) => item._id === projectId,
        )

        if (!foundProject) {
          setProject(null)
          setTasks([])
          setError('Project not found or you do not have access to it.')
          return
        }

        setProject(foundProject)
        setTasks(
          taskResult.tasks.filter((task) => getProjectId(task) === projectId),
        )
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load project details.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (projectId) {
      void loadProjectDetails()
    } else {
      setError('Invalid project ID.')
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [projectId])
  useEffect(() => {
  let cancelled = false

  async function loadMembers() {
    try {
      const result = await apiRequest<{ members: Member[] }>(
        '/api/members',
      )

      if (!cancelled) {
        setMembers(result.members ?? [])
      }
    } catch (err) {
      if (!cancelled) {
        setCreateError(
          err instanceof Error
            ? err.message
            : 'Failed to load team members.',
        )
      }
    }
  }

  void loadMembers()

  return () => {
    cancelled = true
  }
}, [])


  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === 'completed').length,
    [tasks],
  )

  const inProgressCount = useMemo(
    () => tasks.filter((task) => task.status === 'in_progress').length,
    [tasks],
  )

  const todoCount = useMemo(
    () => tasks.filter((task) => task.status === 'todo').length,
    [tasks],
  )

  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0

  async function handleStatusChange(
    taskId: string,
    nextStatus: Task['status'],
  ) {
    const previousTasks = tasks

    setUpdatingTaskId(taskId)
    setError('')

    setTasks((current) =>
      current.map((task) =>
        task._id === taskId ? { ...task, status: nextStatus } : task,
      ),
    )

    try {
      await apiRequest(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
    } catch (err) {
      setTasks(previousTasks)
      setError(
        err instanceof Error ? err.message : 'Unable to update task status.',
      )
    } finally {
      setUpdatingTaskId(null)
    }
  }
  
async function handleDeleteTask() {
  if (!taskToDelete || isDeletingTask) return

  const taskId = taskToDelete._id

  try {
    setIsDeletingTask(true)
    setDeleteTaskError('')

    await apiRequest(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    })

    setTasks((current) =>
      current.filter((task) => task._id !== taskId),
    )

    setTaskToDelete(null)
  } catch (err) {
    setDeleteTaskError(
      err instanceof Error ? err.message : 'Failed to delete task.',
    )
  } finally {
    setIsDeletingTask(false)
  }
}


  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading project details...
        </p>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="space-y-4 p-2">
        <Button variant="outline" onClick={() => navigate({ to: '/projects' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to projects
        </Button>

        <Card className="rounded-xl">
          <CardContent className="p-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) return null
  const handleEditTaskClick = (task: Task) => {
  setEditingTaskId(task._id)

  setEditTask({
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDate: task.dueDate
      ? task.dueDate.slice(0, 10)
      : '',
    assignedTo: task.assignedTo?._id ?? '',
  })

  setEditTaskError('')
  setIsEditTaskOpen(true)
}   

const handleUpdateTask = async () => {
  if (!editingTaskId) return

  const title = editTask.title.trim()
  const description = editTask.description.trim()

  if (title.length < 2 || title.length > 150) {
    setEditTaskError('Title must be between 2 and 150 characters.')
    return
  }

  if (description.length > 2000) {
    setEditTaskError('Description cannot exceed 2000 characters.')
    return
  }

  setIsEditingTask(true)
  setEditTaskError('')

  try {
    
await apiRequest(`/api/tasks/${editingTaskId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    title,
    description,
    priority: editTask.priority,
    assignedTo: editTask.assignedTo || null,
    dueDate: editTask.dueDate || null,
  }),
})

// Refresh tasks and keep only the current project's tasks.
const result = await apiRequest<{ tasks: Task[] }>('/api/tasks')

setTasks(
  result.tasks.filter((task) => getProjectId(task) === projectId),
)

setIsEditTaskOpen(false)
setEditingTaskId(null)

  } catch (error) {
    setEditTaskError(
      error instanceof Error
        ? error.message
        : 'Failed to update task. Please try again.'
    )
  } finally {
    setIsEditingTask(false)
  }
}

  async function handleCreateTask() {
  const title = newTask.title.trim()

  if (!title) {
    setCreateError('Task title is required.')
    return
  }

  try {
    setIsCreating(true)
    setCreateError('')

    await apiRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: newTask.description.trim(),
        projectId,
        assignedTo: selectedAssignee || null,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
      }),
    })

    const result = await apiRequest<{ tasks: Task[] }>('/api/tasks')



    setTasks(
      result.tasks.filter((task) => getProjectId(task) === projectId),
    )

    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
    })

    setSelectedAssignee('')
    setIsCreateOpen(false)
  } catch (err) {
    setCreateError(
      err instanceof Error ? err.message : 'Failed to create task.',
    )
  } finally {
    setIsCreating(false)
  }
}

  return (
    <div className="space-y-6 pb-8">
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => navigate({ to: '/projects' })}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to projects
      </Button>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <FolderKanban className="h-6 w-6 text-primary" />
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
                {project.name}
              </h1>

              <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                {projectStatusLabels[project.status] ?? project.status}
              </span>

              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {project.description || 'No project description provided.'}
              </p>

              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Created {formatDate(project.createdAt)}
              </p>
            </div>
            
<Button
  variant="outline"
  onClick={() => {
    if (!project) return

    setEditProjectForm({
      name: project.name,
      description: project.description ?? '',
    })
    setEditProjectError('')
    setIsEditOpen(true)
  }}
>
  Edit Project
</Button>
<Button
  variant="destructive"
  onClick={() => {
    setDeleteError('')
    setIsDeleteOpen(true)
  }}
>
  <Trash2 className="mr-2 h-4 w-4" />
  Delete Project
</Button>

          </div>
        </div>

        <Card className="rounded-xl">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Project progress</h2>
                <p className="text-sm text-muted-foreground">
                  {completedCount} of {tasks.length} tasks completed
                </p>
              </div>

              <span className="text-2xl font-bold">{progress}%</span>
            </div>

            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Project task completion"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total tasks"
          value={tasks.length}
          icon={<ListTodo className="h-5 w-5" />}
        />
        <StatCard
          title="To do"
          value={todoCount}
          icon={<Circle className="h-5 w-5" />}
        />
        <StatCard
          title="In progress"
          value={inProgressCount}
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      
<section className="space-y-4">
  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
    <div>
      <h2 className="text-xl font-semibold">Project tasks</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tasks linked to this project.
      </p>
    </div>

    <Button
      onClick={() => {
        setCreateError('')
        setIsCreateOpen(true)
      }}
    >
      <Plus className="mr-2 h-4 w-4" />
      New Task
    </Button>
  </div>


        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {tasks.length === 0 ? (
          <Card className="rounded-xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <ListTodo className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold">No tasks yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Tasks assigned to this project will appear here.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate({ to: '/tasks' })}
              >
                Go to tasks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isOverdue =
                task.dueDate &&
                task.status !== 'completed' &&
                new Date(task.dueDate).getTime() <
                  new Date(new Date().setHours(0, 0, 0, 0)).getTime()

              return (
                <Card key={task._id} className="rounded-xl">
                  <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-semibold">
                          {task.title}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority] ?? priorityStyles.medium}`}
                        >
                          {task.priority} priority
                        </span>
                      </div>

                      {task.description && (
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {task.assignedTo?.name ?? 'Unassigned'}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(task.dueDate)}
                        </span>

                        {isOverdue && (
                          <span className="font-medium text-red-600">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    
<div className="flex w-full items-center gap-2 sm:w-auto">
  <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
    <Select
      value={task.status}
      onValueChange={(value) =>
        void handleStatusChange(
          task._id,
          value as Task['status'],
        )
      }
      disabled={updatingTaskId === task._id}
    >
      <SelectTrigger aria-label={`Status for ${task.title}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">To do</SelectItem>
        <SelectItem value="in_progress">In progress</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  </div>

{canDeleteTasks && (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => handleEditTaskClick(task)}
  >
    <Pencil className="mr-2 h-4 w-4" />
    Edit
  </Button>
)}

  {canDeleteTasks && (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      aria-label={`Delete task ${task.title}`}
      title="Delete task"
      onClick={() => {
        setDeleteTaskError('')
        setTaskToDelete(task)
      }}
      disabled={isDeletingTask}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )}
  
</div>

                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
      
<Dialog
  open={isCreateOpen}
  onOpenChange={(open) => {
    setIsCreateOpen(open)
    if (!open) setCreateError('')
  }}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Task</DialogTitle>
      <DialogDescription>
        Add a task to {project.name}.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Task title</Label>
        <Input
          id="task-title"
          placeholder="e.g. Design the login page"
          value={newTask.title}
          maxLength={150}
          onChange={(e) =>
            setNewTask({ ...newTask, title: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          placeholder="Describe the task..."
          value={newTask.description}
          maxLength={2000}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={newTask.priority}
          onValueChange={(value) =>
            setNewTask({
              ...newTask,
              priority: value as Task['priority'],
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
<div className="space-y-2">
  <Label>Assign to team member</Label>

  <Select
    value={selectedAssignee || 'unassigned'}
    onValueChange={(value) =>
      setSelectedAssignee(
        value === 'unassigned' ? '' : value,
      )
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select a team member" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="unassigned">
        Unassigned
      </SelectItem>

      {members
        .filter((member) => member.isActive)
        .map((member) => (
          <SelectItem key={member._id} value={member._id}>
            {member.name} ({member.email})
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
</div>


      <div className="space-y-2">
        <Label htmlFor="task-due-date">Due date</Label>
        <Input
          id="task-due-date"
          type="date"
          value={newTask.dueDate}
          onChange={(e) =>
            setNewTask({ ...newTask, dueDate: e.target.value })
          }
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
        variant="outline"
        onClick={() => setIsCreateOpen(false)}
        disabled={isCreating}
      >
        Cancel
      </Button>

      <Button
        onClick={() => void handleCreateTask()}
        disabled={!newTask.title.trim() || isCreating}
      >
        {isCreating ? 'Creating...' : 'Create Task'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Edit Task dialog */}
<Dialog
  open={isEditTaskOpen}
  onOpenChange={(open) => {
    setIsEditTaskOpen(open)

    if (!open) {
      setEditTaskError('')
      setEditingTaskId(null)
    }
  }}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Task</DialogTitle>
      <DialogDescription>
        Update the task details below.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="edit-project-task-title">
          Task title
        </Label>
        <Input
          id="edit-project-task-title"
          value={editTask.title}
          maxLength={150}
          placeholder="Enter task title"
          onChange={(e) => {
            setEditTask({ ...editTask, title: e.target.value })
            setEditTaskError('')
          }}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="edit-project-task-description">
          Description
        </Label>
        <Textarea
          id="edit-project-task-description"
          value={editTask.description}
          maxLength={2000}
          placeholder="Describe the task..."
          onChange={(e) => {
            setEditTask({
              ...editTask,
              description: e.target.value,
            })
            setEditTaskError('')
          }}
        />
      </div>

      {/* Assignee */}
      <div className="space-y-2">
        <Label htmlFor="edit-project-task-assignee">
          Assign To
        </Label>
        <Select
          value={editTask.assignedTo || 'unassigned'}
          onValueChange={(value) => {
            setEditTask({
              ...editTask,
              assignedTo: value === 'unassigned' ? '' : value,
            })
            setEditTaskError('')
          }}
          disabled={members.length === 0}
        >
          <SelectTrigger id="edit-project-task-assignee">
            <SelectValue placeholder="Select a team member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members
              .filter((member) => member.isActive)
              .map((member) => (
                <SelectItem key={member._id} value={member._id}>
                  {member.name} ({member.role})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="edit-project-task-priority">
          Priority
        </Label>
        <Select
          value={editTask.priority}
          onValueChange={(value) => {
            if (
              value === 'low' ||
              value === 'medium' ||
              value === 'high'
            ) {
              setEditTask({ ...editTask, priority: value })
              setEditTaskError('')
            }
          }}
        >
          <SelectTrigger id="edit-project-task-priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Due date */}
      <div className="space-y-2">
        <Label htmlFor="edit-project-task-due-date">
          Due date
        </Label>
        <Input
          id="edit-project-task-due-date"
          type="date"
          value={editTask.dueDate}
          onChange={(e) => {
            setEditTask({ ...editTask, dueDate: e.target.value })
            setEditTaskError('')
          }}
        />
      </div>
    </div>

    {editTaskError && (
      <p className="text-sm text-destructive" role="alert">
        {editTaskError}
      </p>
    )}

    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        disabled={isEditingTask}
        onClick={() => setIsEditTaskOpen(false)}
      >
        Cancel
      </Button>
      <Button
        type="button"
        disabled={
          editTask.title.trim().length < 2 ||
          editTask.title.trim().length > 150 ||
          editTask.description.trim().length > 2000 ||
          isEditingTask
        }
        onClick={handleUpdateTask}
      >
        {isEditingTask ? 'Saving...' : 'Save Changes'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Project</DialogTitle>
      <DialogDescription>
        Update your project's name and description.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-project-name">Project Name</Label>
        <Input
          id="edit-project-name"
          value={editProjectForm.name}
          maxLength={120}
          onChange={(event) =>
            setEditProjectForm((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Enter project name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-project-description">
          Description
        </Label>
        <Textarea
          id="edit-project-description"
          value={editProjectForm.description}
          maxLength={2000}
          onChange={(event) =>
            setEditProjectForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Describe this project"
          rows={4}
        />
      </div>

      {editProjectError && (
        <p className="text-sm text-destructive">
          {editProjectError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={isSavingProject}
          onClick={() => setIsEditOpen(false)}
        >
          Cancel
        </Button>

        <Button
          disabled={isSavingProject}
          onClick={handleEditProject}
        >
          {isSavingProject ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Project?</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{project?.name}"?
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>

    {deleteError && (
      <p className="text-sm text-destructive">
        {deleteError}
      </p>
    )}

    <DialogFooter>
      <Button
        variant="outline"
        disabled={isDeleting}
        onClick={() => setIsDeleteOpen(false)}
      >
        Cancel
      </Button>

      <Button
        variant="destructive"
        disabled={isDeleting}
        onClick={handleDeleteProject}
      >
        {isDeleting ? 'Deleting...' : 'Delete Project'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog
  open={Boolean(taskToDelete)}
  onOpenChange={(open) => {
    if (!open && !isDeletingTask) {
      setTaskToDelete(null)
      setDeleteTaskError('')
    }
  }}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Task?</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{taskToDelete?.title}"?
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>

    {deleteTaskError && (
      <p className="text-sm text-destructive" role="alert">
        {deleteTaskError}
      </p>
    )}

    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        disabled={isDeletingTask}
        onClick={() => {
          setTaskToDelete(null)
          setDeleteTaskError('')
        }}
      >
        Cancel
      </Button>

      <Button
        type="button"
        variant="destructive"
        disabled={isDeletingTask}
        onClick={() => void handleDeleteTask()}
      >
        {isDeletingTask ? 'Deleting...' : 'Delete Task'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>



    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
