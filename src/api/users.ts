import { getStoredToken } from './client'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface TeacherResult {
  id: string
  username: string
  role: 'TEACHER'
}

export interface Subject {
  id: string
  name: string
  description?: string
  isPublic: boolean
}

export interface UserProfile {
  username: string
  role: 'TEACHER' | 'STUDENT'
  subjects: Subject[]
}

function authHeader(): Record<string, string> {
  const t = getStoredToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function searchTeachers(q: string): Promise<TeacherResult[]> {
  const res = await fetch(`${BASE}/users/search?q=${encodeURIComponent(q)}`, {
    headers: authHeader(),
  })
  if (!res.ok) return []
  return res.json() as Promise<TeacherResult[]>
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  const res = await fetch(`${BASE}/users/${username}`, {
    headers: authHeader(),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(data.message ?? `Erro ${res.status}`)
  }
  return res.json() as Promise<UserProfile>
}
