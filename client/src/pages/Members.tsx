
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

import {
  Mail,
  Plus,
  Search,
  Shield,
  UserRound,
  X,
  CheckCircle2,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Member {
  _id: string
  name: string
  email: string
  role: 'owner' | 'teamLeader' | 'employee'
  isActive: boolean
  status: 'active' | 'inactive' | 'invited' | 'expired'
  profilePicture: string | null
  createdAt: string
}

interface MembersResponse {
  members: Member[]
}

interface InvitationResponse {
  message: string
  invitation: {
    id: string
    name: string
    email: string
    role: 'teamLeader' | 'employee'
    expiresAt: string
  }
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getRoleLabel(role: Member['role']) {
  if (role === 'owner') return 'Owner'
  if (role === 'teamLeader') return 'Team Leader'
  return 'Employee'
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'employee' | 'teamLeader'>(
    'employee',
  )
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [invitation, setInvitation] =
    useState<InvitationResponse['invitation'] | null>(null)
  const [failedProfilePictures, setFailedProfilePictures] =
  useState<string[]>([])
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
const [isDeleting, setIsDeleting] = useState(false)
const [deleteError, setDeleteError] = useState('')

  async function fetchMembers() {
    try {
      setIsLoading(true)
      setError('')

      const data = await apiRequest<MembersResponse>('/api/members')
      setMembers(data.members)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load members.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchMembers()
  }, [])

  const filteredMembers = members.filter((member) =>
    `${member.name} ${member.email} ${member.role}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim()),
  )

  function openInviteDialog() {
    setInviteName('')
    setInviteEmail('')
    setInviteRole('employee')
    setInviteError('')
    setInvitation(null)
    setIsInviteOpen(true)
  }

  async function handleInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setInviteError('')
    setIsInviting(true)

    try {
      const data = await apiRequest<InvitationResponse>(
        '/api/invitations',
        {
          method: 'POST',
          body: JSON.stringify({
            name: inviteName.trim(),
            email: inviteEmail.trim(),
            role: inviteRole,
          }),
        },
      )

      setInvitation(data.invitation)
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : 'Failed to create invitation.',
      )
    } finally {
      setIsInviting(false)
    }
  }

  async function handleDeleteMember() {
  if (!memberToDelete || isDeleting) return

  setIsDeleting(true)
  setDeleteError('')

  try {
    await apiRequest(
      `/api/members/${encodeURIComponent(memberToDelete._id)}`,
      { method: 'DELETE' },
    )

    setMembers((current) =>
      current.filter((member) => member._id !== memberToDelete._id),
    )

    setMemberToDelete(null)
  } catch (err) {
    setDeleteError(
      err instanceof Error ? err.message : 'Failed to remove member.',
    )
  } finally {
    setIsDeleting(false)
  }
}

async function handleMemberStatusChange(member: Member) {
  if (
    member.role === 'owner' ||
    member.status === 'invited' ||
    member.status === 'expired'
  ) {
    return
  }

  const isActive = !member.isActive

  try {
    await apiRequest(`/api/members/${encodeURIComponent(member._id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })

    setMembers((current) =>
      current.map((item) =>
        item._id === member._id
          ? {
              ...item,
              isActive,
              status: isActive ? 'active' : 'inactive',
            }
          : item,
      ),
    )
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Failed to update member status.',
    )
  }
}


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace members.
          </p>
        </div>

        <button
          type="button"
          onClick={openInviteDialog}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace Members</CardTitle>
        </CardHeader>

        <CardContent className="space-y-1">
          {isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">
              Loading members...
            </p>
          ) : error ? (
            <p className="p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : filteredMembers.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {searchTerm.trim()
                ? 'No members match your search.'
                : 'No members found in your workspace.'}
            </p>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member._id}
                className="flex flex-col gap-3 rounded-lg p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
  {member.profilePicture &&
  !failedProfilePictures.includes(member._id) ? (
    <img
      src={member.profilePicture}
      alt={`${member.name}'s profile`}
      className="h-full w-full object-cover"
      onError={() =>
        setFailedProfilePictures((previous) =>
          previous.includes(member._id)
            ? previous
            : [...previous, member._id],
        )
      }
    />
  ) : (
    getInitials(member.name)
  )}
