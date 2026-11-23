import { useEffect, useState} from "react"
import { apiRequest } from '@/lib/api'
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Search,
  Pencil
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'



interface Task {
  _id: string
  title: string
  description: string
  projectId: {
    _id: string
    name: string
  } | string
  assignedTo?: {
    _id: string
    name: string
    email: string
  } | null
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  createdAt: string
}

interface Project {
  _id: string
  name: string
}

interface TasksResponse{
  tasks: Task[]
}

interface Member {
  _id: string
  name: string
  email: string
  role: 'owner' | 'teamLeader' | 'employee'
  isActive: boolean
}

interface MembersResponse {
  members: Member[]
}

export default function Tasks() {
  const userRole = sessionStorage.getItem('teamflow_role')
  const canCreateTask = userRole === 'owner' || userRole === 'teamLeader'
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignedTo: '',
  })
  const [projects, setProjects] = useState<Project[]>([])
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [isMembersLoading, setIsMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState('')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState('')
  const [isEditOpen, setIsEditOpen] = useState(false)
const [isEditing, setIsEditing] = useState(false)
const [editError, setEditError] = useState('')
const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

const [editTask, setEditTask] = useState({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  dueDate: '',
  assignedTo: '',
})

  useEffect(() => {
  async function fetchMembers() {
    try {
      setMembersError('')

      const data = await apiRequest<MembersResponse>('/api/members')
      setMembers(data.members)
    } catch (err) {
      setMembersError(
        err instanceof Error
          ? err.message
          : 'Failed to load team members.',
      )
    } finally {
      setIsMembersLoading(false)
    }
  }

  fetchMembers()
}, [])

  useEffect(() => {
    async function fetchTasks() {
      try{
        setIsLoading(true)
        setError('')

        const data = await apiRequest<TasksResponse>(
          '/api/tasks'
        )
        setTasks(data.tasks)
      }catch(err){
        setError(
          err instanceof Error
          ? err.message
          : "Failed to load tasks."
        )
      }finally{
        setIsLoading(false)
      }
    }
    fetchTasks()
  }, [])

  useEffect(() => {
  async function fetchProjects() {
    try {
      const data = await apiRequest<{ projects: Project[] }>(
        '/api/projects'
      )

      setProjects(data.projects)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setIsProjectsLoading(false)
    }
  }

  fetchProjects()
}, [])

const handleEditClick = (task: Task) => {
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

  setEditError('')
  setIsEditOpen(true)
}

const handleUpdateTask = async () => {
  if (!editingTaskId) return

  const title = editTask.title.trim()
  const description = editTask.description.trim()

  if (title.length < 2 || title.length > 150) {
    setEditError('Title must be between 2 and 150 characters.')
    return
  }

  if (description.length > 2000) {
    setEditError('Description cannot exceed 2000 characters.')
    return
  }

  setIsEditing(true)
  setEditError('')

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

const data = await apiRequest<TasksResponse>('/api/tasks')
setTasks(data.tasks)
    setIsEditOpen(false)
    setEditingTaskId(null)
  } catch (error) {
    setEditError(
      error instanceof Error
        ? error.message
        : 'Failed to update task. Please try again.'
    )
  } finally {
    setIsEditing(false)
  }
}


async function handleCreateTask() {
  const title = newTask.title.trim()
  const description = newTask.description.trim()

  if (title.length < 2 || title.length > 150) {
    setCreateError('Task title must be between 2 and 150 characters.')
    return
  }

  if (!newTask.projectId) {
    setCreateError('Please select a project.')
    return
  }

  try {
    setIsCreating(true)
    setCreateError('')

    await apiRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        projectId: newTask.projectId,
        assignedTo: newTask.assignedTo || null,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
      }),
    })

    const data = await apiRequest<TasksResponse>('/api/tasks')
    setTasks(data.tasks)

    setNewTask({
      title: '',
      description: '',
      projectId: '',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
    })

    setIsCreateOpen(false)
  } catch (err) {
    setCreateError(
      err instanceof Error
        ? err.message
        : 'Failed to create task.'
    )
  } finally {
    setIsCreating(false)
  }
}


