import { AppShell } from "@/components/AppShell"
import { Outlet } from "@tanstack/react-router"

function App() {
  return (
    <AppShell>
      <Outlet/>
    </AppShell>
  )
}

export default App