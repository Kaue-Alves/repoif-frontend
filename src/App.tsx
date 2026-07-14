import { Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import TeacherRoute from './components/TeacherRoute'
import { useAuth } from './contexts/AuthContext'
import { homePathFor } from './utils/roles'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminFiles from './pages/Admin/AdminFiles'
import AdminReports from './pages/Admin/AdminReports'
import AdminUsers from './pages/Admin/AdminUsers'
import AssignmentDetail from './pages/Assignments/AssignmentDetail'
import ClassroomDetail from './pages/Classrooms/ClassroomDetail'
import ClassroomList from './pages/Classrooms/ClassroomList'
import JoinClassroom from './pages/Classrooms/JoinClassroom'
import Dashboard from './pages/Dashboard/Dashboard'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ResendVerification from './pages/ResendVerification/ResendVerification'
import Login from './pages/Login/Login'
import NotFound from './pages/NotFound/NotFound'
import Profile from './pages/Profile/Profile'
import Register from './pages/Register/Register'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import Search from './pages/Search/Search'
import SubjectDetail from './pages/Subjects/SubjectDetail'
import SubjectEdit from './pages/Subjects/SubjectEdit'
import SubjectNew from './pages/Subjects/SubjectNew'
import VerifyEmail from './pages/VerifyEmail/VerifyEmail'

function RootRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  return <Navigate to={homePathFor(user)} replace />
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
      <Route path="/resend-verification" element={<ResendVerification />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected (any logged-in user) */}
      <Route element={<ProtectedRoute />}>
        {/* Buscar professores e ver perfis exige login */}
        <Route path="/search" element={<Search />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/subjects/:id" element={<SubjectDetail />} />
        <Route path="/assignments/:id" element={<AssignmentDetail />} />

        {/* Turmas (professor e aluno) */}
        <Route path="/classrooms" element={<ClassroomList />} />
        <Route path="/classrooms/join/:token" element={<JoinClassroom />} />
        <Route path="/classrooms/:id" element={<ClassroomDetail />} />

        {/* Teacher only */}
        <Route element={<TeacherRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subjects/new" element={<SubjectNew />} />
          <Route path="/subjects/:id/edit" element={<SubjectEdit />} />
        </Route>

        {/* Admin only */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/files" element={<AdminFiles />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
