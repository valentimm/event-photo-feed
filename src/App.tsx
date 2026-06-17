import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './lib/adminAuth'
import { AuthProvider } from './lib/auth'
import { HomePage } from './pages/HomePage'
import { EventPage } from './pages/EventPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminEventPage } from './pages/admin/AdminEventPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/e/:eventId" element={<EventPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/events/:eventId" element={<AdminEventPage />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
