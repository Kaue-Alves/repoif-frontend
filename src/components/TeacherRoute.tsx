import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TeacherRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'TEACHER') return <Navigate to={`/profile/${user.username}`} replace />
  return <Outlet />
}
