import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect
} from '@tanstack/react-router'
import App from './App'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Teams from './pages/Teams'
import Members from './pages/Members'
import Activity from './pages/Activity'
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import AcceptInvitation from './pages/AcceptInvitation'
import ProjectDetails from './pages/ProjectDetails'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import WorkspaceSettings from './pages/WorkspaceSettings'


function requireAuth() {
  const token = sessionStorage.getItem('teamflow_token')

  if (!token) {
    throw redirect({
      to: '/auth',
    })
  }
}

const rootRoute = createRootRoute({
    component: App,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const token = sessionStorage.getItem('teamflow_token')

    throw redirect({
      to: token ? '/dashboard' : '/auth',
    })
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: requireAuth,
  component: Dashboard,
})
const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  beforeLoad: requireAuth,
  component: Projects,
})

const projectDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId',
  beforeLoad: requireAuth,
  component: ProjectDetails,
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  beforeLoad: requireAuth,
  component: Tasks,
})

const teamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teams',
  beforeLoad: requireAuth,
  component: Teams,
})

const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/members',
  beforeLoad: requireAuth,
  component: Members,
})

const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activity',
  beforeLoad: requireAuth,
  component: Activity,
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: () => {
    requireAuth()

    const role = sessionStorage.getItem('teamflow_role')

    if (role !== 'owner' && role !== 'teamLeader') {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: Admin,
})

const workspaceSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspace-settings',
  beforeLoad: () => {
    requireAuth()

    const role = sessionStorage.getItem('teamflow_role')

    if (role !== 'owner') {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: WorkspaceSettings,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuth,
  component: Profile,
})

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  beforeLoad: () => {
    const token = sessionStorage.getItem('teamflow_token')

    if (token) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: Auth,
})

const acceptInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accept-invitation',
  component: AcceptInvitation,
})
const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPassword,
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ResetPassword,
})


const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  projectsRoute,
  tasksRoute,
  teamsRoute,
  membersRoute,
  activityRoute,
  adminRoute,
  workspaceSettingsRoute,
  profileRoute,
  authRoute,
  acceptInvitationRoute,
  projectDetailsRoute,
  forgotPasswordRoute,
  resetPasswordRoute
  
])

export const router = createRouter({
  routeTree,
})