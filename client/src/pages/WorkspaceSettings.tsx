
import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface WorkspaceSettingsData {
  name: string
  description?: string
  logo?: string
}

interface WorkspaceSettingsResponse {
  success: boolean
  data: WorkspaceSettingsData
}

interface LogoUploadResponse {
  success: boolean
  message: string
  company: WorkspaceSettingsData
}

export default function WorkspaceSettings() {
  const [settings, setSettings] = useState<WorkspaceSettingsData>({
    name: '',
    description: '',
    logo: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Load workspace settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await apiRequest<WorkspaceSettingsResponse>(
          '/api/company/settings',
        )

        setSettings({
          name: response.data.name,
          description: response.data.description ?? '',
          logo: response.data.logo ?? '',
        })
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load workspace settings.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Update workspace settings
  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await apiRequest<WorkspaceSettingsResponse>(
        '/api/company/settings',
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: settings.name,
            description: settings.description,
          }),
        },
      )

      setSettings((previous) => ({
        ...previous,
        name: response.data.name,
        description: response.data.description ?? '',
        logo: response.data.logo ?? previous.logo ?? '',
      }))

      setMessage('Workspace settings saved successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save workspace settings.',
      )
    } finally {
      setSaving(false)
    }
  }

  // Upload company logo
  async function handleLogoUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    setMessage('')
    setError('')

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5 MB.')
      event.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('logo', file)

    try {
      setUploadingLogo(true)

      const response = await apiRequest<LogoUploadResponse>(
        '/api/company/settings/logo',
        {
          method: 'POST',
          body: formData,
        },
      )

      setSettings((previous) => ({
        ...previous,
        logo: response.company.logo ?? '',
      }))

      setMessage('Company logo uploaded successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload company logo.',
      )
    } finally {
      setUploadingLogo(false)
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading workspace settings...
      </p>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace Settings
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage your workspace information and company branding.
        </p>
      </div>

      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>
            Upload your company logo. It will appear in your workspace sidebar.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Company logo"
                className="h-20 w-20 rounded-lg border bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-2xl font-semibold">
                {settings.name.charAt(0).toUpperCase() || 'T'}
              </div>
            )}

            <div className="space-y-1">
              <p className="font-medium">
                {settings.name || 'Your Workspace'}
              </p>

              <p className="text-sm text-muted-foreground">
                PNG, JPG, WEBP or other supported image formats
              </p>

              <p className="text-xs text-muted-foreground">
                Maximum file size: 5 MB
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="company-logo"
              className="text-sm font-medium"
            >
              Upload Logo
            </label>

            <Input
              id="company-logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
            />
          </div>

          {uploadingLogo && (
            <p className="text-sm text-muted-foreground">
              Uploading company logo...
            </p>
          )}
        </CardContent>
      </Card>

      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>

          <CardDescription>
            Update your workspace name and description.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="workspace-name"
                className="text-sm font-medium"
              >
                Workspace Name
              </label>

              <Input
                id="workspace-name"
                value={settings.name}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="workspace-description"
                className="text-sm font-medium"
              >
                Description
              </label>

              <Textarea
                id="workspace-description"
                value={settings.description ?? ''}
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                maxLength={500}
                rows={4}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {message && (
        <p className="text-sm text-green-600" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
