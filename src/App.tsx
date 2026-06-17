import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import TeacherRoute from './components/TeacherRoute'
import { useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard/Dashboard'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import Login from './pages/Login/Login'
import Profile from './pages/Profile/Profile'
import Register from './pages/Register/Register'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import SubjectDetail from './pages/Subjects/SubjectDetail'
import SubjectEdit from './pages/Subjects/SubjectEdit'
import SubjectNew from './pages/Subjects/SubjectNew'
import VerifyEmail from './pages/VerifyEmail/VerifyEmail'

function RootRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'TEACHER') return <Navigate to="/dashboard" replace />
  return <Navigate to={`/profile/${user?.username}`} replace />
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/subjects/:id" element={<SubjectDetail />} />

      {/* Protected (any logged-in user) */}
      <Route element={<ProtectedRoute />}>
        {/* Teacher only */}
        <Route element={<TeacherRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subjects/new" element={<SubjectNew />} />
          <Route path="/subjects/:id/edit" element={<SubjectEdit />} />
        </Route>
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

export default App
