import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { homePathFor } from '../utils/roles'

export default function TeacherRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'TEACHER') return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}
