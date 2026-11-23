import {
  createRootRoute,
  createRoute,
  createRouter,
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

function RoutePlaceholder({ name }: { name: string }) {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold">{name}</h1>
    </section>
  )
}

const rootRoute = createRootRoute({
    component: App,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <RoutePlaceholder name="TeamFlow" />,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
})

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: Projects,
})

const projectDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId',
  component: ProjectDetails,
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: Tasks,
})

const teamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teams',
  component: Teams,
})

const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/members',
  component: Members,
})

const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activity',
  component: Activity,
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: Admin,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: Profile,
})

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: Auth,
})

const acceptInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accept-invitation',
  component: AcceptInvitation,
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
  profileRoute,
  authRoute,
  acceptInvitationRoute,
  projectDetailsRoute
])

export const router = createRouter({
  routeTree,
})