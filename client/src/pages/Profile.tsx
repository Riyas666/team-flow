
import { useEffect, useState, useRef } from 'react'
import { apiRequest } from '@/lib/api'
import {
  UserRound,
  Mail,
  ShieldCheck,
  CalendarDays,
  Pencil,
  Save,
  X,
  Loader2,
  Camera,
  RefreshCw,
  Upload
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Role = 'owner' | 'teamLeader' | 'employee'

interface UserProfile {
  _id: string
  name: string
  email: string
  profilePicture: string | null
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

interface ProfileResponse {
  user: UserProfile
  message?: string
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

function getRoleLabel(role: Role) {
  if (role === 'owner') return 'Owner'
  if (role === 'teamLeader') return 'Team Leader'
  return 'Employee'
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [profilePicture, setProfilePicture] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
const [selectedImage, setSelectedImage] = useState<File | null>(null)
const [previewUrl, setPreviewUrl] = useState('')
const [isUploading, setIsUploading] = useState(false)
const [uploadError, setUploadError] = useState('')

  async function fetchProfile() {
    try {
      setIsLoading(true)
      setError('')

      const data = await apiRequest<ProfileResponse>('/api/users/me')

      setProfile(data.user)
      setName(data.user.name)
      setProfilePicture(data.user.profilePicture ?? '')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load your profile.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchProfile()
  }, [])

  function startEditing() {
    if (!profile) return

    setName(profile.name)
    setProfilePicture(profile.profilePicture ?? '')
    setError('')
    setSuccess('')
    setIsEditing(true)
  }

  function cancelEditing() {
    if (!profile) return

    setName(profile.name)
    setProfilePicture(profile.profilePicture ?? '')
    setError('')
    setIsEditing(false)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedName = name.trim()

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError('Name must be between 2 and 100 characters.')
      return
    }

    try {
      setIsSaving(true)
      setError('')
      setSuccess('')

      const data = await apiRequest<ProfileResponse>(
        '/api/users/me',
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: trimmedName,
          }),
        },
      )

      setProfile(data.user)
      setName(data.user.name)
      setProfilePicture(data.user.profilePicture ?? '')
      setIsEditing(false)
      setSuccess(data.message ?? 'Profile updated successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update your profile.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]
  if (!file) return

  setUploadError('')

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    setUploadError('Please select a JPG, PNG or WEBP image.')
    event.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    setUploadError('Image size must be less than 5 MB.')
    event.target.value = ''
    return
  }

  if (previewUrl) URL.revokeObjectURL(previewUrl)

  setSelectedImage(file)
  setPreviewUrl(URL.createObjectURL(file))
}

function clearSelectedImage() {
  if (previewUrl) URL.revokeObjectURL(previewUrl)

  setSelectedImage(null)
  setPreviewUrl('')

  if (fileInputRef.current) {
    fileInputRef.current.value = ''
  }
}

async function handleImageUpload() {
  if (!selectedImage) return

  setIsUploading(true)
  setUploadError('')

  try {
    const formData = new FormData()
    formData.append('profilePicture', selectedImage)

    const data = await apiRequest<{ user: UserProfile }>(
      '/api/users/me/profile-picture',
      {
        method: 'POST',
        body: formData,
      },
    )

    setProfile(data.user)
setProfilePicture(data.user.profilePicture ?? '')
clearSelectedImage()
setSuccess('Profile picture updated successfully.')
  } catch (error) {
    setUploadError(
      error instanceof Error
        ? error.message
        : 'Failed to upload profile picture.',
    )
  } finally {
    setIsUploading(false)
  }
}

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading your profile...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <UserRound className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Unable to load profile</h2>
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={() => void fetchProfile()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your personal information and account details.
          </p>
        </div>

        {!isEditing && (
          <Button onClick={startEditing}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit profile
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {success}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent sm:h-36" />

        <CardContent className="-mt-12 pb-6 sm:-mt-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-primary/10 text-2xl font-bold text-primary sm:h-28 sm:w-28">
              {previewUrl || profilePicture ? (
  <img
    src={previewUrl || profilePicture}
    alt={`${profile.name}'s profile`}
    className="h-full w-full object-cover"
    onError={(e) => {
      e.currentTarget.style.display = 'none'
    }}
  />
) : (
  getInitials(profile.name)
)}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h2 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
                {profile.name}
              </h2>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {profile.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {getRoleLabel(profile.role)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  profile.isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {profile.isActive ? 'Active account' : 'Inactive account'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Personal information</CardTitle>
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing || isSaving}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed here.
                </p>
              </div>

              {isEditing && (
  <div className="space-y-3">
    <Label>Profile picture</Label>

    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={handleImageSelect}
    />

    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {previewUrl || profilePicture ? (
          <img
            src={previewUrl || profilePicture}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">
          Upload a profile picture
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WEBP. Maximum size: 5 MB.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSaving}
          >
            <Camera className="mr-2 h-4 w-4" />
            Choose image
          </Button>

          {selectedImage && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleImageUpload()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload picture'}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearSelectedImage}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>

    {uploadError && (
      <p role="alert" className="text-sm text-destructive">
        {uploadError}
      </p>
    )}
  </div>
)}

              <div className="flex flex-wrap gap-3 pt-2">
                {isEditing ? (
                  <>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isSaving ? 'Saving...' : 'Save changes'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" onClick={startEditing}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit information
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="mt-1 break-all text-sm font-medium">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account role</p>
                <p className="mt-1 text-sm font-medium">
                  {getRoleLabel(profile.role)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joined TeamFlow</p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Account security
              </p>
              <p className="mt-1 text-sm">
                Your role and account status are managed securely by your workspace.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