async function handleStatusChange(
  taskId: string,
  status: Task['status'],
) {
  const previousTask = tasks.find((task) => task._id === taskId)

  if (!previousTask || previousTask.status === status) {
    return
  }

  setUpdatingTaskId(taskId)
  setStatusError('')

  // Update the card immediately for a responsive UI.
  setTasks((currentTasks) =>
    currentTasks.map((task) =>
      task._id === taskId ? { ...task, status } : task,
    ),
  )

  try {
    await apiRequest(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  } catch (err) {
    // Restore the previous status if the API request fails.
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task._id === taskId
          ? { ...task, status: previousTask.status }
          : task,
      ),
    )

    setStatusError(
      err instanceof Error
        ? err.message
        : 'Failed to update task status.',
    )
  } finally {
    setUpdatingTaskId(null)
  }
}



  const filteredTasks = tasks.filter((task) => {
  const projectName =
    typeof task.projectId === 'object'
      ? task.projectId.name
      : ''

  return `${task.title} ${projectName}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase().trim())
})

function formatStatus(status: Task['status']) {
  switch (status) {
    case 'todo':
      return 'Todo'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
  }
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return 'No due date'

  const date = new Date(dueDate)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  })
}

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your team's tasks.
          </p>
        </div>

        {canCreateTask && (
  <Button
    type="button"
    onClick={() => {
      setCreateError('')
      setIsCreateOpen(true)
    }}
  >
    <Plus className="h-4 w-4" />
    New Task
  </Button>
)}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {statusError && (
  <p className="text-sm text-destructive" role="alert">
    {statusError}
  </p>
)}

      {/* Task list */}
      <div className="grid gap-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading tasks...
          </p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {searchTerm.trim()
              ? 'No tasks match your search.'
              : 'No tasks found. Create a task to get started.'}
          </p>
        ) : (
          filteredTasks.map((task) => {
            const projectName =
              task.projectId &&
              typeof task.projectId === 'object'
                ? task.projectId.name
                : 'Unknown Project'

            const statusIcon =
              task.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : task.status === 'in_progress' ? (
                <Clock3 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )

            return (
              <Card key={task._id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    {statusIcon}

                    <div className="min-w-0">
                      <h3 className="font-medium">
                        {task.title}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {projectName}
                      </p>

                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    
<Select
  value={task.status}
  onValueChange={(value) => {
    if (
      value === 'todo' ||
      value === 'in_progress' ||
      value === 'completed'
    ) {
      void handleStatusChange(task._id, value)
    }
  }}
  disabled={updatingTaskId === task._id}
>
  <SelectTrigger
    className="h-8 w-[140px]"
    aria-label={`Change status for ${task.title}`}
  >
    <SelectValue placeholder="Select status" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="todo">To Do</SelectItem>
    <SelectItem value="in_progress">In Progress</SelectItem>
    <SelectItem value="completed">Completed</SelectItem>
  </SelectContent>
</Select>



                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        task.priority === 'high'
                          ? 'bg-destructive/10 text-destructive'
                          : task.priority === 'medium'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)}
                    </span>

                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {formatDueDate(task.dueDate)}
                    </span>

                    <span className="text-muted-foreground">
                      {task.assignedTo?.name ?? 'Unassigned'}
                    </span>
                    {canCreateTask && (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => handleEditClick(task)}
  >
    <Pencil className="mr-2 h-4 w-4" />
    Edit
  </Button>
)}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Task dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)

          if (!open) {
            setCreateError('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Create a new task for your project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="task-title">Task title</Label>
              <Input
                id="task-title"
                placeholder="Enter task title"
                value={newTask.title}
                maxLength={150}
                onChange={(e) => {
                  setNewTask({
                    ...newTask,
                    title: e.target.value,
                  })
                  setCreateError('')
                }}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="task-description">
                Description
              </Label>
              <Textarea
                id="task-description"
                placeholder="Describe the task..."
                value={newTask.description}
                maxLength={2000}
                onChange={(e) => {
                  setNewTask({
                    ...newTask,
                    description: e.target.value,
                  })
                  setCreateError('')
                }}
              />
            </div>

            {/* Project */}
            <div className="space-y-2">
              <Label htmlFor="task-project">Project</Label>
              <Select
                value={newTask.projectId}
                onValueChange={(value) => {
                  setNewTask({
                    ...newTask,
                    projectId: value,
                  })
                  setCreateError('')
                }}
                disabled={isProjectsLoading}
              >
                <SelectTrigger id="task-project">
                  <SelectValue
                    placeholder={
                      isProjectsLoading
                        ? 'Loading projects...'
                        : 'Select a project'
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem
                      key={project._id}
                      value={project._id}
                    >
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assign To */}
<div className="space-y-2">
  <Label htmlFor="task-assignee">Assign To</Label>

  <Select
    value={newTask.assignedTo || 'unassigned'}
    onValueChange={(value) => {
      setNewTask({
        ...newTask,
        assignedTo: value === 'unassigned' ? '' : value,
      })
      setCreateError('')
    }}
    disabled={isMembersLoading || Boolean(membersError)}
  >
    <SelectTrigger id="task-assignee">
      <SelectValue
        placeholder={
          isMembersLoading
            ? 'Loading members...'
            : 'Select a team member'
        }
      />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="unassigned">Unassigned</SelectItem>

      {members.map((member) => (
        <SelectItem key={member._id} value={member._id}>
          {member.name} ({member.role})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {membersError && (
    <p className="text-sm text-destructive" role="alert">
      {membersError}
    </p>
  )}
</div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => {
                  if (
                    value === 'low' ||
                    value === 'medium' ||
                    value === 'high'
                  ) {
                    setNewTask({
                      ...newTask,
                      priority: value,
                    })
                  }
                }}
              >
                <SelectTrigger id="task-priority">
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
              <Label htmlFor="task-due-date">Due date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={newTask.dueDate}
                onChange={(e) => {
                  setNewTask({
                    ...newTask,
                    dueDate: e.target.value,
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
                newTask.title.trim().length < 2 ||
                newTask.title.trim().length > 150 ||
                !newTask.projectId ||
                newTask.description.trim().length > 2000 ||
                isCreating
              }
              onClick={handleCreateTask}
            >
              {isCreating ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Task dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)

          if (!open) {
            setEditError('')
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
              <Label htmlFor="edit-task-title">Task title</Label>
              <Input
                id="edit-task-title"
                placeholder="Enter task title"
                value={editTask.title}
                maxLength={150}
                onChange={(e) => {
                  setEditTask({
                    ...editTask,
                    title: e.target.value,
                  })
                  setEditError('')
                }}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-task-description">
                Description
              </Label>
              <Textarea
                id="edit-task-description"
                placeholder="Describe the task..."
                value={editTask.description}
                maxLength={2000}
                onChange={(e) => {
                  setEditTask({
                    ...editTask,
                    description: e.target.value,
                  })
                  setEditError('')
                }}
              />
            </div>

            {/* Assign To */}
            <div className="space-y-2">
              <Label htmlFor="edit-task-assignee">
                Assign To
              </Label>

              <Select
                value={editTask.assignedTo || 'unassigned'}
                onValueChange={(value) => {
                  setEditTask({
                    ...editTask,
                    assignedTo:
                      value === 'unassigned' ? '' : value,
                  })
                  setEditError('')
                }}
                disabled={isMembersLoading || Boolean(membersError)}
              >
                <SelectTrigger id="edit-task-assignee">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="unassigned">
                    Unassigned
                  </SelectItem>

                  {members.map((member) => (
                    <SelectItem
                      key={member._id}
                      value={member._id}
                    >
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {membersError && (
                <p className="text-sm text-destructive" role="alert">
                  {membersError}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="edit-task-priority">
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
                    setEditTask({
                      ...editTask,
                      priority: value,
                    })
                    setEditError('')
                  }
                }}
              >
                <SelectTrigger id="edit-task-priority">
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
              <Label htmlFor="edit-task-due-date">
                Due date
              </Label>

              <Input
                id="edit-task-due-date"
                type="date"
                value={editTask.dueDate}
                onChange={(e) => {
                  setEditTask({
                    ...editTask,
                    dueDate: e.target.value,
                  })
                  setEditError('')
                }}
              />
            </div>
          </div>

          {/* Error message */}
          {editError && (
            <p className="text-sm text-destructive" role="alert">
              {editError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isEditing}
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={
                editTask.title.trim().length < 2 ||
                editTask.title.trim().length > 150 ||
                editTask.description.trim().length > 2000 ||
                isEditing
              }
              onClick={handleUpdateTask}
            >
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
