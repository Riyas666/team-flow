
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { apiRequest } from '@/lib/api'
import { CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react'

interface AcceptInvitationResponse {
  message: string
  user: {
    id: string
    name: string
    email: string
    companyId: string
    role: 'owner' | 'teamLeader' | 'employee'
  }
}

export default function AcceptInvitation() {
  const token = new URLSearchParams(window.location.search).get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('The invitation link is missing its token.')
      return
    }

    if (password.length < 8 || password.length > 72) {
      setError('Password must be between 8 and 72 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await apiRequest<AcceptInvitationResponse>(
        '/api/invitations/accept',
        {
          method: 'POST',
          body: JSON.stringify({ token, password }),
        },
      )

      setMemberEmail(result.user.email)
      setAccepted(true)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to accept the invitation. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {accepted ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <ShieldCheck className="h-6 w-6" />
          )}
        </div>

        {accepted ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to TeamFlow!
            </h1>

            <p className="text-sm text-muted-foreground">
              Your invitation has been accepted and your account has been
              created successfully.
            </p>

            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Account email</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {memberEmail}
              </p>
            </div>

            <Link
              to="/auth"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              Accept your invitation
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Set a password to create your TeamFlow account.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="invite-password"
                  className="text-sm font-medium"
                >
                  Create password
                </label>

                <input
                  id="invite-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={72}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password again"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? 'Creating account...' : 'Accept invitation'}
              </button>

              {!token && !error && (
                <p className="text-sm text-destructive">
                  This invitation link does not contain a token.
                </p>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Your password is securely hashed by the server.
              </p>
            </form>
          </>
        )}
      </section>
    </main>
  )
}