</div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
  {/* Role badge */}
  <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
    {member.role === 'owner' || member.role === 'teamLeader' ? (
      <Shield className="h-3 w-3" />
    ) : (
      <UserRound className="h-3 w-3" />
    )}
    {getRoleLabel(member.role)}
  </span>

  {/* Status badge */}
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
      member.status === 'active'
        ? 'bg-green-100 text-green-700'
        : member.status === 'inactive'
          ? 'bg-gray-100 text-gray-700'
          : member.status === 'invited'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-orange-100 text-orange-700'
    }`}
  >
    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
  </span>

  {/* Activate / Deactivate real users */}
  {member.status === 'active' || member.status === 'inactive' ? (
    <button
      type="button"
      onClick={() => void handleMemberStatusChange(member)}
      disabled={member.role === 'owner'}
      className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={`${member.isActive ? 'Deactivate' : 'Activate'} ${member.name}`}
    >
      {member.isActive ? (
        <>
          <UserX className="h-3.5 w-3.5" />
          Deactivate
        </>
      ) : (
        <>
          <UserCheck className="h-3.5 w-3.5" />
          Activate
        </>
      )}
    </button>
  ) : (
    /* Delete pending or expired invitations */
    <button
      type="button"
      onClick={() => {
        setDeleteError('')
        setMemberToDelete(member)
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      aria-label={`Delete invitation for ${member.name}`}
      title="Delete invitation"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )}
</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {isInviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isInviting) {
              setIsInviteOpen(false)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-dialog-title"
            className="my-auto w-full max-w-md rounded-xl border bg-background p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="invite-dialog-title"
                  className="text-lg font-semibold"
                >
                  {invitation ? 'Invitation created' : 'Invite a member'}
                </h2>
                <p className="text-sm text-muted-foreground">
  {invitation
    ? `An invitation email has been sent to ${invitation.email}.`
    : 'Invite someone to join your workspace.'}
</p>
              </div>

              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                aria-label="Close invitation dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {invitation ? (
              <div className="space-y-4">
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Invitation created successfully
                  </div>

                  <p className="text-sm">{invitation.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {invitation.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Role: {getRoleLabel(invitation.role)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expires: {new Date(invitation.expiresAt).toLocaleString()}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  This is a development-only token display. The invitee must
                  use it with the acceptance endpoint and set a password.
                  Email delivery and an acceptance page are not connected yet.
                </p>

                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="invite-name" className="text-sm font-medium">
                    Full name
                  </label>
                  <Input
                    id="invite-name"
                    placeholder="Enter full name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="invite-email"
                    className="text-sm font-medium"
                  >
                    Email address
                  </label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    maxLength={254}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="invite-role"
                    className="text-sm font-medium"
                  >
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as 'employee' | 'teamLeader')
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="teamLeader">Team Leader</option>
                  </select>
                </div>

                {inviteError && (
                  <p className="text-sm text-destructive" role="alert">
                    {inviteError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={isInviting}
                    onClick={() => setIsInviteOpen(false)}
                    className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {isInviting ? 'Creating...' : 'Create invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {memberToDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-member-title"
      aria-describedby="delete-member-description"
      className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl"
    >
      <h2 id="delete-member-title" className="text-lg font-semibold">
        Remove member?
      </h2>

      <p
        id="delete-member-description"
        className="mt-2 text-sm text-muted-foreground"
      >
        Remove {memberToDelete.name} from this workspace? Their account
        will be deactivated, not permanently deleted.
      </p>

      {deleteError && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => {
            setMemberToDelete(null)
            setDeleteError('')
          }}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={isDeleting}
          onClick={() => void handleDeleteMember()}
          className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
        >
          {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isDeleting ? 'Removing...' : 'Remove member'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}
