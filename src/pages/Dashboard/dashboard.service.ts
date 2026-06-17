import httpClient from '../../utils/httpClient'

export interface Subject {
  id: string
  name: string
  description?: string
  isPublic: boolean
}

export async function getSubjects(): Promise<Subject[]> {
  const { data } = await httpClient.get<Subject[]>('/subjects')
  return data
}

export async function deleteSubject(id: string): Promise<void> {
  await httpClient.delete(`/subjects/${id}`)
}
