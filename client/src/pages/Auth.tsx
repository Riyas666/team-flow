
import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { FolderKanban, LoaderCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface LoginResponse {
  message: string
  token: string
  user: {
    id: string
    name: string
    email: string
    companyId: string
    role: 'owner' | 'teamLeader' | 'employee'
  }
}

export default function Auth() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await apiRequest<LoginResponse>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        },
      )

      // Temporary until cookie-based authentication is implemented.
      sessionStorage.setItem('teamflow_token', result.token)
      sessionStorage.setItem('teamflow_role', result.user.role)

      await navigate({ to: '/dashboard' })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FolderKanban className="h-6 w-6 text-primary" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl">Welcome to TeamFlow</CardTitle>
            <CardDescription>
              Sign in to manage your workspace and projects.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
  <Link
    to="/forgot-password"
    className="text-sm font-medium text-primary hover:underline"
  >
    Forgot password?
  </Link>
</div>
            

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            

            <Button
              type="submit"
              className="w-full"
              disabled={!email.trim() || !password || isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
