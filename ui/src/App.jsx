import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Documentation from './pages/Documentation'
import MakeABot from './pages/MakeABot'

function AppLayout({ children }) {
  return (
    <div>
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/documentation"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Documentation />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/make-a-bot"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MakeABot />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
