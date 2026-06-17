import httpClient from '../../utils/httpClient'

export interface TeacherResult {
  id: string
  username: string
  role: 'TEACHER'
}

export async function searchTeachers(q: string): Promise<TeacherResult[]> {
  const { data } = await httpClient.get<TeacherResult[]>('/users/search', {
    params: { q },
  })
  return data
}
